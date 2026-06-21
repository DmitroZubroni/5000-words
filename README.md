# База данных — архитектура и логика

Документ описывает архитектуру бэкенда приложения для изучения слов — структуру БД, слои entity/repository/service/controller, security и причины всех проектных решений. Используется как справочник при дальнейшей разработке.

## Стек

- **PostgreSQL 16+**
- **Hibernate / Spring Data JPA** — ORM слой, схема генерируется из Java-entity (`ddl-auto: create-drop` на этапе разработки)
- **UUID v7** для таблиц с пользовательскими данными (через `f4b6a3/uuid-creator`, генерация в `@PrePersist`)
- **Integer/Long автоинкремент** для справочных и связующих таблиц

---

## Общая схема связей

```
languages ──┬──< words ──< translations >── languages
            │       │
            │       ├──< user_word_progress >── users
            │       └──< custom_set_words >── custom_sets >── users
            │
            └──< sessions (lang_from / lang_to) >── users

achievements ──< user_achievements >── users
```

---

## Таблицы

### 1. `users`

Основная таблица пользователей. Хранит профиль, прогресс геймификации и подписку.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | UUID v7 | Первичный ключ. v7 вместо v4 — чтобы новые записи вставлялись в конец B-tree индекса последовательно и не вызывали page split |
| `email`, `username` | varchar, unique | Идентификация и логин |
| `password_hash` | varchar | Хеш пароля, никогда не отдаётся на фронт |
| `app_language` | varchar | Язык интерфейса приложения |
| `subscription_tier` | enum (FREE / PREMIUM) | Заложено для монетизации с самого начала — проверяется в middleware/service слое |
| `xp`, `level`, `streak_days` | integer | Геймификация — очки опыта, уровень, дни подряд |
| `last_active` | date | Используется для расчёта стрика |
| `created_at` | timestamp | Автоматически через `@CreationTimestamp` |

**Почему UUID v7, а не SERIAL**: id пользователя используется как внешний ключ почти во всех таблицах прогресса и статистики. Случайный UUID v4 на таблицах с высокой частотой вставок (`user_word_progress`, `sessions`) приводил бы к фрагментации индексов.

---

### 2. `languages`

Справочник из 10 поддерживаемых языков. Заполняется один раз при инициализации, пользователями не изменяется.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | Integer (IDENTITY) | Простой автоинкремент — справочник маленький и статичный, UUID избыточен |
| `code` | varchar(10), unique | ISO 639-1 код (`en`, `ru`, `de`) — ограничение длины как constraint, не как оптимизация места |
| `name` | varchar, unique | Отображаемое имя языка |

---

### 3. `words`

Слова на конкретном языке. Сами переводы не хранятся здесь — только исходное слово, язык и тема.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | Integer (IDENTITY) | Автоинкремент — справочные данные, заполняются один раз при сидировании |
| `language_id` | FK → languages | `@ManyToOne(LAZY)` — много слов принадлежат одному языку |
| `word` | varchar | Само слово |
| `topic` | varchar | Тематический пак (Бизнес, Путешествия и т.д.) — основа для фильтрации наборов |

**Индекс**: `idx_words_lang_topic (language_id, topic)` — ускоряет выборку слов конкретного языка и темы при формировании набора для сессии.

---

### 4. `translations`

Переводы слов. Одно слово из `words` может иметь до 9 переводов (на все остальные языки).

| Поле | Тип | Назначение |
|---|---|---|
| `id` | Integer (IDENTITY) | Автоинкремент |
| `word_id` | FK → words | `@ManyToOne(LAZY)` — исходное слово |
| `target_language_id` | FK → languages | `@ManyToOne(LAZY)` — язык перевода |
| `translation` | varchar | Перевод слова |
| `example_sentence` | TEXT | Пример использования. `TEXT`, а не `varchar(255)` — предложение не ограничено длиной |

**Индекс**: `idx_translations_word_lang (word_id, target_language_id)` — это основной запрос игровой сессии: *"дай перевод слова X на язык Y"*. Без индекса — полный скан таблицы из ~50 000 строк на каждое слово сессии.

**Почему отдельная таблица, а не колонки `translation_en`, `translation_ru` ... в `words`**: фиксированные колонки под каждый язык не масштабируются (добавление 11-го языка = миграция схемы) и хранят NULL для большинства комбинаций. Отдельная таблица — гибкая и компактная.

---

### 5. `user_word_progress`

Сердце приложения — состояние SM-2 алгоритма для каждой пары (пользователь, слово). Создаётся **лениво**: запись появляется только при первой встрече пользователя со словом, а не при регистрации (иначе сразу 5000 строк на нового пользователя).

| Поле | Тип | Назначение |
|---|---|---|
| `id` | UUID v7 | Первичный ключ |
| `user_id` | FK → users | `@ManyToOne(LAZY)` |
| `word_id` | FK → words | `@ManyToOne(LAZY)` |
| `easiness_factor` | Integer (×100) | Коэффициент лёгкости SM-2. Хранится как `250` вместо `2.5` — целые числа избегают ошибок округления float при умножении |
| `interval_days` | Integer | Текущий интервал до следующего повторения |
| `repetitions` | Integer | Успешных повторений подряд; сбрасывается в 0 при ошибке |
| `error_count` | Integer | Суммарные ошибки по слову — основа для подборки "Сложные слова" |
| `next_review` | date | Дата следующего показа — главный критерий выборки слов для сессии |
| `last_seen` | timestamp | Когда слово показывалось последний раз |
| `status` | enum (LEARNING / MASTERED / FORGOTTEN) | LEARNING — активно учится; MASTERED — `interval_days > 60`; FORGOTTEN — пользователь не заходил долго, требует повторного освоения. Записи **не удаляются** — иначе теряется история прогресса и долгосрочные повторения |

**Индексы**:
- `idx_uwp_user_review (user_id, next_review)` — главный запрос: *"слова этого пользователя, готовые к повторению сегодня"* (`WHERE user_id = ? AND next_review <= CURRENT_DATE`)
- `idx_uwp_word (word_id)` — обновление прогресса после ответа, поиск по слову

---

### 6. `sessions`

Одна запись = одна завершённая (или начатая) игровая сессия. Источник данных для статистики и динамики между сессиями.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | UUID v7 | Первичный ключ |
| `user_id` | FK → users | `@ManyToOne(LAZY)` |
| `mode` | enum (MATCHING / WRITING / TIME_ATTACK / SURVIVAL / BOSS_ROUND) | Режим тренировки |
| `lang_from_id`, `lang_to_id` | FK → languages | Языковая пара сессии |
| `total_words`, `correct`, `incorrect` | Integer | Результаты для расчёта точности |
| `duration_seconds` | Integer | Длительность |
| `started_at` | timestamp | Проставляется при старте |
| `finished_at` | timestamp, nullable | `NULL`, если сессия не была завершена — такие записи не учитываются в статистике |

**Индекс**: `idx_sessions_user_date (user_id, finished_at)` — запрос статистики *"сессии пользователя за последние N дней"*, агрегируется через `GROUP BY` и оконные функции PostgreSQL на стороне БД.

---

### 7. `achievements`

Справочник всех возможных ачивок. Заполняется при инициализации.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | Integer (IDENTITY) | Автоинкремент |
| `code` | varchar(50), unique | Человекочитаемый код (`STREAK_7`, `WORDS_100`) — используется в бизнес-логике вместо "магического" id |
| `title`, `description` | varchar / TEXT | Текст для пользователя |
| `xp_reward` | Integer | Сколько XP даёт получение ачивки |

---

### 8. `user_achievements`

Связь "пользователь получил ачивку". Одна запись = одно полученное достижение.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | UUID v7 | Первичный ключ |
| `user_id` | FK → users | `@ManyToOne(LAZY)` |
| `achievement_id` | FK → achievements | `@ManyToOne(LAZY)` |
| `earned_at` | timestamp | Время получения, для сортировки в кабинете |

**Constraint**: `uq_user_achievement (user_id, achievement_id)` — `@UniqueConstraint`, гарантирует на уровне БД, что одна ачивка не может быть выдана пользователю дважды, и одновременно создаёт индекс под этот поиск.

---

### 9. `custom_sets` и `custom_set_words`

Пользовательские наборы слов, реализация связи многие-ко-многим **вручную** (не через `@ManyToMany`).

**`custom_sets`**

| Поле | Тип | Назначение |
|---|---|---|
| `id` | UUID v7 | Первичный ключ |
| `user_id` | FK → users | Автор набора |
| `title` | varchar | Название |
| `is_public` | boolean | Виден ли набор в общем каталоге |
| `created_at` | timestamp | `@CreationTimestamp` |

Индексы: `idx_custom_sets_user (user_id)`, `idx_custom_sets_public (is_public)`.

**`custom_set_words`**

| Поле | Тип | Назначение |
|---|---|---|
| `id` | Long (IDENTITY) | Автоинкремент — у связующей таблицы нет собственного бизнес-смысла, UUID избыточен |
| `set_id` | FK → custom_sets | `@ManyToOne(LAZY)` |
| `word_id` | FK → words | `@ManyToOne(LAZY)` |

**Constraint**: `uq_set_word (set_id, word_id)` — слово не может быть добавлено в один набор дважды.

**Почему не `@ManyToMany`**: отдельный entity даёт полный контроль над промежуточной таблицей (можно добавить поля — например порядок слов — без миграции схемы) и избегает классической проблемы N+1 запросов, типичной для `@ManyToMany` в Hibernate.

---

## Общие принципы, применённые во всей схеме

1. **UUID v7 для пользовательских данных** (`users`, `user_word_progress`, `sessions`, `user_achievements`, `custom_sets`) — последовательная вставка в индекс, без page split. Генерируется вручную в `@PrePersist` через `UuidCreator.getTimeOrderedEpoch()`.
2. **Integer/Long автоинкремент для справочников и связок** (`languages`, `words`, `translations`, `achievements`, `custom_set_words`) — записи создаются редко, бизнес-смысла в "непредсказуемости" id нет.
3. **`FetchType.LAZY` на всех `@ManyToOne`** — связанные сущности подгружаются только при явном обращении, без неожиданных JOIN-ов.
4. **`@Enumerated(EnumType.STRING)`** для всех enum-полей — в БД хранится читаемая строка с `CHECK`-constraint, а не "магическое" число, которое поедет при изменении порядка значений enum.
5. **Денормализация переводов в отдельную таблицу** вместо колонок-языков — масштабируется на любое число языков без миграций схемы.
6. **Ленивое создание прогресса** (`user_word_progress`) — запись появляется только при первой встрече со словом, а не при регистрации.
7. **Soft-статусы вместо удаления** (`status` в `user_word_progress`) — сохраняется история обучения и возможность долгосрочных повторений.

---

## Текущий статус разработки

- ✅ Слой `entity` — все 9 таблиц спроектированы, индексы и constraints проверены через сгенерированный Hibernate DDL
- ✅ Слой `repository` — все 9 репозиториев созданы, включая JOIN FETCH для предотвращения LazyInitializationException
- ✅ Слой `service` — `AuthService`, `UserService`, `Sm2Service`, `SessionService`, `StatsService` готовы
- ✅ Слой `controller` — `AuthController`, `UserController`, `SessionController`, `LanguageController` готовы
- ✅ Слой `security` — JWT полностью настроен, endpoints защищены
- ✅ Data seeding — языки, ачивки, 5000 английских слов с переводами
- ⬜ Дуэли — запланированы после фронтенда (polling подход)
- ⬜ Фронтенд — React + Vite, следующий этап

**Все endpoints бэкенда:**
```
POST /api/auth/register          — регистрация + JWT (публичный)
POST /api/auth/login             — логин + JWT (публичный)
GET  /api/languages              — список языков (публичный)
GET  /api/users/me               — профиль пользователя (JWT)
GET  /api/users/stats            — статистика пользователя (JWT)
GET  /api/users/leaderboard      — таблица лидеров топ-50 (JWT)
GET  /api/users/difficult-words  — сложные слова пользователя (JWT)
POST /api/sessions/start         — запуск игровой сессии (JWT)
POST /api/sessions/finish        — завершение + SM-2 обновление (JWT)
```

**Поведение по HTTP статусам:**
```
Без токена            → 401 + JSON
Невалидный токен      → 401 + JSON
Ошибка валидации      → 400 + Map полей с ошибками
Бизнес-ошибка         → 400 + сообщение
Несуществующий путь   → 404 + JSON
Неожиданная ошибка    → 500 + JSON без стектрейса
```


---

## Слой `repository`

Repository в Spring Data JPA — это **интерфейс**, а не класс. Spring генерирует реализацию автоматически во время старта приложения: по имени метода (**derived queries**) или по явно написанному запросу (**`@Query`**, на JPQL).

Каждый репозиторий наследует `JpaRepository<Entity, IdType>` и бесплатно получает `save()`, `findById()`, `findAll()`, `deleteById()`, `count()` и другие базовые методы без единой строки кода.

### 1. `LanguageRepository`

Справочник языков, почти без логики.

| Метод | Назначение |
|---|---|
| `findByCode(String code)` | Найти язык по ISO-коду. Используется при сидировании данных и валидации языковой пары пользователя |

---

### 2. `WordRepository`

Первый репозиторий с кастомным JPQL.

| Метод | Назначение |
|---|---|
| `findByLanguageAndOptionalTopic(languageId, topic)` | Слова языка, опционально отфильтрованные по теме. Формирование тематического набора для сессии |
| `findDistinctTopicsByLanguage(languageId)` | Список уникальных тем языка — для UI выбора тематического пака |

**Почему `(:topic IS NULL OR w.topic = :topic)`**: в SQL `NULL = NULL` даёт `NULL` (а не `TRUE`), поэтому прямое сравнение с `null`-параметром вернуло бы пустой результат. Конструкция `:topic IS NULL OR ...` делает фильтр по теме опциональным — если параметр не передан, условие всегда истинно и фильтрация не применяется.

**JPQL vs SQL**: запросы пишутся через имена Java-сущностей и полей (`w.language.id`), а не через имена таблиц и колонок (`language_id`). Hibernate сам транслирует обращение через `@ManyToOne`-связь в правильный SQL JOIN/колонку.

---

### 3. `TranslationRepository`

Самый "горячий" репозиторий — обслуживает каждое слово игровой сессии.

| Метод | Назначение |
|---|---|
| `findByWordAndTargetLanguage(wordId, targetLanguageId)` | Перевод одного слова на целевой язык. Покрывается индексом `idx_translations_word_lang` |
| `findByWordIdsAndTargetLanguage(wordIds, targetLanguageId)` | Переводы **пачки** слов одним запросом (`WHERE word_id IN (...)`) |

**Почему важен второй метод — проблема N+1**: если для сессии из 20 слов запрашивать перевод каждого слова отдельным вызовом `findByWordAndTargetLanguage` в цикле — это 20 отдельных SQL-запросов (20 сетевых round-trip к БД). `findByWordIdsAndTargetLanguage` решает это одним запросом с `IN (...)`, результат группируется в `Map<Integer, Translation>` в Java. Это называется **batch fetching** — одна из самых частых проблем производительности в Spring-приложениях, и с ней стоит бороться с самого начала.

---

### 4. `UserWordProgressRepository`

Центральный репозиторий — здесь живут запросы SM-2 алгоритма.

| Метод | Назначение |
|---|---|
| `findByUserIdAndWordId(userId, wordId)` | Есть ли у пользователя прогресс по слову — иначе создаём новую запись |
| `findDueForReview(userId, today, pageable)` | Слова, готовые к повторению сегодня, отсортированы по `next_review`. Покрывается индексом `idx_uwp_user_review` |
| `findMostDifficultWords(userId, pageable)` | "Сложные слова" — сортировка по `error_count DESC`, для отдельной папки повторения |
| `countByStatusForUser(userId)` | Подсчёт слов по статусу (LEARNING/MASTERED/FORGOTTEN) для статистики кабинета |

**`Pageable`**: вместо хардкода `LIMIT` в запросе передаётся объект `Pageable` (например `PageRequest.of(0, 20)`). Spring сам добавляет `LIMIT`/`OFFSET` в сгенерированный SQL. Это позволяет варьировать размер выборки динамически — 5 слов для сопоставления, 20 для босс-раунда — без дублирования запросов.

**`List<Object[]>` в `countByStatusForUser`**: запрос возвращает не сущности, а проекцию `(status, count)` — каждая строка результата это `Object[]` где `[0]` статус, `[1]` число. Рабочий, но не типобезопасный вариант; позже может быть заменён на **constructor expression** (`SELECT new ...DTO(uwp.status, COUNT(uwp)) FROM ...`), где Hibernate создаёт DTO-объекты напрямую из результата запроса. Решено отложить до этапа `service`.

---

### 5. `SessionRepository`

| Метод | Назначение |
|---|---|
| `findFinishedSessionsSince(userId, since)` | Завершённые сессии за период, новые сверху. Покрывается индексом `idx_sessions_user_date`. `finished_at IS NOT NULL` исключает незавершённые сессии |
| `findLastFinishedSession(userId)` | Последняя завершённая сессия — для сравнения "стало лучше/хуже" с предыдущей |

**`LIMIT 1` в JPQL**: Hibernate 6 допускает `LIMIT` в JPQL (нестандартное расширение). Альтернатива — `Pageable` + взятие первого элемента списка; здесь `LIMIT 1` выбран как более компактный для одного конкретного случая.

**Длинные derived query имена vs `@Query`**: как только имя derived-метода превышает ~5 слов и становится сложным для чтения (`findFirstByUserIdAndFinishedAtIsNotNullOrderByFinishedAtDesc`), предпочтение — явный `@Query` с понятным именем метода и читаемым телом запроса.

---

### 6. `AchievementRepository`

| Метод | Назначение |
|---|---|
| `findByCode(String code)` | Найти ачивку по читаемому коду (`STREAK_7`, `WORDS_100`) — используется в бизнес-логике вместо "магических" числовых id |

---

### 7. `UserAchievementRepository`

| Метод | Назначение |
|---|---|
| `findByUserId(userId)` | Все ачивки пользователя — для личного кабинета. Покрывается индексом `idx_user_achievements_user` |
| `existsByUserIdAndAchievementId(userId, achievementId)` | Проверка перед выдачей ачивки — не сохранять дубликат |

**Defense in depth**: проверка `existsBy...` в коде избегает лишнего запроса на `save()`, а `@UniqueConstraint uq_user_achievement` на уровне БД защищает от дубликата даже при гонке состояний (race condition) — например, если два параллельных запроса одновременно проверили "ачивки нет" и оба попытались её сохранить.

---

### 8. `CustomSetRepository`

| Метод | Назначение |
|---|---|
| `findByUserId(userId)` | Наборы созданные пользователем — для личного кабинета. Покрывается индексом `idx_custom_sets_user` |
| `findByIsPublicTrue()` | Публичные наборы — для общего каталога. Покрывается индексом `idx_custom_sets_public` |

---

### 9. `CustomSetWordRepository`

| Метод | Назначение |
|---|---|
| `findBySetId(setId)` | Все слова входящие в набор — для запуска сессии на основе пользовательского набора |
| `deleteAllBySetId(setId)` | Массовое удаление связей набора одним запросом (`@Modifying @Query("DELETE FROM ...")`) |

**`@Modifying`**: обязателен для `@Query`, изменяющих данные (`DELETE`/`UPDATE`). Без него Spring Data по умолчанию ожидает `SELECT` и выбросит исключение при старте приложения.

**Почему `deleteAllBySetId` нужен явно**: между `CustomSet` и `CustomSetWord` нет `cascade = CascadeType.REMOVE` на уровне Hibernate. Без явного удаления связей при удалении набора останутся **orphan-записи** в `custom_set_words`, ссылающиеся на несуществующий `set_id`. Правильный порядок в service: сначала `deleteAllBySetId(setId)`, затем `customSetRepository.deleteById(setId)`.

---

## Общие принципы repository-слоя

1. **Derived queries для простых случаев** — Spring парсит имя метода (`findByEmail`, `existsByUsername`) и сам генерирует SQL. Используется, когда логика — простое сравнение по полям.
2. **`@Query` с JPQL для сложной логики** — опциональные фильтры, `JOIN` через объектные связи, агрегации (`COUNT`, `GROUP BY`), `LIMIT`. JPQL оперирует именами классов/полей Java, а не именами таблиц/колонок SQL.
3. **`Pageable` вместо хардкода `LIMIT`** — размер выборки управляется снаружи запроса, один метод обслуживает разные сценарии (5 слов / 20 слов).
4. **Batch fetching через `IN (...)`** — для любых "дай данные по списку id" операций один запрос со списком вместо цикла с отдельными запросами (избегание N+1).
5. **`@Modifying` для `DELETE`/`UPDATE`** — обязателен, иначе ошибка при старте приложения.
6. **Коды (`code`) вместо id в бизнес-логике** — справочные таблицы (`languages`, `achievements`) имеют человекочитаемый уникальный `code`, по которому код обращается к записям, а не по "магическим" числовым id.

---

## Слой `security`

### Компоненты

**`JwtService`** — генерация и проверка JWT токенов.

| Метод | Назначение |
|---|---|
| `generateToken(userId)` | Создать подписанный токен с userId в subject и временем истечения |
| `extractUserId(token)` | Извлечь UUID пользователя из токена. Выбрасывает исключение если токен подделан или истёк |
| `isTokenExpired(token)` | Проверить не истёк ли токен по полю `exp` в payload |

Алгоритм подписи — HMAC-SHA512 (jjwt выбирает автоматически на основе длины ключа). Секрет и время жизни токена берутся из `application.yml` через `@Value("${jwt.secret}")`.

Токен содержит три части разделённые точкой: `header.payload.signature`. Payload не зашифрован (Base64) — виден любому, но изменить его без знания секрета невозможно.

**`JwtAuthFilter`** — фильтр, выполняющийся один раз на каждый запрос (`OncePerRequestFilter`).

Логика фильтра:
```
Запрос пришёл
    ↓
Есть заголовок "Authorization: Bearer ..."?
    Нет → пропустить дальше (публичные endpoints сами разрешены)
    Да  ↓
Распарсить токен → извлечь userId
    ↓
Пользователь существует в БД? (existsById)
Токен не истёк?
    Нет → не аутентифицировать, пропустить дальше (Spring Security вернёт 401)
    Да  ↓
Создать UsernamePasswordAuthenticationToken
Положить в SecurityContextHolder
    ↓
Пропустить запрос дальше — он теперь аутентифицирован
```

Почему `existsById` а не только проверка подписи: пользователь мог быть удалён после выдачи токена — токен валиден по подписи, но пользователя нет.

**`SecurityConfig`** — настройка цепочки фильтров Spring Security.

| Настройка | Значение | Причина |
|---|---|---|
| `csrf().disable()` | Отключён | JWT в заголовке не уязвим к CSRF (браузер не отправляет заголовки автоматически) |
| `sessionCreationPolicy(STATELESS)` | Без сессий | Каждый запрос аутентифицируется через JWT независимо |
| `/api/auth/**` → `permitAll()` | Открытые | Логин и регистрация доступны без токена |
| `anyRequest()` → `authenticated()` | Защищённые | Все остальные endpoints требуют валидный JWT |
| `addFilterBefore(jwtAuthFilter, ...)` | JWT перед form-login | Наш фильтр проверяет токен до стандартного фильтра Spring |
| CORS | `localhost:5173` разрешён | React-фронтенд на другом порту — браузер требует явного разрешения |

**`AuthenticationEntryPoint`** — вызывается когда запрос не аутентифицирован. Возвращает `401` в стандартном формате `ErrorResponse` вместо дефолтной пустой страницы Spring.

---

## Слой `service` (реализованные сервисы)

### `AuthService`

Бизнес-логика регистрации и логина. Не содержит HTTP-логики — только правила.

| Метод | Логика |
|---|---|
| `register(RegisterRequest)` | 1. Проверить уникальность email → 2. Проверить уникальность username → 3. BCrypt хеш пароля → 4. Сохранить → 5. Сгенерировать JWT → вернуть `AuthResponse` |
| `login(LoginRequest)` | 1. Найти по email → 2. `BCrypt.matches()` пароль → 3. Сгенерировать JWT → вернуть `AuthResponse` |

Порядок проверок важен — дешёвые (`existsBy`) идут до дорогих (`BCrypt.encode`).

Пароль никогда не отдаётся наружу — `AuthResponse` содержит только токен, userId, username, appLanguage.

### `UserService`

| Метод | Назначение |
|---|---|
| `getById(UUID)` | Загрузить пользователя по id из JWT. Выбрасывает `AuthException` если не найден |

---

## Слой `controller` (реализованные контроллеры)

### `AuthController` — `/api/auth`

| Endpoint | Метод | Тело запроса | Ответ |
|---|---|---|---|
| `/register` | POST | `{email, username, password, appLanguage}` | `{token, userId, username, appLanguage}` |
| `/login` | POST | `{email, password}` | `{token, userId, username, appLanguage}` |

### `UserController` — `/api/users`

| Endpoint | Метод | Заголовок | Ответ |
|---|---|---|---|
| `/me` | GET | `Authorization: Bearer <token>` | Полный профиль пользователя |

`@AuthenticationPrincipal UserDetails` — Spring автоматически подставляет объект из `SecurityContextHolder` текущего потока. `username` в этом объекте содержит `userId.toString()` — так мы передали его через `JwtAuthFilter`.

---

## Слой `dto` (Data Transfer Objects)

DTO — объекты которые видит клиент. Никогда не совпадают с entity напрямую: entity содержит `passwordHash`, внутренние поля — клиенту это не нужно.

| DTO | Тип | Назначение |
|---|---|---|
| `RegisterRequest` | record | Входящие данные регистрации. Валидируется через `@Valid` + `@NotBlank`, `@Email`, `@Size` |
| `LoginRequest` | record | Входящие данные логина |
| `AuthResponse` | record | Ответ после логина/регистрации — токен + минимум данных для UI |
| `UserProfileResponse` | record | Профиль пользователя. Содержит статический фабричный метод `from(User)` для маппинга из entity |
| `ErrorResponse` | record | Стандартный формат ошибок. Два фабричных метода: `of(status, message)` и `of(status, message, errors)` |

Все DTO используют `record` (Java 14+) — неизменяемые объекты-данные без лишнего boilerplate.

---

## `GlobalExceptionHandler`

Централизованный обработчик исключений (`@RestControllerAdvice`). Перехватывает исключения из всех контроллеров.

| Исключение | HTTP статус | Когда |
|---|---|---|
| `MethodArgumentNotValidException` | 400 | Провалилась валидация `@Valid` — возвращает Map полей с ошибками |
| `AuthException` | 400 | Занятый email/username, неверный пароль |
| `NoResourceFoundException` | 404 | Запрос к несуществующему endpoint |
| `Exception` | 500 | Любая непредвиденная ошибка — клиент видит общее сообщение, стектрейс только в логах |

---

## `Sm2Service` — алгоритм интервальных повторений

Реализация алгоритма SM-2 (SuperMemo 2). Определяет когда показывать слово снова на основе качества ответа пользователя.

### Шкала качества (0-5)
- `5` — идеальный ответ без затруднений
- `4` — правильный с небольшим затруднением
- `3` — правильный с трудом
- `0-2` — неправильный ответ

### Логика обновления

**Правильный ответ (quality ≥ 3):**
```
repetitions == 0 → interval = 1 день
repetitions == 1 → interval = 6 дней
repetitions > 1  → interval = предыдущий_interval × (easinessFactor / 100)

новый EF = старый EF + round(100 × (0.1 - (5-q) × (0.08 + (5-q) × 0.02)))
новый EF не может быть меньше 130 (соответствует 1.3)
```

**Неправильный ответ (quality < 3):**
```
repetitions → 0 (сброс)
interval → 1 день
errorCount → errorCount + 1
easinessFactor не изменяется
```

### Почему `easinessFactor` хранится ×100

Оригинальный SM-2 использует дробные числа (2.5, 1.3). Хранение `float` в БД накапливает ошибки округления при умножении. Умножение на 100 и хранение как `Integer` полностью исключает эту проблему.

### Пример прогресса слова

```
Встреча 1: quality=4 → interval=1 день,   EF=260, repetitions=1
Встреча 2: quality=4 → interval=6 дней,   EF=260, repetitions=2
Встреча 3: quality=5 → interval=16 дней,  EF=270, repetitions=3
Встреча 4: quality=5 → interval=43 дня,   EF=280, repetitions=4
Встреча 5: quality=5 → interval=120 дней → статус MASTERED
```

---

## `SessionService` — игровые сессии

### Логика подбора слов для сессии

```
startSession()
    ↓
Шаг 1: findDueForReview(userId, today, LIMIT N)
    — слова у которых next_review <= сегодня (SM-2 очередь)
    — сортировка по next_review ASC (самые просроченные первыми)
    ↓
Шаг 2: если слов не хватает до N
    — загружаем ВСЕ виденные слова пользователя (findByUserId)
    — фильтруем их из кандидатов на новые
    — добираем новые слова из wordRepository
    — создаём UserWordProgress для каждого нового слова
    ↓
Batch fetching переводов:
    — собираем все wordIds в список
    — один запрос findByWordIdsAndTargetLanguage(wordIds, langToId)
    — группируем в Map<wordId, Translation> в Java
```

**Почему batch fetching а не N запросов:** для сессии из 20 слов цикл с `findByWordAndTargetLanguage` = 20 запросов к БД. `IN (...)` = 1 запрос. При высокой нагрузке разница критична.

### Логика завершения сессии

```
finishSession()
    ↓
Проверяем что сессия принадлежит пользователю
    ↓
Для каждого WordResult:
    — findByUserIdAndWordId → получаем UserWordProgress
    — sm2Service.update(progress, quality) → обновляем SM-2 параметры
    — progressRepository.save(progress)
    ↓
Считаем accuracyDelta:
    — findLastFinishedSession → предыдущая завершённая сессия
    — delta = текущая_точность - предыдущая_точность
    ↓
Начисляем XP:
    — базово: correct × 10
    — бонус: +50 если accuracy >= 90%, +20 если >= 70%
    ↓
Обновляем level: (xp / 500) + 1
```

### Уникальный constraint `uq_user_word_progress`

На таблице `user_word_progress` есть составной уникальный constraint на `(user_id, word_id)`. Это предотвращает создание дублей прогресса для одной пары пользователь-слово даже при гонке состояний. В коде перед созданием нового прогресса проверяется `findByUserIdAndWordId(...).isPresent()` — двойная защита (код + БД).

### Размеры сессий по режимам

| Режим | Слов |
|---|---|
| MATCHING | 10 |
| WRITING | 20 |
| TIME_ATTACK | 15 |
| SURVIVAL | 20 |
| BOSS_ROUND | 50 |

---

## `DataSeeder` — инициализация данных

`ApplicationRunner` — интерфейс Spring Boot, метод `run()` вызывается автоматически после полного старта приложения.

Идемпотентен — проверяет `count() > 0` перед вставкой, повторный запуск не создаёт дублей.

Загружает при старте:
- **10 языков** — EN, RU, DE, FR, ES, IT, PT, ZH, JA, KO
- **10 ачивок** — FIRST_SESSION, WORDS_100/500/1000, STREAK_3/7/30, PERFECT_SESSION, SURVIVAL_COMPLETE, BOSS_ROUND_WIN

### Слова (seed_words.py)

Python скрипт в корне проекта. Скачивает топ-5000 частотных английских слов из открытого датасета FrequencyWords, фильтрует служебные слова и генерирует SQL файл.

```
python3 seed_words.py  →  seed_words.sql
psql -U postgres -d vocabapp -f seed_words.sql
```

Результат: 5000 слов в таблице `words` + 212 переводов на русский из встроенного словаря. Переводы можно расширить подключив внешний API или офлайн датасет.

---

## Новые DTO (сессионный и статистический слой)

| DTO | Назначение |
|---|---|
| `SessionStartRequest` | Запрос старта — langFromCode, langToCode, mode, topic (опционально) |
| `SessionStartResponse` | Ответ — sessionId, mode, языки, список `WordCardDto` |
| `WordCardDto` | Карточка слова — wordId, word, translation, topic, isNew |
| `SessionFinishRequest` | Запрос завершения — sessionId, список `WordResult`, durationSeconds |
| `SessionFinishRequest.WordResult` | Результат по слову — wordId, correct, quality (0-5) |
| `SessionFinishResponse` | Итоги — totalWords, correct, incorrect, accuracyPercent, xpEarned, accuracyDelta |
| `UserStatsResponse` | Статистика — totalSessions, слова по статусам, averageAccuracy, streak, xp, level |
| `LeaderboardEntry` | Строка лидерборда — rank, userId, username, xp, level, streakDays |
| `DifficultWordDto` | Сложное слово — wordId, word, topic, errorCount, intervalDays, status |

---

## `StatsService` — статистика пользователя

Агрегирует данные из двух таблиц для личного кабинета.

**Источники данных:**
- `sessions` — завершённые сессии за последние 90 дней через `findFinishedSessionsSince`
- `user_word_progress` — подсчёт слов по статусу через `countByStatusForUser`
- `users` — streak, xp, level напрямую из профиля

**Средняя точность** считается по всем завершённым сессиям за 90 дней — сумма точностей делится на количество сессий с `totalWords > 0`.

---

## Дополнительные endpoints в `UserController`

**`GET /api/users/stats`** — вызывает `StatsService.getUserStats(userId)`.

**`GET /api/users/leaderboard`** — топ-50 пользователей по XP через `UserRepository.findTopByXp(PageRequest.of(0, 50))`. Покрывается индексом `idx_users_xp`. Возвращает список `LeaderboardEntry` с rank начиная с 1.

**`GET /api/users/difficult-words`** — слова с `errorCount > 0` через `progressRepository.findMostDifficultWords`. Маппится в `DifficultWordDto` через статический фабричный метод `from(UserWordProgress)`.

---

## Проблема LazyInitializationException и её решение

**Суть проблемы:** `@ManyToOne(fetch = FetchType.LAZY)` создаёт прокси вместо реального объекта. Реальный SQL идёт при первом обращении к полям. Если транзакция закрыта к этому моменту — Hibernate выбрасывает `LazyInitializationException`.

**Где проявилось:** в `DifficultWordDto.from(progress)` при вызове `progress.getWord().getWord()` — транзакция репозитория уже завершилась к моменту маппинга в контроллере.

**Решение — `JOIN FETCH` в JPQL запросах:**
```java
// Было — LAZY, Word подгружается отдельно при обращении
SELECT uwp FROM UserWordProgress uwp WHERE ...

// Стало — Word подгружается сразу в одном JOIN запросе
SELECT uwp FROM UserWordProgress uwp
JOIN FETCH uwp.word
WHERE ...
```

`JOIN FETCH` добавлен в `findMostDifficultWords` и `findDueForReview` — оба метода используют `word` после закрытия транзакции.

---

## Уникальный constraint `uq_user_word_progress`

В процессе разработки обнаружилась проблема дублей в `user_word_progress` — одно слово создавалось дважды для одного пользователя при повторных сессиях.

**Причина:** при формировании второй сессии слова из SM-2 очереди не попадали в фильтр виденных слов, и система создавала новую запись прогресса для уже известного слова.

**Решение — два уровня защиты:**
1. Код: `progressRepository.findByUserIdAndWordId(...).isPresent()` перед `save()`
2. БД: `@UniqueConstraint(columnNames = {"user_id", "word_id"})` на уровне таблицы

**Фильтрация виденных слов** в `startSession`: перед добавлением новых слов загружаем все `UserWordProgress` пользователя и исключаем их `wordId` из кандидатов на новые слова.

---

## Дружба и дуэли — реализованный функционал

### Таблица `friendships`

| Поле | Тип | Назначение |
|---|---|---|
| `id` | UUID v7 | Первичный ключ |
| `requester_id` | FK → users | Кто отправил запрос |
| `addressee_id` | FK → users | Кому отправили |
| `status` | enum (PENDING/ACCEPTED/DECLINED/BLOCKED) | Текущий статус отношений |
| `created_at` | timestamp | Время создания |

**Constraint** `uq_friendship (requester_id, addressee_id)` — нельзя отправить два запроса одному человеку.

**Индексы**: `idx_friendships_requester`, `idx_friendships_addressee` — быстрый поиск в обоих направлениях.

### Таблица `duels`

| Поле | Тип | Назначение |
|---|---|---|
| `id` | UUID v7 | Первичный ключ |
| `creator_id` | FK → users | Инициатор вызова |
| `opponent_id` | FK → users | Вызванный игрок |
| `lang_from_id`, `lang_to_id` | FK → languages | Языковая пара дуэли |
| `status` | enum (PENDING/IN_PROGRESS/FINISHED/DECLINED/CANCELLED) | Статус дуэли |
| `winner_id` | FK → users, nullable | Победитель — null при ничьей |
| `word_ids` | TEXT | Id слов через запятую — одинаковые для обоих игроков |
| `creator_accuracy` | Double, nullable | Точность создателя — null пока не завершил |
| `opponent_accuracy` | Double, nullable | Точность соперника — null пока не завершил |
| `created_at` | timestamp | Время создания |
| `finished_at` | timestamp, nullable | Время завершения |

**Почему `word_ids` как строка**: фиксированный набор из 10 id не требует отдельной таблицы. Парсится в Java за одну строчку, не нужен JOIN. Сознательный компромисс простоты над нормализацией.

**Победитель определяется автоматически** когда оба игрока сохранили результаты — сравниваются `creator_accuracy` и `opponent_accuracy`. При равных значениях ничья (`winner_id = null`).

### `FriendService`

| Метод | Логика |
|---|---|
| `sendFriendRequest` | Проверяет что запрос ещё не существует → создаёт `Friendship(PENDING)` |
| `acceptFriendRequest` | Проверяет что адресат — текущий пользователь → `ACCEPTED` |
| `declineFriendRequest` | Проверяет что адресат — текущий пользователь → `DECLINED` |
| `removeFriend` | Удаляет запись `Friendship` полностью |
| `getFriends` | `findAcceptedFriendships` → маппинг в `FriendDto` с определением "кто друг" |
| `searchUsers` | Поиск по `username LIKE %query%`, исключая себя, LIMIT 10 |

`FriendDto.from(friendship, currentUserId)` — определяет кто из двух участников является "другом" (не текущим пользователем) через сравнение id.

### `DuelService`

| Метод | Логика |
|---|---|
| `challenge` | Проверяет дружбу → перемешивает слова → сохраняет `wordIds` как строку → `Duel(PENDING)` |
| `acceptDuel` | Только соперник может принять → `IN_PROGRESS` |
| `declineDuel` | Только соперник может отклонить → `DECLINED` |
| `getDuelWords` | Парсит `wordIds` → batch запрос переводов → список `WordCardDto` |
| `finishDuel` | Сохраняет accuracy игрока → если оба завершили → определяет победителя → `FINISHED` |
| `getDuelStatus` | Возвращает `DuelStatusDto` — используется для polling каждые 2 сек |

**Polling вместо WebSocket** — клиент запрашивает `GET /api/duels/{id}/status` каждые 2 секунды чтобы видеть счёт соперника. Проще в реализации, достаточно для 2 игроков.

### `FriendshipRepository`

| Метод | Назначение |
|---|---|
| `findBetweenUsers(id1, id2)` | Ищет связь в обоих направлениях через OR условие |
| `findAcceptedFriendships(userId)` | JOIN FETCH обоих участников, фильтр ACCEPTED |
| `findPendingRequests(userId)` | Входящие — где addressee = текущий пользователь |
| `findOutgoingRequests(userId)` | Исходящие — где requester = текущий пользователь |

### Поиск пользователей — проекция `UserSearchResult`

Интерфейс-проекция в `UserRepository` — возвращает только публичные поля (id, username, level, xp) без email и passwordHash. Spring Data JPA автоматически создаёт реализацию из результата запроса.

### Финальный список всех endpoints

```
POST /api/auth/register                 — регистрация (публичный)
POST /api/auth/login                    — логин (публичный)
GET  /api/languages                     — список языков (публичный)

GET  /api/users/me                      — профиль пользователя
GET  /api/users/stats                   — статистика
GET  /api/users/leaderboard             — топ-50 по XP
GET  /api/users/difficult-words         — слова с наибольшим числом ошибок

POST /api/sessions/start                — запуск игровой сессии
POST /api/sessions/finish               — завершение + SM-2 обновление

GET  /api/friends                       — список друзей
GET  /api/friends/requests              — входящие запросы дружбы
GET  /api/friends/search?q=            — поиск пользователей по username
POST /api/friends/request/{userId}      — отправить запрос дружбы
POST /api/friends/accept/{requesterId}  — принять запрос
POST /api/friends/decline/{requesterId} — отклонить запрос
DELETE /api/friends/{friendId}          — удалить из друзей

POST /api/duels/challenge               — вызвать друга на дуэль
POST /api/duels/{id}/accept             — принять вызов
POST /api/duels/{id}/decline            — отклонить вызов
GET  /api/duels/{id}/words              — слова для дуэли
GET  /api/duels/{id}/status             — статус для polling (каждые 2 сек)
POST /api/duels/finish                  — завершить дуэль
GET  /api/duels/challenges              — входящие вызовы на дуэль
GET  /api/duels/history                 — история завершённых дуэлей
```

### Следующий этап — React фронтенд

**Экраны:**
- Авторизация (регистрация, логин)
- Главный экран (выбор языка, режима, темы)
- Игровые режимы (сопоставление, дописывание, на время, выживание)
- Экран результатов сессии
- Личный кабинет (статистика, XP, стрик, сложные слова)
- Таблица лидеров
- Друзья (список, поиск, запросы)
- Дуэли (вызов, игра, polling счёта)
