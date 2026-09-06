import { useState, useEffect } from 'react'
import LanguageSelect from '../components/LanguageSelect'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../core/context/AuthContext'
import { useDuelNotifications } from '../../core/context/DuelNotificationContext'
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
  IconAlertTriangle,
  IconHourglassEmpty,
  IconFlame
} from '@tabler/icons-react'

export default function DuelsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { user } = useAuth()
  const { onDuelUpdate } = useDuelNotifications()

  const [tab, setTab] = useState('active') // 'active' | 'challenges' | 'history'
  const [activeDuels, setActiveDuels] = useState([])
  const [outgoingChallenges, setOutgoingChallenges] = useState([])
  const [challenges, setChallenges] = useState([])
  const [history, setHistory] = useState([])
  const [friends, setFriends] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [languages, setLanguages] = useState([])
  const [duelForm, setDuelForm] = useState({
    friendId: location.state?.challengeFriendId || '',
    langFromCode: 'en',
    langToCode: 'ru',
    wordCount: 10,
    sameWords: true
  })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadData()
    api.get('/api/languages').then(r => setLanguages(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [])

  // Автоматически обновляем данные при получении любых SSE событий дуэлей
  useEffect(() => {
    return onDuelUpdate(() => {
      loadData(false)
    })
  }, [onDuelUpdate])

  useEffect(() => {
    if (location.state?.challengeFriendId) {
      setDuelForm(f => ({ ...f, friendId: location.state.challengeFriendId }))
      setShowCreate(true)
    }
  }, [location.state])

  const loadData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true)
    try {
      const [challengesRes, activeRes, outgoingRes, historyRes, friendsRes] = await Promise.all([
        api.get('/api/duels/challenges'),
        api.get('/api/duels/active'),
        api.get('/api/duels/outgoing'),
        api.get('/api/duels/history'),
        api.get('/api/friends'),
      ])
      const friendsList = Array.isArray(friendsRes.data) ? friendsRes.data : []
      const chList = Array.isArray(challengesRes.data) ? challengesRes.data : []
      const actList = Array.isArray(activeRes.data) ? activeRes.data : []
      const outList = Array.isArray(outgoingRes.data) ? outgoingRes.data : []
      const histList = Array.isArray(historyRes.data) ? historyRes.data : []

      setChallenges(chList)
      setActiveDuels(actList)
      setOutgoingChallenges(outList)
      setHistory(histList)
      setFriends(friendsList)

      // Если есть активные входящие вызовы и нет активных дуэлей, можно переключить на challenges
      if (chList.length > 0 && actList.length === 0 && outList.length === 0 && tab === 'active') {
        setTab('challenges')
      }

      setDuelForm(f => {
        if (f.friendId) return f
        if (location.state?.challengeFriendId) {
          return { ...f, friendId: location.state.challengeFriendId }
        }
        if (friendsList.length > 0) {
          return { ...f, friendId: friendsList[0].friendId }
        }
        return f
      })
    } catch {
      toast.error('Не удалось загрузить данные')
    } finally {
      if (showLoadingSpinner) setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    if (!duelForm.friendId && friends.length > 0) {
      setDuelForm(f => ({ ...f, friendId: friends[0].friendId }))
    }
    setShowCreate(true)
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

  const cancelDuel = async (duelId) => {
    try {
      await api.post(`/api/duels/${duelId}/cancel`)
      setOutgoingChallenges(prev => prev.filter(d => d.duelId !== duelId))
      toast.info('Вызов отменён')
    } catch {
      toast.error('Не удалось отменить вызов')
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
      setTab('active')
      loadData(false)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Не удалось отправить вызов')
    } finally {
      setCreating(false)
    }
  }

  const totalActiveCount = activeDuels.length + outgoingChallenges.length

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
              {challenges.length > 0
                ? `${challenges.length} входящих вызовов`
                : activeDuels.length > 0
                ? `${activeDuels.length} дуэлей в процессе`
                : 'Сразитесь с друзьями'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-colors cursor-pointer"
          >
            <IconPlus size={20} color="white" />
          </button>
        </div>
      </div>

      {/* Табы */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <TabBtn
          active={tab === 'active'}
          onClick={() => setTab('active')}
          label="Текущие"
          count={totalActiveCount}
        />
        <TabBtn
          active={tab === 'challenges'}
          onClick={() => setTab('challenges')}
          label="Входящие"
          count={challenges.length}
        />
        <TabBtn
          active={tab === 'history'}
          onClick={() => setTab('history')}
          label="История"
          count={history.length}
        />
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Вкладка: Текущие (Активные дуэли + Исходящие вызовы) */}
            {tab === 'active' && (
              totalActiveCount === 0 ? (
                <EmptyState
                  icon={<IconSword size={40} className="text-gray-300" />}
                  title="Нет активных дуэлей"
                  subtitle="Нажмите «+» выше, чтобы бросить вызов другу"
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Дуэли в процессе */}
                  {activeDuels.map(d => {
                    const isCreator = d.creatorId ? d.creatorId === user?.id : d.creatorUsername === user?.username
                    const myAccuracy = isCreator ? d.creatorAccuracy : d.opponentAccuracy
                    const opponentAccuracy = isCreator ? d.opponentAccuracy : d.creatorAccuracy
                    const opponentName = isCreator ? d.opponentUsername : d.creatorUsername
                    const needToPlay = myAccuracy === null

                    return (
                      <div
                        key={d.duelId}
                        className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 transition-all ${
                          needToPlay
                            ? 'border-violet-500 shadow-md ring-1 ring-violet-400/30'
                            : 'border-gray-100 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar name={opponentName} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {opponentName}
                              </p>
                              {needToPlay && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-bold flex items-center gap-0.5">
                                  <IconFlame size={11} /> Ваш ход!
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {d.langFromCode?.toUpperCase()} → {d.langToCode?.toUpperCase()}
                              {myAccuracy !== null ? ` · Ваша точность: ${myAccuracy}%` : ` · ${d.wordCount || 10} слов`}
                            </p>
                          </div>
                        </div>

                        {needToPlay ? (
                          <button
                            type="button"
                            onClick={() => navigate('/duel', { state: { duelId: d.duelId } })}
                            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <IconSword size={16} /> Сразиться сейчас!
                          </button>
                        ) : (
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <IconHourglassEmpty size={14} /> Ожидаем завершения соперника...
                            </span>
                            <button
                              type="button"
                              onClick={() => navigate('/duel', { state: { duelId: d.duelId } })}
                              className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline"
                            >
                              Смотреть
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Исходящие ожидающие вызовы */}
                  {outgoingChallenges.map(d => (
                    <div
                      key={d.duelId}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar name={d.opponentUsername} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            Вы вызвали: {d.opponentUsername}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {d.langFromCode?.toUpperCase()} → {d.langToCode?.toUpperCase()} · Ожидает принятия
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => cancelDuel(d.duelId)}
                          className="px-3 py-1.5 rounded-xl text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Вкладка: Входящие вызовы */}
            {tab === 'challenges' && (
              challenges.length === 0 ? (
                <EmptyState
                  icon={<IconSword size={40} className="text-gray-300" />}
                  title="Нет входящих вызовов"
                  subtitle="Когда друг бросит вам вызов, он появится здесь"
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
                      type="button"
                      onClick={() => declineDuel(d.duelId)}
                      className="flex-1 py-2 rounded-xl border border-red-200 dark:border-red-900 text-red-400 text-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <IconX size={15} /> Отклонить
                    </button>
                    <button
                      type="button"
                      onClick={() => acceptDuel(d.duelId)}
                      className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <IconSword size={15} /> Принять
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Вкладка: История */}
            {tab === 'history' && (
              history.length === 0 ? (
                <EmptyState
                  icon={<IconTrophy size={40} className="text-gray-300" />}
                  title="История пуста"
                  subtitle="Сыграйте первую дуэль!"
                />
              ) : history.map(d => (
                <div key={d.duelId} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={d.creatorUsername} size="sm" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{d.creatorUsername}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-bold">VS</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{d.opponentUsername}</span>
                      <Avatar name={d.opponentUsername} size="sm" />
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2.5 mb-2 text-center">
                    {d.winnerUsername ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                        <IconTrophy size={13} /> Победитель: {d.winnerUsername}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Ничья</span>
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
                <p className="text-xs text-gray-400 mt-0.5">{duelForm.wordCount} слов · победит тот, кто точнее</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 cursor-pointer"
              >
                <IconX size={16} />
              </button>
            </div>

            <div className="px-6 py-5">
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <IconUsers size={36} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">У вас пока нет друзей</p>
                  <p className="text-gray-400 text-xs mt-1 max-w-xs mx-auto">Добавьте друзей на вкладке «Друзья», чтобы вызвать их на дуэль</p>
                  <button
                    type="button"
                    onClick={() => { setShowCreate(false); navigate('/friends') }}
                    className="mt-4 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Перейти к друзьям
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-5">

                  {/* Выбор друга */}
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2.5">Выберите соперника</p>
                    <div className="flex flex-col gap-2">
                      {friends.map(f => {
                        const isSelected = duelForm.friendId === f.friendId
                        return (
                          <button
                            key={f.friendId}
                            type="button"
                            onClick={() => setDuelForm(form => ({ ...form, friendId: f.friendId }))}
                            className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left cursor-pointer
                              ${isSelected
                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-sm'
                                : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'
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
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${
                              isSelected ? 'bg-violet-600 border-violet-600' : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {isSelected && <IconCheck size={12} color="white" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Языки */}
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2.5">Языковая пара</p>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 flex items-center gap-3">
                      <div className="flex-1">
                        <LanguageSelect 
                          value={duelForm.langFromCode} 
                          onChange={val => setDuelForm(f => ({ ...f, langFromCode: val }))} 
                          languages={languages} 
                        />
                      </div>
                      <IconArrowRight size={16} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <LanguageSelect 
                          value={duelForm.langToCode} 
                          onChange={val => setDuelForm(f => ({ ...f, langToCode: val }))} 
                          languages={languages} 
                        />
                      </div>
                    </div>
                    {duelForm.langFromCode === duelForm.langToCode && (
                      <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                        <IconAlertTriangle size={12} /> Выберите разные языки
                      </p>
                    )}
                  </div>

                  {/* Настройки дуэли */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2.5">Кол-во слов</p>
                      <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
                        {[5, 10, 15, 20].map(count => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setDuelForm(f => ({ ...f, wordCount: count }))}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                              duelForm.wordCount === count
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-600 dark:text-violet-400'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-2.5">Режим слов</p>
                      <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setDuelForm(f => ({ ...f, sameWords: true }))}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            duelForm.sameWords
                              ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-600 dark:text-violet-400'
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          Одинаковые
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuelForm(f => ({ ...f, sameWords: false }))}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            !duelForm.sameWords
                              ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-600 dark:text-violet-400'
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          Разные
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={createDuel}
                    disabled={creating || !duelForm.friendId || duelForm.langFromCode === duelForm.langToCode}
                    className="w-full py-3.5 rounded-2xl text-white font-medium disabled:opacity-40 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
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

function Avatar({ name, size = 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs rounded-lg' : 'w-10 h-10 text-sm rounded-2xl'
  return (
    <div className={`${dim} bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0`}>
      <span className="text-violet-600 dark:text-violet-300 font-semibold">
        {name?.[0]?.toUpperCase()}
      </span>
    </div>
  )
}

function TabBtn({ active, onClick, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
        active
          ? 'border-violet-600 text-violet-600'
          : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
          active
            ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{title}</p>
      <p className="text-xs text-gray-400 max-w-xs">{subtitle}</p>
    </div>
  )
}
