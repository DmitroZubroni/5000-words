import { useState, useEffect } from 'react'
import api from '../../core/api'
import {
  IconFlame,
  IconStar,
  IconBook,
  IconTrophy,
  IconChartBar,
  IconAlertTriangle,
  IconCheck
} from '@tabler/icons-react'

export default function ProgressPage() {
  const [stats, setStats] = useState(null)
  const [difficult, setDifficult] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/users/stats'),
      api.get('/api/users/difficult-words'),
    ]).then(([statsRes, difficultRes]) => {
      setStats(statsRes.data)
      setDifficult(difficultRes.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const xpToNextLevel = 500
  const xpProgress = stats ? (stats.xp % xpToNextLevel) / xpToNextLevel * 100 : 0

  return (
    <div className="pb-4">

      {/* Хедер */}
      <div
        className="px-4 pt-12 pb-6"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
      >
        <h1 className="text-white text-xl font-semibold mb-1">Прогресс</h1>
        <p className="text-violet-200 text-sm">Ваши достижения и статистика</p>

        {/* Уровень и XP */}
        <div className="mt-4 bg-white/15 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <IconTrophy size={16} color="white" />
              </div>
              <span className="text-white font-semibold">Уровень {stats?.level ?? 1}</span>
            </div>
            <span className="text-violet-200 text-sm">{stats?.xp ?? 0} XP</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-violet-200 text-xs mt-1.5">
            {stats ? xpToNextLevel - (stats.xp % xpToNextLevel) : 0} XP до следующего уровня
          </p>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">

        {/* Основная статистика */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={<IconFlame size={20} className="text-orange-500" />}
            value={stats?.currentStreak ?? 0}
            label="дней подряд"
            bg="bg-orange-50 dark:bg-orange-900/20"
          />
          <StatCard
            icon={<IconChartBar size={20} className="text-violet-500" />}
            value={`${stats?.averageAccuracy ?? 0}%`}
            label="точность"
            bg="bg-violet-50 dark:bg-violet-900/20"
          />
          <StatCard
            icon={<IconBook size={20} className="text-blue-500" />}
            value={stats?.totalSessions ?? 0}
            label="сессий"
            bg="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatCard
            icon={<IconStar size={20} className="text-yellow-500" />}
            value={stats?.totalWords ?? 0}
            label="слов встречено"
            bg="bg-yellow-50 dark:bg-yellow-900/20"
          />
        </div>

        {/* Слова по статусам */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-4">Слова по статусу</p>
          <div className="flex flex-col gap-3">
            <WordStatusRow
              label="Изучается"
              value={stats?.learningWords ?? 0}
              total={stats?.totalWords ?? 1}
              color="bg-violet-500"
              icon={<IconBook size={14} className="text-violet-500" />}
            />
            <WordStatusRow
              label="Выучено"
              value={stats?.masteredWords ?? 0}
              total={stats?.totalWords ?? 1}
              color="bg-green-500"
              icon={<IconCheck size={14} className="text-green-500" />}
            />
            <WordStatusRow
              label="Забыто"
              value={stats?.forgottenWords ?? 0}
              total={stats?.totalWords ?? 1}
              color="bg-red-400"
              icon={<IconAlertTriangle size={14} className="text-red-400" />}
            />
          </div>
        </div>

        {/* Сложные слова */}
        {difficult.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-3">
              Сложные слова
            </p>
            <div className="flex flex-col gap-2">
              {difficult.map(w => (
                <div
                  key={w.wordId}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {w.word}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">{w.topic}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg">
                    <IconAlertTriangle size={12} className="text-red-400" />
                    <span className="text-xs text-red-500 font-medium">{w.errorCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function StatCard({ icon, value, label, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-4 border border-gray-100 dark:border-gray-700`}>
      <div className="mb-2">{icon}</div>
      <div className="text-xl font-semibold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  )
}

function WordStatusRow({ label, value, total, color, icon }) {
  const pct = total > 0 ? Math.round(value / total * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {value} <span className="text-gray-400 font-normal text-xs">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}