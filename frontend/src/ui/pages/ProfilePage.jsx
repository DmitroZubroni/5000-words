import { useState, useEffect } from 'react'
import { useAuth } from '../../core/context/AuthContext'
import api from '../../core/api'
import {
  IconUser,
  IconTrophy,
  IconFlame,
  IconStar,
  IconBook,
  IconMoon,
  IconSun,
  IconLogout,
  IconChevronRight,
  IconShield
} from '@tabler/icons-react'
import { useTheme } from '../../core/context/ThemeContext'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/api/users/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const xpToNextLevel = 500
  const xpProgress = stats ? (stats.xp % xpToNextLevel) / xpToNextLevel * 100 : 0

  return (
    <div className="pb-4">

      {/* Хедер */}
      <div
        className="px-4 pt-12 pb-8"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
      >
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mb-3">
            <span className="text-3xl font-bold text-white">
              {user?.username?.[0]?.toUpperCase()}
            </span>
          </div>
          <h2 className="text-white text-xl font-semibold">{user?.username}</h2>
          <p className="text-violet-200 text-sm mt-0.5">{user?.email}</p>

          {/* Уровень */}
          <div className="mt-4 w-full bg-white/15 rounded-2xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white text-sm font-medium">
                Уровень {stats?.level ?? 1}
              </span>
              <span className="text-violet-200 text-xs">
                {stats?.xp ?? 0} / {Math.ceil((stats?.xp ?? 0) / xpToNextLevel) * xpToNextLevel} XP
              </span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">

        {/* Мини-статистика */}
        <div className="grid grid-cols-3 gap-2">
          <MiniStat
            icon={<IconFlame size={18} className="text-orange-500" />}
            value={stats?.currentStreak ?? 0}
            label="streak"
          />
          <MiniStat
            icon={<IconStar size={18} className="text-yellow-500" />}
            value={stats?.xp ?? 0}
            label="XP"
          />
          <MiniStat
            icon={<IconBook size={18} className="text-violet-500" />}
            value={stats?.totalWords ?? 0}
            label="слов"
          />
        </div>

        {/* Подписка */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                <IconShield size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.subscriptionTier === 'PREMIUM' ? 'Premium' : 'Бесплатный план'}
                </p>
                <p className="text-xs text-gray-400">
                  {user?.subscriptionTier === 'PREMIUM' ? 'Все функции открыты' : 'Обновить до Premium'}
                </p>
              </div>
            </div>
            {user?.subscriptionTier !== 'PREMIUM' && (
              <span className="text-xs bg-violet-600 text-white px-2.5 py-1 rounded-lg font-medium">
                Upgrade
              </span>
            )}
          </div>
        </div>

        {/* Настройки */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">
            Настройки
          </p>

          <SettingRow
            icon={<IconUser size={18} className="text-blue-500" />}
            label="Имя пользователя"
            value={user?.username}
            bg="bg-blue-50 dark:bg-blue-900/20"
          />

          <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />

          <button
            onClick={toggle}
            className="flex items-center justify-between px-4 py-3.5 w-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {theme === 'dark'
                  ? <IconSun size={18} className="text-yellow-500" />
                  : <IconMoon size={18} className="text-gray-500" />
                }
              </div>
              <span className="text-sm text-gray-900 dark:text-white">
                {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              </span>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-violet-600' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>

          <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />

          <SettingRow
            icon={<IconTrophy size={18} className="text-yellow-500" />}
            label="Язык приложения"
            value={user?.appLanguage?.toUpperCase()}
            bg="bg-yellow-50 dark:bg-yellow-900/20"
          />

          <div className="pb-2" />
        </div>

        {/* Выход */}
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-red-200 dark:border-red-900 text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20"
        >
          <IconLogout size={18} />
          Выйти из аккаунта
        </button>

      </div>
    </div>
  )
}

function MiniStat({ icon, value, label }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 text-center shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
      <div className="text-[11px] text-gray-400">{label}</div>
    </div>
  )
}

function SettingRow({ icon, label, value, bg }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm text-gray-900 dark:text-white">{label}</span>
      </div>
      <div className="flex items-center gap-1 text-gray-400">
        <span className="text-sm">{value}</span>
        <IconChevronRight size={16} />
      </div>
    </div>
  )
}