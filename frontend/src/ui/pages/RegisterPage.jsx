import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../core/context/AuthContext'
import { IconMail, IconLock, IconUser, IconEye, IconEyeOff, IconChevronLeft } from '@tabler/icons-react'

const LANGUAGES = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
]

export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState({ email: '', username: '', password: '', appLanguage: 'ru' })
  const [showPass, setShowPass] = useState(false)
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
        <div  className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
        <div className="mx-auto w-full sm:max-w-sm min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #7C3AED 0%, #6D28D9 50%, #4C1D95 100%)' }}>
            <div className="flex items-center px-4 pt-12 pb-4">
        <Link to="/login" className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
          <IconChevronLeft size={20} color="white" />
        </Link>
        <p className="text-white/70 text-sm ml-3">Уже есть аккаунт? <Link to="/login" className="text-white font-medium">Войти</Link></p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-3">
          <span className="text-3xl">🚀</span>
        </div>
        <h1 className="text-white text-xl font-semibold">Создать аккаунт</h1>
        <p className="text-violet-200 text-sm mt-1">Начните учить слова прямо сейчас</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-t-[2rem] px-6 pt-8 pb-10">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <IconMail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="Email"
              required
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-400 focus:bg-white transition-colors"
            />
          </div>

          <div className="relative">
            <IconUser size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={form.username}
              onChange={set('username')}
              placeholder="Username"
              minLength={3}
              maxLength={30}
              required
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-400 focus:bg-white transition-colors"
            />
          </div>

          <div className="relative">
            <IconLock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="Пароль (мин. 8 символов)"
              minLength={8}
              required
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl pl-11 pr-11 py-3.5 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-400 focus:bg-white transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPass ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Язык интерфейса</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, appLanguage: lang.code }))}
                  className={`px-3.5 py-1.5 rounded-xl text-sm border transition-all
                    ${form.appLanguage === lang.code
                      ? 'bg-violet-50 border-violet-400 text-violet-700 font-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
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
            className="w-full py-3.5 rounded-2xl text-white text-sm font-medium mt-1 disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
          >
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
        </div>
      
    </div>
  )
}