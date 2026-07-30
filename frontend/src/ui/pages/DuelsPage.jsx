import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../core/api'
import { useToast } from '../../core/context/ToastContext'
import {
  IconSword,
  IconTrophy,
  IconClock,
  IconCheck,
  IconX,
  IconPlus,
  IconUsers,
  IconArrowRight,
  IconAlertTriangle
} from '@tabler/icons-react'

export default function DuelsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState('challenges')
  const [challenges, setChallenges] = useState([])
  const [history, setHistory] = useState([])
  const [friends, setFriends] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [languages, setLanguages] = useState([])
  const [duelForm, setDuelForm] = useState({ friendId: '', langFromCode: 'en', langToCode: 'ru' })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadData()
    api.get('/api/languages').then(r => setLanguages(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [challengesRes, historyRes, friendsRes] = await Promise.all([
        api.get('/api/duels/challenges'),
        api.get('/api/duels/history'),
        api.get('/api/friends'),
      ])
      setChallenges(Array.isArray(challengesRes.data) ? challengesRes.data : [])
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : [])
      setFriends(Array.isArray(friendsRes.data) ? friendsRes.data : [])
    } catch {
      toast.error('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  const acceptDuel = async (duelId) => {
    try {
      await api.post(`/api/duels/${duelId}/accept`)
      navigate('/duel', { state: { duelId } })
    } catch {
      toast.error('Не удалось принять вызов')
    }
  }

  const declineDuel = async (duelId) => {
    try {
      await api.post(`/api/duels/${duelId}/decline`)
      setChallenges(prev => prev.filter(d => d.duelId !== duelId))
      toast.info('Вызов отклонён')
    } catch {
      toast.error('Не удалось отклонить вызов')
    }
  }

  const createDuel = async () => {
    if (!duelForm.friendId) { toast.warning('Выберите друга'); return }
    if (duelForm.langFromCode === duelForm.langToCode) { toast.warning('Выберите разные языки'); return }
    setCreating(true)
    try {
      await api.post('/api/duels/challenge', duelForm)
      setShowCreate(false)
      toast.success('Вызов отправлен! Ждём ответа...')
      setDuelForm(f => ({ ...f, friendId: '' }))
    } catch (e) {
      toast.error(e.response?.data?.message || 'Не удалось отправить вызов')
    } finally {
      setCreating(false)
    }
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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Входящие вызовы */}
            {tab === 'challenges' && (
              challenges.length === 0 ? (
                <EmptyState
                  icon={<IconSword size={40} className="text-gray-300" />}
                  title="Нет входящих вызовов"
                  subtitle="Нажмите + чтобы вызвать друга"
                />
              ) : challenges.map(d => (
                <div key={d.duelId} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={d.challengerUsername} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{d.challengerUsername}</p>
                      <p className="text-xs text-gray-400">
                        {d.langFromCode?.toUpperCase()} → {d.langToCode?.toUpperCase()} · Ур. {d.challengerLevel}
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
                <EmptyState
                  icon={<IconTrophy size={40} className="text-gray-300" />}
                  title="Нет завершённых дуэлей"
                  subtitle="История появится после первой дуэли"
                />
              ) : history.map(d => (
                <div key={d.duelId} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{d.creatorUsername}</span>
                      <span className="text-gray-400 text-xs">vs</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{d.opponentUsername}</span>
                    </div>
                    {d.winnerUsername && (
                      <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <IconTrophy size={11} /> {d.winnerUsername}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-900 dark:text-white font-medium">{d.creatorAccuracy ?? 0}%</span>
                    <span className="text-gray-400 text-xs">точность</span>
                    <span className="text-gray-900 dark:text-white font-medium">{d.opponentAccuracy ?? 0}%</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Модал создания дуэли */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full md:max-w-2xl lg:max-w-4xl max-h-[85vh] overflow-y-auto">

            {/* Хедер модала */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Вызвать на дуэль</h3>
                <p className="text-xs text-gray-400 mt-0.5">10 слов · победит тот, кто точнее</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                <IconX size={16} />
              </button>
            </div>

            <div className="px-6 py-5">
              {friends.length === 0 ? (
                <div className="text-center py-10">
                  <IconUsers size={36} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">У вас пока нет друзей</p>
                  <p className="text-gray-400 text-xs mt-1">Добавьте друзей на вкладке «Друзья», чтобы вызвать их на дуэль</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">

                  {/* Выбор друга — карточки вместо select */}
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2.5">Выберите соперника</p>
                    <div className="flex flex-col gap-2">
                      {friends.map(f => (
                        <button
                          key={f.friendId}
                          onClick={() => setDuelForm(form => ({ ...form, friendId: f.friendId }))}
                          className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left
                            ${duelForm.friendId === f.friendId
                              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                              : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'
                            }`}
                        >
                          <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                            <span className="text-violet-600 dark:text-violet-300 font-semibold text-sm">
                              {f.username?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.username}</p>
                            <p className="text-xs text-gray-400">Уровень {f.level} · {f.xp} XP</p>
                          </div>
                          {duelForm.friendId === f.friendId && (
                            <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
                              <IconCheck size={12} color="white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Языки — чипы вместо двух select-ов */}
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2.5">Языковая пара</p>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 flex items-center gap-3">
                      <select
                        value={duelForm.langFromCode}
                        onChange={e => setDuelForm(f => ({ ...f, langFromCode: e.target.value }))}
                        className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-600 outline-none"
                      >
                        {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                      </select>
                      <IconArrowRight size={16} className="text-gray-400 flex-shrink-0" />
                      <select
                        value={duelForm.langToCode}
                        onChange={e => setDuelForm(f => ({ ...f, langToCode: e.target.value }))}
                        className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-xl px-3 py-2.5 border border-gray-200 dark:border-gray-600 outline-none"
                      >
                        {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                      </select>
                    </div>
                    {duelForm.langFromCode === duelForm.langToCode && (
                      <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                        <IconAlertTriangle size={12} /> Выберите разные языки
                      </p>
                    )}
                  </div>

                  <button
                    onClick={createDuel}
                    disabled={creating || !duelForm.friendId || duelForm.langFromCode === duelForm.langToCode}
                    className="w-full py-3.5 rounded-2xl text-white font-medium disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
                  >
                    <IconSword size={17} />
                    {creating ? 'Отправляем...' : 'Отправить вызов'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
      <span className="text-violet-600 dark:text-violet-300 font-semibold text-sm">
        {name?.[0]?.toUpperCase()}
      </span>
    </div>
  )
}

function TabBtn({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors
        ${active ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-400 dark:text-gray-500'}`}
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

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3">{icon}</div>
      <p className="text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{subtitle}</p>
    </div>
  )
}