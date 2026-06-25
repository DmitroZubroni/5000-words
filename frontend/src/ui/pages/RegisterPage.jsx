import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../core/context/AuthContext'

const LANGUAGES = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    appLanguage: 'ru',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.email, form.username, form.password, form.appLanguage)
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-violet-600 flex flex-col justify-end">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-10">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
          Создать аккаунт
        </h1>
        <p className="text-gray-500 text-sm mb-6">Начните изучать слова прямо сейчас</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 bg-gray-50 dark:bg-gray-800 dark:text-white"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={set('username')}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 bg-gray-50 dark:bg-gray-800 dark:text-white"
              placeholder="cooluser"
              minLength={3}
              maxLength={30}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Пароль</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 bg-gray-50 dark:bg-gray-800 dark:text-white"
              placeholder="минимум 8 символов"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
              Язык интерфейса
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, appLanguage: lang.code }))}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors
                    ${form.appLanguage === lang.code
                      ? 'bg-violet-100 border-violet-500 text-violet-700 font-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                    }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-violet-600 text-white rounded-xl py-3 text-sm font-medium mt-2 disabled:opacity-60"
          >
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-violet-600 font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}