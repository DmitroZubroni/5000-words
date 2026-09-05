import { useState, useEffect } from 'react'
import { useAuth } from '../../core/context/AuthContext'
import api from '../../core/api'
import { IconTrophy, IconFlame, IconStar, IconMedal, IconUsers, IconWorld } from '@tabler/icons-react'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [scope, setScope] = useState('global') // global | friends
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const endpoint = scope === 'global' ? '/api/users/leaderboard' : '/api/users/leaderboard/friends'
    api.get(endpoint)
      .then(r => setLeaders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false))
  }, [scope])

  const top3 = leaders.slice(0, 3)
  const myEntry = leaders.find(l => l.username === user?.username)

  return (
    <div className="pb-4">
      <div className="px-4 pt-12 pb-6" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}>
        <h1 className="text-white text-xl font-semibold mb-1">Лидерборд</h1>
        <p className="text-violet-200 text-sm">Топ игроков по XP</p>

        {/* Переключатель Все / Друзья */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setScope('global')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors
              ${scope === 'global' ? 'bg-white text-violet-700' : 'bg-white/15 text-white'}`}
          >
            <IconWorld size={15} /> Все
          </button>
          <button
            onClick={() => setScope('friends')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors
              ${scope === 'friends' ? 'bg-white text-violet-700' : 'bg-white/15 text-white'}`}
          >
            <IconUsers size={15} /> Друзья
          </button>
        </div>

        {loading ? null : top3.length > 0 && (
          <div className="mt-6 flex items-end justify-center gap-3">
            {top3[1] && (
              <div className="flex flex-col items-center gap-2 flex-1">
                <Avatar name={top3[1].username} size="w-14 h-14" />
                <div className="w-full bg-white/20 rounded-t-xl pt-3 pb-2 px-2 text-center">
                  <IconMedal size={16} className="text-gray-300 mx-auto mb-1" />
                  <p className="text-white text-xs font-medium truncate">{top3[1].username}</p>
                  <p className="text-violet-200 text-xs">{top3[1].xp} XP</p>
                </div>
              </div>
            )}
            {top3[0] && (
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="text-2xl">👑</div>
                <Avatar name={top3[0].username} size="w-16 h-16" ring />
                <div className="w-full bg-white/25 rounded-t-xl pt-3 pb-2 px-2 text-center">
                  <IconTrophy size={16} className="text-yellow-300 mx-auto mb-1" />
                  <p className="text-white text-xs font-semibold truncate">{top3[0].username}</p>
                  <p className="text-violet-200 text-xs">{top3[0].xp} XP</p>
                </div>
              </div>
            )}
            {top3[2] && (
              <div className="flex flex-col items-center gap-2 flex-1">
                <Avatar name={top3[2].username} size="w-12 h-12" />
                <div className="w-full bg-white/15 rounded-t-xl pt-3 pb-2 px-2 text-center">
                  <IconMedal size={16} className="text-orange-300 mx-auto mb-1" />
                  <p className="text-white text-xs font-medium truncate">{top3[2].username}</p>
                  <p className="text-violet-200 text-xs">{top3[2].xp} XP</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 flex flex-col gap-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <IconUsers size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-400 font-medium">
              {scope === 'friends' ? 'Добавьте друзей чтобы сравнивать результаты' : 'Пока нет данных'}
            </p>
          </div>
        ) : (
          <>
            {myEntry && myEntry.rank > 3 && (
              <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-4 mb-2">
                <p className="text-xs text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2">Ваша позиция</p>
                <LeaderRow entry={myEntry} isMe />
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider px-4 pt-4 pb-2">
                {scope === 'global' ? 'Все участники' : 'Вы и ваши друзья'}
              </p>
              {leaders.map((entry, i) => (
                <div key={entry.userId}>
                  <LeaderRow entry={entry} isMe={entry.username === user?.username} />
                  {i < leaders.length - 1 && <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function LeaderRow({ entry, isMe }) {
  const rankColor = { 1: 'text-yellow-500', 2: 'text-gray-400', 3: 'text-orange-400' }[entry.rank] || 'text-gray-400'
  const rankBg = { 1: 'bg-yellow-50 dark:bg-yellow-900/20', 2: 'bg-gray-100 dark:bg-gray-700', 3: 'bg-orange-50 dark:bg-orange-900/20' }[entry.rank] || 'bg-gray-50 dark:bg-gray-700/50'

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''}`}>
      <div className={`w-7 h-7 rounded-lg ${rankBg} flex items-center justify-center flex-shrink-0`}>
        {entry.rank <= 3
          ? <IconTrophy size={14} className={rankColor} />
          : <span className={`text-xs font-medium ${rankColor}`}>{entry.rank}</span>}
      </div>
      <Avatar name={entry.username} size="w-9 h-9" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-medium truncate ${isMe ? 'text-violet-600' : 'text-gray-900 dark:text-white'}`}>{entry.username}</p>
          {isMe && <span className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-600 px-1.5 py-0.5 rounded-md flex-shrink-0">вы</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 flex items-center gap-0.5"><IconStar size={11} /> Ур. {entry.level}</span>
          {entry.streakDays > 0 && <span className="text-xs text-orange-400 flex items-center gap-0.5"><IconFlame size={11} /> {entry.streakDays}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{entry.xp}</p>
        <p className="text-xs text-gray-400">XP</p>
      </div>
    </div>
  )
}

function Avatar({ name, size = 'w-10 h-10', ring = false }) {
  return (
    <div className={`${size} rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0 ${ring ? 'ring-2 ring-white ring-offset-2 ring-offset-violet-600' : ''}`}>
      <span className="text-violet-600 dark:text-violet-300 font-semibold text-sm">{name?.[0]?.toUpperCase()}</span>
    </div>
  )
}
