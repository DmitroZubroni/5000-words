# Архитектура Бэкенда ⚙️

**5000 Words Backend** — это REST API сервис на **Java 21 + Spring Boot 3.3**, реализующий всю бизнес-логику приложения: обучение, геймификацию и мультиплеер.

---

## 🏗 Слоистая архитектура

Бэкенд следует классической N-Tier архитектуре с чётким разделением ответственности.

```
[ HTTP Request ]
      │
      ▼
┌─────────────────────────────────────┐
│          Security Layer             │
│  JwtAuthFilter                      │
│  • Перехватывает все запросы        │
│  • Валидирует JWT подпись           │
│  • Кладёт userId в SecurityContext  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│          Controller Layer           │
│  @RestController                    │
│  • Принимает HTTP запрос            │
│  • Валидирует данные (@Valid)       │
│  • Достаёт userId из Principal      │
│  • Возвращает DTO                   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│           Service Layer             │
│  @Service / @Transactional          │
│  • Бизнес-логика и алгоритмы        │
│  • SM-2, Стрики, Лиги, Дуэли       │
│  • Выбрасывает бизнес-исключения    │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│        Repository Layer             │
│  Spring Data JPA                    │
│  • Генерирует SQL по именам методов │
│  • Кастомные @Query (JPQL)          │
└────────────────┬────────────────────┘
                 │
                 ▼
          [ PostgreSQL ]
```

---

## 🔐 Безопасность (Security Layer)

Авторизация построена на **Stateless JWT** — сервер не хранит сессии, токен содержит всё необходимое.

**Поток авторизации:**
1. Клиент отправляет `POST /api/auth/login` с email и паролем.
2. `AuthService` сверяет пароль через `BCrypt.matches()`.
3. `JwtService` подписывает токен секретным HMAC-ключом и возвращает его.
4. Клиент сохраняет токен и передаёт его в каждом запросе: `Authorization: Bearer <token>`.
5. `JwtAuthFilter` перехватывает запрос, парсит токен, извлекает `userId` и помещает его в `SecurityContextHolder`.
6. Контроллеры получают пользователя через `@AuthenticationPrincipal UserDetails`.

**Конфигурация Spring Security:**
- Публичные пути (`/api/auth/**`) разрешены без токена.
- Все остальные пути требуют валидного JWT.
- CORS настроен для локальной разработки (`localhost:5173`).

---

## 🧠 Ключевые сервисы

### `SessionService` — Движок SM-2

Самый сложный сервис. Отвечает за генерацию сессий и обновление прогресса.

**`startSession()` — подбор слов:**
```
1. Проверить лимит новых слов за сегодня (50 для Free)
2. Найти слова с nextReview <= сегодня (due words — в приоритете)
3. Если набор не полон — добрать новые слова из базы
4. Случайно перемешать и вернуть клиенту
```

**`finishSession()` — обновление SM-2:**
```
Для каждого ответа:
  Если правильный:
    repetitions += 1
    interval = interval * easinessFactor / 100
    easinessFactor += 5 (слово даётся легче)
  Если неправильный:
    repetitions = 0
    interval = 1 (начать повторение заново)
    easinessFactor -= 20 (слово сложнее)
    errorCount += 1

nextReview = сегодня + interval
```

После финиша сессии также запускаются: `StreakService`, `AchievementService`, `LeagueService`.

---

### `StreakService` — Стрики и Заморозка

Обновляет ежедневный стрик при завершении сессии.

```
lastActive == сегодня   → уже засчитано, ничего не делать
lastActive == вчера     → стрик продолжается, +1
lastActive == позавчера + PREMIUM + заморозка не использовалась 30 дней
                        → простить пропуск, +1, зафиксировать дату заморозки
иначе                   → стрик сброшен на 1
```

Возвращает в ответ флаг `freezeUsed`, на который реагирует фронтенд (ледяной экран vs огненный).

---

### `LeagueService` — Система Лиг

Лига не хранится в БД — вычисляется из XP каждый раз. Это исключает рассинхронизацию данных.

```
leagueNumber = user.xp / 10000
leagueMinXp  = leagueNumber * 10000
leagueMaxXp  = leagueMinXp + 9999

// Лидерборд — все пользователи в том же диапазоне XP
users = findByXpBetweenOrderByXpDesc(leagueMinXp, leagueMaxXp)
```

Названия лиг по возрастанию: Черепаха → Кролик → Лиса → Сова → Волк → Пантера → Тигр → Медведь → Дракон → Феникс → Легенда.

---

### `DuelService` — Асинхронные PvP Дуэли

```
challenge():
  1. Найти общие слова, известные обоим игрокам
  2. Случайно выбрать 10 штук, сохранить их ID в duel.wordIds
  3. Создать дуэль со статусом PENDING

finishDuel():
  1. Сохранить accuracy вызванного / создателя
  2. Если оба финишировали → сравнить accuracy и назначить winner
  3. Изменить статус на FINISHED
```

---

### `FriendService` — Друзья

- Поиск пользователей регистронезависим (`LOWER(username) LIKE LOWER(query)`).
- Лимит 5 друзей для Free-аккаунтов проверяется **до** создания заявки.
- Статусная машина дружбы: `PENDING` → `ACCEPTED` / `DECLINED`.

---

## 🌐 REST API

| Контроллер | Маршруты | Назначение |
|------------|----------|------------|
| `AuthController` | `POST /api/auth/register`, `/login` | Регистрация и авторизация |
| `SessionController` | `POST /api/sessions/start`, `/finish`, `/start-difficult` | Управление сессиями |
| `UserController` | `GET /api/users/profile`, `/stats`, `/leaderboard/friends` | Профиль и статистика |
| `LeagueController` | `GET /api/leagues` | Информация о текущей лиге |
| `DuelController` | `POST /api/duels/challenge`, `/accept`, `/finish`, `/decline` | Дуэли |
| `FriendController` | `GET/POST /api/friends`, `/search`, `/request`, `/accept` | Друзья |
| `AchievementController` | `GET /api/achievements` | Ачивки пользователя |
| `LanguageController` | `GET /api/languages` | Список доступных языков |

---

## 🛑 Обработка ошибок

`GlobalExceptionHandler` (`@RestControllerAdvice`) перехватывает все исключения и возвращает единый JSON-формат без Java-стектрейсов:

```json
{
  "status": 400,
  "message": "Бесплатный план ограничен 5 друзьями. Оформите Premium для безлимита."
}
```

Фронтенд парсит `message` и либо показывает тост, либо перенаправляет на `/premium`.

| Исключение | HTTP-статус |
|------------|-------------|
| `AuthException` | 400 |
| `IllegalArgumentException` | 400 |
| `MethodArgumentNotValidException` | 400 |
| `NoResourceFoundException` | 404 |
| `Exception` (всё остальное) | 500 |
