# Архитектура Бэкенда ⚙️

**5000 Words Backend** — это REST API на **Java 21 + Spring Boot 3.3**, полностью реализующий бизнес-логику обучения, геймификации, авторизации и мультиплеера. Все эндпоинты защищены JWT, каждый сервис следует принципу единственной ответственности (SRP).

---

## 🏗 Слоистая архитектура (N-Tier)

Бэкенд строго разделён на слои. Каждый слой знает только о следующем.

```
[ HTTP Request ]
       │
       ▼
┌────────────────────────────────────────────┐
│  Security Layer (JwtAuthFilter)            │
│  Перехватывает ВСЕ запросы.               │
│  Валидирует токен → кладёт userId в       │
│  SecurityContextHolder.                    │
└──────────────────────┬─────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────┐
│  Controller Layer (@RestController)        │
│  Принимает HTTP запрос, валидирует DTO    │
│  через @Valid, достаёт userId из          │
│  @AuthenticationPrincipal.                │
└──────────────────────┬─────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────┐
│  Service Layer (@Service)                  │
│  Вся бизнес-логика: SM-2, лиги, стрики,  │
│  дуэли, ачивки, лимиты подписки.          │
└──────────────────────┬─────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────┐
│  Repository Layer (Spring Data JPA)        │
│  Генерирует SQL из имён методов.           │
│  Сложные запросы — через @Query (JPQL).   │
└──────────────────────┬─────────────────────┘
                       │
                       ▼
                 [ PostgreSQL ]
```

---

## 📦 Все компоненты системы

| Пакет | Файлы | Назначение |
|-------|-------|------------|
| `config` | `SecurityConfig`, `DataSeeder`, `SubscriptionLimits` | Spring Security, сиды БД, константы лимитов |
| `controller` | 8 контроллеров | REST-эндпоинты |
| `dto` | 18 records | Объекты запросов и ответов |
| `entity` | 12 JPA-сущностей | Схема базы данных |
| `exception` | `GlobalExceptionHandler`, `AuthException` | Единый обработчик ошибок |
| `repository` | 12 репозиториев | Доступ к данным |
| `security` | `JwtAuthFilter`, `JwtService` | JWT авторизация |
| `service` | 9 сервисов | Бизнес-логика |

---

## 🔐 Слой безопасности в деталях

### `JwtService` — генерация и верификация токенов

Секретный ключ и срок действия берутся из `application.yml` через `@Value`. Ключ конвертируется в `SecretKey` через `Keys.hmacShaKeyFor()`.

```java
// Генерация — subject токена это строковое представление UUID пользователя
Jwts.builder()
    .subject(userId.toString())
    .issuedAt(now)
    .expiration(expiry)
    .signWith(signingKey)
    .compact();

// Верификация — если токен подделан или истёк, парсер выбросит исключение
UUID userId = UUID.fromString(
    Jwts.parser().verifyWith(signingKey).build()
        .parseSignedClaims(token).getPayload().getSubject()
);
```

### `JwtAuthFilter` — фильтр запросов (OncePerRequestFilter)

Spring гарантирует однократное выполнение на запрос. Логика:

1. Читает заголовок `Authorization: Bearer <token>`.
2. Если заголовка нет — пропускает запрос без аутентификации (норма для `/api/auth/**`).
3. Обрезает `"Bearer "` (7 символов), парсит UUID пользователя.
4. Проверяет что пользователь существует в БД и токен не истёк.
5. Создаёт `UsernamePasswordAuthenticationToken`, где username = userId как строка.
6. Кладёт в `SecurityContextHolder` — Spring Security считает запрос аутентифицированным.
7. Всё в `try/catch` — невалидный токен тихо игнорируется, Spring вернёт 401.

### `DataSeeder` — инициализация справочников

Реализует `ApplicationRunner` — выполняется один раз после старта. Идемпотентен: проверяет `count() > 0` перед вставкой.

Заполняет 10 языков (`en, ru, de, fr, es, it, pt, zh, ja, ko`) и 8 ачивок с кодами, описаниями и XP-наградами.

---

## 🧠 Ключевые сервисы

### `Sm2Service` — алгоритм SM-2

`easinessFactor` хранится как целое число ×100 (250 = 2.5), чтобы избежать float в БД.

**Правильный ответ:**
```
repetitions == 0  → interval = 1 день
repetitions == 1  → interval = 6 дней
repetitions > 1   → interval = round(prevInterval × easinessFactor / 100)

delta = round(100 × (0.1 − (5 − quality) × (0.08 + (5 − quality) × 0.02)))
newEF = max(MIN_EF, easinessFactor + delta)
repetitions += 1
nextReview = сегодня + newInterval
```

**Неправильный ответ:**
```
repetitions = 0       ← обнуляем счётчик успехов
intervalDays = 1      ← показать завтра снова
errorCount += 1       ← копится для режима "Сложные слова"
nextReview = завтра
easinessFactor не меняется при ошибке
```

**Статус слова:**
```
intervalDays > 60 → MASTERED  (слово хорошо усвоено)
иначе             → LEARNING
```

---

### `SessionService` — управление сессиями

Главный оркестратор. Координирует SM-2, лимиты, XP, стрики и ачивки.

**`startSession()` — алгоритм подбора слов:**

```
1. Проверка лимита (только FREE, только режим != MATCHING):
   newWordsToday = COUNT user_word_progress WHERE user_id = ? AND created_at >= сегодня 00:00
   если >= 50 → выбросить "Дневной лимит 50 новых слов исчерпан. Оформите Premium."

2. Шаг 1 — SM-2 очередь (слова с долгом повторения):
   SELECT * FROM user_word_progress
   WHERE user_id = ? AND next_review <= сегодня
   LIMIT sessionSize
   → для каждого найти перевод на langTo

3. Шаг 2 — новые слова (если набор неполный после шага 1):
   seenWordIds = все word_id которые пользователь уже встречал
   SELECT translations WHERE langFrom = ? AND langTo = ?
     AND word_id NOT IN (seenWordIds)
   → для каждого нового слова создать UserWordProgress (nextReview = сегодня)
   → перемешать случайно

4. Создать Session записать в БД
5. Вернуть SessionStartResponse с WordCardDto картами
```

**`finishSession()` — обработка результатов:**

```
Для каждого WordResult из запроса:
  → найти UserWordProgress(userId, wordId)
  → sm2Service.update(progress, quality)
  → сохранить

Подсчёт XP:
  xpEarned = correct × 10
            + (accuracy >= 90% ? 50 : accuracy >= 70% ? 20 : 0)

Уровень: newLevel = (totalXp / 500) + 1

accuracyDelta = currentAccuracy − previousSessionAccuracy (для отображения +/-%)

Лига:
  leagueBefore = xpBefore / 10000
  leagueAfter  = (xpBefore + xpEarned) / 10000
  если leagueAfter > leagueBefore → newLeagueName ≠ null (фронтенд покажет экран лиги)

→ streakService.updateStreak(user)
→ achievementService.checkAfterSession(...)
→ вернуть SessionFinishResponse
```

**`startDifficultWordsSession()`:**

Берёт 20 слов с наибольшим `errorCount` через `findMostDifficultWords(userId, PageRequest.of(0, 20))`. Запускает всегда в режиме `WRITING` — наиболее строгая проверка. Не учитывает SM-2 очередь — только errorCount.

---

### `StreakService` — стрики и заморозка Premium

Возвращает `record StreakResult(int streakDays, boolean increased, boolean freezeUsed)`.

```
lastActive == сегодня
  → уже засчитано, вернуть без изменений (false, false)

lastActive == вчера
  → streakDays += 1, increased = true

lastActive == позавчера
  И tier == PREMIUM
  И (lastFreezeUsed == null ИЛИ lastFreezeUsed < сегодня − 30 дней)
  → streakDays += 1, lastFreezeUsed = сегодня, freezeUsed = true
  (фронтенд увидит freezeUsed=true и покажет ледяной экран)

иначе
  → streakDays = 1 (сброс)

lastActive = сегодня, сохранить пользователя
```

---

### `LeagueService` — лиги без хранения в БД

```java
int leagueNumber = totalXp / 10_000;  // 0 = Черепаха, 1 = Кролик, ...
int xpInLeague   = totalXp % 10_000;
int xpToNext     = 10_000 - xpInLeague;

// Лидерборд — только пользователи в одном диапазоне XP
int minXp = leagueNumber * 10_000;
int maxXp = minXp + 9_999;
List<User> peers = userRepository.findByXpBetweenOrderByXpDesc(minXp, maxXp);
```

Лига вычисляется на лету — никаких триггеров и фоновых задач для синхронизации.

Название лиги (по индексу): `Черепаха → Кролик → Лиса → Сова → Волк → Пантера → Тигр → Медведь → Дракон → Феникс → Легенда`

---

### `AchievementService` — ачивки

Идемпотентный `tryAward()`: проверяет `existsByUserIdAndAchievementId` — повторная выдача невозможна.

| Код | Условие |
|-----|---------|
| `FIRST_SESSION` | `totalUserSessions == 1` |
| `PERFECT_SESSION` | `accuracy >= 100%` и слов > 0 |
| `STREAK_3` | `streakDays >= 3` |
| `STREAK_7` | `streakDays >= 7` |
| `STREAK_30` | `streakDays >= 30` |
| `WORDS_100` | `masteredCount >= 100` |
| `WORDS_500` | `masteredCount >= 500` |
| `WORDS_1000` | `masteredCount >= 1000` |

Возвращает список кодов новых ачивок → кладётся в `SessionFinishResponse.newAchievements`.

---

### `DuelService` — асинхронный PvP

```
challenge(creatorId, opponentId, langFrom, langTo):
  1. Найти слова, знакомые ОБОИМ игрокам через UserWordProgress
  2. Случайно выбрать 10 слов
  3. Сохранить их ID как строку "14,29,43,..." в duel.wordIds
  4. Создать Duel со статусом PENDING

acceptDuel(duelId, opponentId):
  → status = IN_PROGRESS

getDuelWords(duelId, userId):
  → Распарсить wordIds из строки → загрузить Translation → WordCardDto[]

finishDuel(duelId, userId, accuracy):
  Если userId == creator → duel.creatorAccuracy = accuracy
  Если userId == opponent → duel.opponentAccuracy = accuracy

  Если оба установили accuracy:
    creatorAccuracy > opponentAccuracy → winner = creator
    opponentAccuracy > creatorAccuracy → winner = opponent
    равно → winner = null (ничья)
    status = FINISHED, finishedAt = now()
```

---

### `FriendService` — друзья с ограничениями

**Поиск** — case-insensitive JPQL:
```sql
WHERE lower(u.username) LIKE lower(concat('%', :query, '%'))
AND u.id != :currentUserId
```

**Лимит** проверяется ДО похода за `addressee` в БД:
```java
long count = friendshipRepository.countAcceptedFriendships(requesterId);
if (count >= 5) throw new IllegalArgumentException("Бесплатный план ограничен 5 друзьями...");
```

---

## 🌐 Полная таблица REST API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация, возвращает JWT |
| POST | `/api/auth/login` | Логин, возвращает JWT |
| POST | `/api/sessions/start` | Начать сессию (SM-2 + новые слова) |
| POST | `/api/sessions/start-difficult` | Сессия из 20 самых сложных слов |
| POST | `/api/sessions/finish` | Завершить, обновить SM-2, начислить XP |
| GET | `/api/users/profile` | Профиль текущего пользователя |
| GET | `/api/users/stats` | Статистика (встречено, изучено, сессии) |
| GET | `/api/users/leaderboard/friends` | Рейтинг среди друзей |
| GET | `/api/leagues` | Текущая лига + лидерборд лиги |
| POST | `/api/duels/challenge` | Вызвать на дуэль |
| POST | `/api/duels/{id}/accept` | Принять вызов |
| POST | `/api/duels/{id}/decline` | Отклонить вызов |
| GET | `/api/duels/{id}/words` | Получить слова дуэли |
| POST | `/api/duels/finish` | Завершить дуэль |
| GET | `/api/duels/{id}/status` | Статус дуэли (polling) |
| GET | `/api/duels/challenges` | Входящие вызовы |
| GET | `/api/duels/history` | История дуэлей |
| GET | `/api/friends` | Список друзей |
| GET | `/api/friends/requests` | Входящие заявки |
| POST | `/api/friends/request/{id}` | Отправить заявку |
| POST | `/api/friends/accept/{id}` | Принять заявку |
| POST | `/api/friends/decline/{id}` | Отклонить заявку |
| DELETE | `/api/friends/{id}` | Удалить друга |
| GET | `/api/friends/search?q=` | Поиск пользователей |
| GET | `/api/achievements` | Ачивки (с флагом earned и earnedAt) |
| GET | `/api/languages` | Список поддерживаемых языков |

---

## 🛑 GlobalExceptionHandler

`@RestControllerAdvice` перехватывает все исключения. Фронтенд получает предсказуемый JSON вместо HTML стектрейса.

| Исключение | HTTP | Когда |
|------------|------|-------|
| `AuthException` | 400 | Неверный пароль, email занят |
| `IllegalArgumentException` | 400 | Лимит слов/друзей, сущность не найдена |
| `MethodArgumentNotValidException` | 400 | @Valid провалился (пустые поля, формат) |
| `NoResourceFoundException` | 404 | Несуществующий endpoint |
| `Exception` | 500 | Любая необработанная ошибка |

```json
{
  "status": 400,
  "message": "Бесплатный план ограничен 5 друзьями. Оформите Premium для безлимита.",
  "errors": {}
}
```
