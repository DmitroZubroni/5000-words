import { useState, useEffect } from 'react'
import { useAuth } from '../../core/context/AuthContext'
import api from '../../core/api'
import { IconTrophy, IconStar, IconFlame } from '@tabler/icons-react'

/**
 * Секция лиги — встраивается в верх LeaderboardPage или ProgressPage.
 * Показывает название текущей лиги, прогресс до следующей (10 000 XP шаг)
 * и таблицу лидеров ТОЛЬКО среди пользователей той же лиги —
 * в отличие от общего лидерборда, здесь соревнуются примерно равные.
 */
export default function LeagueScreen() {
  const { user } = useAuth()
  const [league, setLeague] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/leagues/me')
      .then(r => setLeague(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!league) return null

  const progressPct = (league.xpInLeague / 10000) * 100

  return (
    <div className="flex flex-col gap-3">
      {/* Карточка лиги */}
      <div
        className="rounded-2xl p-5 text-center"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
      >
        <div className="text-5xl mb-2">{getLeagueEmoji(league.leagueNumber)}</div>
        <h3 className="text-white text-lg font-bold">Лига «{league.leagueName}»</h3>
        <p className="text-violet-200 text-xs mt-0.5">Всего {league.totalXp} XP</p>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-violet-200 mb-1.5">
            <span>{league.xpInLeague} / 10,000 XP</span>
            <span>до следующей лиги: {league.xpToNextLeague}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Лидерборд внутри лиги */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">
          Игроки этой лиги
        </p>
        {league.leagueLeaderboard.map((entry, i) => (
          <div key={entry.userId}>
            <div className={`flex items-center gap-3 px-4 py-3 ${entry.username === user?.username ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''}`}>
              <span className="w-6 text-xs font-medium text-gray-400 flex-shrink-0">{entry.rank}</span>
              <div className="w-9 h-9 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                <span className="text-violet-600 dark:text-violet-300 font-semibold text-sm">
                  {entry.username?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${entry.username === user?.username ? 'text-violet-600' : 'text-gray-900 dark:text-white'}`}>
                  {entry.username}
                </p>
                {entry.streakDays > 0 && (
                  <span className="text-xs text-orange-400 flex items-center gap-0.5">
                    <IconFlame size={11} /> {entry.streakDays}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{entry.xp} XP</span>
            </div>
            {i < league.leagueLeaderboard.length - 1 && <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Эмодзи для каждой лиги по возрастанию силы животного. */
function getLeagueEmoji(leagueNumber) {
  const emojis = ['🐢', '🐰', '🦊', '🦉', '🐺', '🐆', '🐯', '🐻', '🐉', '🦅']
  return emojis[leagueNumber] || '👑'
}
