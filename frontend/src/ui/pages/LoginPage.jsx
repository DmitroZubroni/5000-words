import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../core/context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-violet-600 flex flex-col justify-end">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-10">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
          Добро пожаловать
        </h1>
        <p className="text-gray-500 text-sm mb-6">Войдите в свой аккаунт</p>

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
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 bg-gray-50 dark:bg-gray-800 dark:text-white"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 bg-gray-50 dark:bg-gray-800 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-violet-600 text-white rounded-xl py-3 text-sm font-medium mt-2 disabled:opacity-60"
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-violet-600 font-medium">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}