# Архитектура Фронтенда 🎨

**5000 Words Frontend** — React 18 SPA, спроектированное как нативное мобильное приложение. Тёмная тема по умолчанию, плавные CSS-анимации, кастомные компоненты вместо стандартных браузерных элементов. Полностью stateless — всё состояние либо на сервере, либо в localStorage.

---

## 🏗 Структура приложения

```
src/
├── core/                          # Бизнес-логика без визуала
│   ├── api.js                     # Axios instance + JWT и 401 interceptors
│   └── context/
│       ├── AuthContext.jsx        # Токен, профиль пользователя, login/logout
│       ├── ThemeContext.jsx       # Dark Mode (принудительно включён)
│       └── ToastContext.jsx       # Глобальные уведомления (toast.success/error)
│   └── routing/
│       └── Router.jsx             # BrowserRouter, PublicRoute, PrivateRoute
│
└── ui/
    ├── components/                # Переиспользуемые компоненты
    │   ├── LanguageSelect.jsx     # Кастомный BottomSheet вместо <select>
    │   ├── StreakPopup.jsx        # Анимации огня/льда при стрике
    │   ├── LeagueScreen.jsx      # Экран новой лиги
    │   └── layout/
    │       ├── AppLayout.jsx      # Обёртка с нижним TabBar (Outlet)
    │       └── BottomNav.jsx      # 6-элементная навигация
    └── pages/                     # 11 основных экранов
        ├── LearningPage.jsx       # Главный экран, запуск сессии
        ├── SessionPage.jsx        # Игровой движок (4 режима + результаты)
        ├── ProgressPage.jsx       # Статистика SM-2 прогресса
        ├── LeaderboardPage.jsx    # Лига + рейтинг друзей
        ├── DuelsPage.jsx          # Список дуэлей и вызовы
        ├── DuelPage.jsx           # Прохождение дуэли
        ├── FriendsPage.jsx        # Друзья, поиск, заявки
        ├── ProfilePage.jsx        # Профиль, ачивки, XP прогресс
        ├── PremiumPage.jsx        # Экран покупки ($3.00/месяц)
        ├── LoginPage.jsx
        └── RegisterPage.jsx
```

---

## 🔄 Управление состоянием

Проект осознанно отказался от Redux и Zustand — состояние либо серверное (загружается с API), либо локальное (стейт конкретного экрана). Глобальное состояние сведено к минимуму через три контекста.

### `AuthContext` — ядро авторизации

```jsx
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // При старте — восстанавливаем сессию из localStorage
  useEffect(() => {
    const saved  = localStorage.getItem('user')
    const token  = localStorage.getItem('token')
    if (saved && token) setUser(JSON.parse(saved))
    setLoading(false)     // ← только после этого роутер рендерит маршруты
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }
}
```

`loading = true` пока не проверили localStorage — `PrivateRoute` и `PublicRoute` рендерят `null` в это время. Это предотвращает мигание интерфейса при перезагрузке страницы.

Доступно везде через хук:
```js
const { user, loading, login, register, logout } = useAuth()
```

### `ToastContext` — глобальные уведомления

Позволяет из любого компонента вызвать:
```js
const toast = useToast()
toast.success('Запрос отправлен!')
toast.error('Не удалось загрузить данные')
toast.info('Запрос отклонён')
```

Без пробрасывания пропсов сквозь дерево компонентов.

---

## 📡 Сетевой слой (Axios + Interceptors)

Все HTTP-запросы проходят через единый экземпляр `api`, созданный один раз в `core/api.js`.

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — добавляет JWT к каждому запросу
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — обрабатывает глобальные ошибки
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Токен протух или невалиден — разлогиниваем
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
```

**Graceful Upsell** — в каждом компоненте где есть лимиты:
```js
catch (e) {
  const msg = e.response?.data?.message
  if (msg?.includes('Дневной лимит') || msg?.includes('Бесплатный план')) {
    navigate('/premium')   // ← мягкий редирект вместо ошибки
  } else {
    toast.error(msg || 'Что-то пошло не так')
  }
}
```

---

## 🧭 Роутинг и лэйауты

### Два типа маршрутов

```jsx
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null               // ← ждём проверки localStorage
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}
```

### Два типа лэйаутов

Дерево маршрутов:

```jsx
<Routes>
  {/* Публичные — только для неавторизованных */}
  <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
  <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

  {/* Приватные БЕЗ таббара — полноэкранный режим */}
  <Route path="/session" element={<PrivateRoute><SessionPage /></PrivateRoute>} />
  <Route path="/premium" element={<PrivateRoute><PremiumPage /></PrivateRoute>} />

  {/* Приватные С таббаром — вложены в AppLayout */}
  <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
    <Route index element={<LearningPage />} />
    <Route path="progress"    element={<ProgressPage />} />
    <Route path="leaderboard" element={<LeaderboardPage />} />
    <Route path="duels"       element={<DuelsPage />} />
    <Route path="/duel"       element={<DuelPage />} />
    <Route path="friends"     element={<FriendsPage />} />
    <Route path="profile"     element={<ProfilePage />} />
  </Route>

  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

### `AppLayout` — обёртка с TabBar

```jsx
export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 overflow-y-auto pb-24 md:max-w-2xl md:mx-auto">
        <Outlet />     {/* ← сюда рендерится текущая страница */}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 ...">
        {/* 6 кнопок: Обучение, Прогресс, Топ, Дуэли, Друзья, Профиль */}
      </nav>
    </div>
  )
}
```

TabBar реализован через `<NavLink>` с колбэком `({ isActive })`. Активная вкладка: фиолетовый цвет, жирный шрифт, маленькая точка сверху над иконкой.

Важная деталь: `env(safe-area-inset-bottom)` в paddingBottom — таббар не перекрывает системную панель жестов на iPhone.

---

## 🎮 SessionPage — Игровой движок в деталях

Самый сложный компонент приложения. Управляет игровым циклом, сменой режимов и финальной последовательностью попапов.

### Архитектура данных

```js
const resultsRef = useRef([])    // ← useRef, не useState, чтобы не тригерить ререндер
const [currentIndex, setCurrentIndex] = useState(0)
const [finished, setFinished] = useState(false)
const [finishData, setFinishData] = useState(null)
const [showLeaguePopup, setShowLeaguePopup] = useState(false)
const [showStreakPopup, setShowStreakPopup] = useState(false)
```

Результаты накапливаются в `resultsRef.current` (не в стейте), потому что обновление стейта асинхронно — можно потерять результат при быстрых ответах. Ref обновляется синхронно.

### `handleResult` — обработчик каждого ответа

```js
const handleResult = useCallback((wordId, correct, quality) => {
  const newResults = [...resultsRef.current, { wordId, correct, quality }]
  resultsRef.current = newResults

  if (newResults.length >= words.length) {
    finishSession(newResults)    // ← все слова пройдены
  } else {
    setCurrentIndex(newResults.length)    // ← следующее слово
  }
}, [words, finishSession])
```

### Последовательность финала

```
finishSession() вызван
  → POST /api/sessions/finish
  → setFinishData(data)
  → finished = true

Рендер при finished == true:
  1. data.newLeagueName ?
       ДА  → показать <LeagueScreen>
             после закрытия: проверить streakIncreased
       НЕТ → следующая проверка
  2. data.streakIncreased ?
       ДА  → показать <StreakPopup frozen={data.freezeUsed}>
       НЕТ → следующая проверка
  3. Показать <ResultScreen>
```

### TimeAttack — SVG круговой таймер

```jsx
<circle
  r={34}
  cx={40} cy={40}
  stroke="url(#timerGradient)"
  strokeWidth={4}
  fill="none"
  strokeDasharray={`${2 * Math.PI * 34}`}
  strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
  strokeLinecap="round"
  style={{ transition: 'stroke-dashoffset 0.5s linear' }}
/>
```

`pct` обновляется через `setInterval` каждые 100мс. CSS transition создаёт плавное движение без JavaScript-анимации — 60 FPS на слабых устройствах.

### Survival — сохранение жизней между словами

**Проблема:** если дать компоненту `key={currentIndex}`, React размонтирует и создаёт его заново при каждом слове. Стейт `lives` сбросится в 3.

**Решение:** `<SurvivalMode>` не получает ключ. Новое слово приходит через проп `word={currentWord}`, который меняется при смене `currentIndex`. Компонент живёт от начала до конца Survival-сессии, сохраняя стейт жизней.

```jsx
// НЕПРАВИЛЬНО — сбрасывает жизни:
<SurvivalMode key={currentIndex} word={currentWord} ... />

// ПРАВИЛЬНО — жизни сохраняются:
<SurvivalMode word={currentWord} ... />
```

### Matching — защита от двойного срабатывания в StrictMode

React StrictMode дважды вызывает эффекты при монтировании. Для защиты используется `processedPairRef`:

```js
const processedPairRef = useRef(null)

useEffect(() => {
  const { left, right } = selected
  if (left === null || right === null) return

  const pairKey = `${left}-${right.wordId}`
  if (processedPairRef.current === pairKey) return   // ← уже обрабатывали эту пару
  processedPairRef.current = pairKey

  // ... логика проверки совпадения
}, [selected])
```

---

## 💅 UI/UX и стилизация

### Dark Mode by default

В `index.html` добавлен класс `dark` на `<html>`. `ThemeContext` блокирует переключение — тёмная тема принудительна. Tailwind работает в режиме `class` (не `media`), то есть реагирует только на наличие класса `dark` на `<html>`.

### `LanguageSelect` — кастомный компонент выбора языка

Нативный `<select>` на мобильных устройствах рендерится системным интерфейсом — неконсистентно, неудобно, некрасиво. Заменён кастомным компонентом:

```
Кнопка → onClick → открыть BottomSheet (fixed inset-0 z-50)
BottomSheet:
  Полупрозрачный оверлей → tap → закрыть
  Белая карточка снизу:
    Заголовок
    Список языков с флагами и названиями
    Каждый язык — большая зона для нажатия пальцем (py-3)
```

Компонент используется и на `LearningPage` (выбор языка обучения), и на `DuelsPage` (выбор языка дуэли).

### `StreakPopup` — два состояния

```jsx
export default function StreakPopup({ days, onDone, frozen }) {
  // frozen=false → огненный 🔥, frozen=true → ледяной 🧊

  return (
    <div style={{
      background: frozen
        ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)'   // синий
        : 'linear-gradient(135deg, #F97316, #DC2626)'   // оранжево-красный
    }}>
      <div className="text-8xl animate-flame-pop">
        {frozen ? '🧊' : '🔥'}
      </div>
      <div className="text-5xl font-bold animate-count-pop">{days}</div>
      <p>{frozen ? 'Premium спас твой стрик!' : 'Не прерывай серию завтра 🔥'}</p>
    </div>
  )
}
```

Анимации реализованы в `<style>` внутри компонента через `@keyframes`:

```css
@keyframes flame-pop {
  0%   { transform: scale(0.3) rotate(-10deg); opacity: 0; }
  60%  { transform: scale(1.2) rotate(5deg);   opacity: 1; }
  100% { transform: scale(1) rotate(0deg);     opacity: 1; }
}
@keyframes count-pop {
  0%   { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1);   opacity: 1; }
}
```

Попап живёт 2.3 секунды — через `setTimeout` вызывается `onDone()`, возвращающий к `ResultScreen`.

### Скрытые скроллбары

Для горизонтальных каруселей (ачивки в профиле):
```css
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

Свайп есть, полоса прокрутки не видна — нативное ощущение.

### Кнопки и микро-взаимодействия

Все интерактивные элементы имеют `active:scale-95` и `transition-all duration-150` — физический эффект нажатия. Например, карточки ответов в игровых режимах после нажатия сразу меняют цвет (зелёный/красный) без задержки.

### Адаптивность

Приложение Mobile-First, но адаптируется под широкие экраны:
```jsx
<main className="... md:max-w-2xl md:mx-auto lg:max-w-4xl">
```

На планшете контент центрируется с максимальной шириной 672px, на десктопе — 896px.

---

## 📱 Нативные UX-решения

| Решение | Реализация |
|---------|------------|
| Нет стандартных `<select>` | Кастомный `LanguageSelect` с BottomSheet |
| Safe Area на iPhone | `padding-bottom: max(8px, env(safe-area-inset-bottom))` в TabBar |
| Fullscreen для игры | `/session` и `/duel` без AppLayout |
| Нет мигания при загрузке | `loading=true` блокирует рендер маршрутов |
| Нет потери данных при быстрых ответах | Результаты в `useRef`, не в `useState` |
| Нет сброса жизней | `<SurvivalMode>` без `key` |
| 60 FPS таймер | SVG + CSS transition, без JS-анимаций |
| Graceful upsell | Перехват 400 ошибок → редирект на `/premium` |
