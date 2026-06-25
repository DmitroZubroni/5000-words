import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../core/context/AuthContext'
import { IconMail, IconLock, IconEye, IconEyeOff } from '@tabler/icons-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.message || 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div  className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
        <div className="mx-auto w-full sm:max-w-sm min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #7C3AED 0%, #6D28D9 50%, #4C1D95 100%)' }}>
             {/* Верхняя часть с иллюстрацией */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-4">
          <span className="text-4xl">📚</span>
        </div>
        <h1 className="text-white text-2xl font-semibold mb-1">5000 слов</h1>
        <p className="text-violet-200 text-sm">Учите языки эффективно</p>
      </div>

      {/* Нижняя карточка */}
      <div className="bg-white dark:bg-gray-900 rounded-t-[2rem] px-6 pt-8 pb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Вход</h2>
        <p className="text-gray-400 text-sm mb-6">Рады видеть вас снова</p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="relative">
            <IconMail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-400 focus:bg-white dark:focus:bg-gray-700 transition-colors"
            />
          </div>

          {/* Пароль */}
          <div className="relative">
            <IconLock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Пароль"
              required
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl pl-11 pr-11 py-3.5 text-sm text-gray-900 dark:text-white outline-none focus:border-violet-400 focus:bg-white dark:focus:bg-gray-700 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPass ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white text-sm font-medium mt-1 disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-violet-600 font-medium">
            Зарегистрироваться
          </Link>
        </p>
      </div>
        </div>
    </div>
  )
}