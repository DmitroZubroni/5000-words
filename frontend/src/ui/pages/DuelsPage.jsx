import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../core/api'
import {
  IconSword,
  IconTrophy,
  IconClock,
  IconCheck,
  IconX,
  IconPlus,
  IconChevronRight
} from '@tabler/icons-react'

export default function DuelsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('challenges') // challenges | history
  const [challenges, setChallenges] = useState([])
  const [history, setHistory] = useState([])
  const [friends, setFriends] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [languages, setLanguages] = useState([])
  const [duelForm, setDuelForm] = useState({ friendId: '', langFromCode: 'en', langToCode: 'ru' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    api.get('/api/languages').then(r => setLanguages(r.data))
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [challengesRes, historyRes, friendsRes] = await Promise.all([
        api.get('/api/duels/challenges'),
        api.get('/api/duels/history'),
        api.get('/api/friends'),
      ])
      setChallenges(challengesRes.data)
      setHistory(historyRes.data)
      setFriends(friendsRes.data)
    } finally {
      setLoading(false)
    }
  }

  const acceptDuel = async (duelId) => {
    await api.post(`/api/duels/${duelId}/accept`)
    navigate('/duel', { state: { duelId } })
  }

  const declineDuel = async (duelId) => {
    await api.post(`/api/duels/${duelId}/decline`)
    setChallenges(prev => prev.filter(d => d.duelId !== duelId))
  }

  const createDuel = async () => {
    if (!duelForm.friendId) return
    const { data } = await api.post('/api/duels/challenge', duelForm)
    setShowCreate(false)
    alert(`Вызов отправлен! ID дуэли: ${data.duelId}`)
  }

  return (
    <div className="pb-4">

      {/* Хедер */}
      <div
        className="px-4 pt-12 pb-5"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-semibold">Дуэли</h1>
            <p className="text-violet-200 text-sm">
              {challenges.length > 0 ? `${challenges.length} входящих вызовов` : 'Сразитесь с друзьями'}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center"
          >
            <IconPlus size={20} color="white" />
          </button>
        </div>
      </div>

      {/* Табы */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <TabBtn active={tab === 'challenges'} onClick={() => setTab('challenges')} label="Вызовы" count={challenges.length} />
        <TabBtn active={tab === 'history'} onClick={() => setTab('history')} label="История" count={0} />
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">

        {/* Входящие вызовы */}
        {tab === 'challenges' && (
          challenges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconSword size={40} className="text-gray-300 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Нет входящих вызовов</p>
              <p className="text-gray-400 text-sm mt-1">Нажмите + чтобы вызвать друга</p>
            </div>
          ) : challenges.map(d => (
            <div key={d.duelId} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-600 font-semibold text-sm">
                    {d.challengerUsername?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {d.challengerUsername}
                  </p>
                  <p className="text-xs text-gray-400">
                    {d.langFromCode.toUpperCase()} → {d.langToCode.toUpperCase()} · Ур. {d.challengerLevel}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <IconClock size={12} />
                  Ожидает
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => declineDuel(d.duelId)}
                  className="flex-1 py-2 rounded-xl border border-red-200 dark:border-red-900 text-red-400 text-sm flex items-center justify-center gap-1"
                >
                  <IconX size={15} /> Отклонить
                </button>
                <button
                  onClick={() => acceptDuel(d.duelId)}
                  className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm flex items-center justify-center gap-1"
                >
                  <IconCheck size={15} /> Принять
                </button>
              </div>
            </div>
          ))
        )}

        {/* История */}
        {tab === 'history' && (
          history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconTrophy size={40} className="text-gray-300 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Нет завершённых дуэлей</p>
              <p className="text-gray-400 text-sm mt-1">История появится после первой дуэли</p>
            </div>
          ) : history.map(d => (
            <div key={d.duelId} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {d.creatorUsername}
                  </span>
                  <span className="text-gray-400 text-xs">vs</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {d.opponentUsername}
                  </span>
                </div>
                {d.winnerId && (
                  <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <IconTrophy size={11} /> {d.winnerUsername}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-900 dark:text-white font-medium">
                  {d.creatorAccuracy ?? 0}%
                </span>
                <span className="text-gray-400 text-xs">точность</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {d.opponentAccuracy ?? 0}%
                </span>
              </div>
            </div>
          ))
        )}

      </div>

      {/* Модал создания дуэли */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full md:max-w-2xl lg:max-w-4xl p-6 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Вызвать на дуэль</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400">
                <IconX size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Друг</p>
                <select
                  value={duelForm.friendId}
                  onChange={e => setDuelForm(f => ({ ...f, friendId: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none"
                >
                  <option value="">Выберите друга</option>
                  {friends.map(f => (
                    <option key={f.friendId} value={f.friendId}>{f.username}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Из языка</p>
                  <select
                    value={duelForm.langFromCode}
                    onChange={e => setDuelForm(f => ({ ...f, langFromCode: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 text-sm text-gray-900 dark:text-white outline-none"
                  >
                    {languages.map(l => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">На язык</p>
                  <select
                    value={duelForm.langToCode}
                    onChange={e => setDuelForm(f => ({ ...f, langToCode: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-3 text-sm text-gray-900 dark:text-white outline-none"
                  >
                    {languages.map(l => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={createDuel}
                disabled={!duelForm.friendId}
                className="w-full py-3.5 rounded-2xl text-white font-medium disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
              >
                Отправить вызов
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function TabBtn({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors
        ${active
          ? 'border-violet-600 text-violet-600'
          : 'border-transparent text-gray-400 dark:text-gray-500'
        }`}
    >
      {label}
      {count > 0 && (
        <span className="ml-1 text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-600 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  )
}