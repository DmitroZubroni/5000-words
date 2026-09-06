import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { IconSword, IconX, IconCheck } from '@tabler/icons-react'

const DuelNotificationContext = createContext(null)

export function DuelNotificationProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [activeAlert, setActiveAlert] = useState(null) // { type: 'ACCEPTED' | 'CHALLENGE', ... }
  const listenersRef = useRef(new Map()) // duelId -> Set of callbacks
  const updateCallbacksRef = useRef(new Set())
  const eventSourceRef = useRef(null)

  const subscribeToDuel = useCallback((duelId, callback) => {
    if (!listenersRef.current.has(duelId)) {
      listenersRef.current.set(duelId, new Set())
    }
    listenersRef.current.get(duelId).add(callback)

    return () => {
      const set = listenersRef.current.get(duelId)
      if (set) {
        set.delete(callback)
        if (set.size === 0) listenersRef.current.delete(duelId)
      }
    }
  }, [])

  const onDuelUpdate = useCallback((callback) => {
    updateCallbacksRef.current.add(callback)
    return () => {
      updateCallbacksRef.current.delete(callback)
    }
  }, [])

  const notifyUpdateCallbacks = useCallback(() => {
    updateCallbacksRef.current.forEach(cb => {
      try { cb() } catch {}
    })
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!user || !token) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      return
    }

    const apiBase = import.meta.env.VITE_API_URL || 'https://vocab-backend-lajb.onrender.com'
    const sseUrl = `${apiBase}/api/duels/events?token=${encodeURIComponent(token)}`

    let es = null
    try {
      es = new EventSource(sseUrl)
      eventSourceRef.current = es

      es.addEventListener('INIT', () => {
        // Подключение установлено
      })

      // Друг принял ваш вызов на дуэль
      es.addEventListener('DUEL_ACCEPTED', (e) => {
        try {
          const data = JSON.parse(e.data)
          notifyUpdateCallbacks()

          // Если текущий пользователь — создатель, показываем уведомление о начале дуэли
          const currentUserId = user?.id
          const isCreator = !data.creatorId || data.creatorId === currentUserId || data.creatorUsername === user?.username

          if (isCreator) {
            setActiveAlert({
              type: 'ACCEPTED',
              duelId: data.duelId,
              opponentUsername: data.opponentUsername,
              message: `${data.opponentUsername} принял ваш вызов на дуэль! Пора в бой!`
            })
          }
        } catch (err) {
          console.error('Ошибка разбора DUEL_ACCEPTED:', err)
        }
      })

      // Вам пришёл новый вызов на дуэль
      es.addEventListener('DUEL_CHALLENGE', (e) => {
        try {
          const data = JSON.parse(e.data)
          notifyUpdateCallbacks()

          setActiveAlert({
            type: 'CHALLENGE',
            duelId: data.duelId,
            challengerUsername: data.challengerUsername,
            message: `${data.challengerUsername} бросил вам вызов на дуэль!`
          })
        } catch (err) {
          console.error('Ошибка разбора DUEL_CHALLENGE:', err)
        }
      })

      // Дуэль завершена
      es.addEventListener('DUEL_FINISHED', (e) => {
        try {
          const data = JSON.parse(e.data)
          notifyUpdateCallbacks()

          // Уведомляем конкретных слушателей (например DuelPage)
          const listeners = listenersRef.current.get(data.duelId)
          if (listeners) {
            listeners.forEach(cb => cb('FINISHED', data))
          }
        } catch (err) {
          console.error('Ошибка разбора DUEL_FINISHED:', err)
        }
      })

      // Прогресс дуэли (один игрок завершил раунд)
      es.addEventListener('DUEL_PROGRESS', (e) => {
        try {
          const data = JSON.parse(e.data)
          notifyUpdateCallbacks()

          const listeners = listenersRef.current.get(data.duelId)
          if (listeners) {
            listeners.forEach(cb => cb('PROGRESS', data))
          }
        } catch (err) {
          console.error('Ошибка разбора DUEL_PROGRESS:', err)
        }
      })

      // Вызов отклонён или отменён
      es.addEventListener('DUEL_DECLINED', (e) => {
        try {
          const data = JSON.parse(e.data)
          notifyUpdateCallbacks()
          toast.info(`${data.opponentUsername || 'Друг'} отклонил вызов на дуэль`)
        } catch {}
      })

      es.addEventListener('DUEL_CANCELLED', () => {
        notifyUpdateCallbacks()
      })

      es.onerror = () => {
        // При ошибке браузер EventSource автоматически переподключается
      }
    } catch (err) {
      console.error('Ошибка создания EventSource:', err)
    }

    return () => {
      if (es) {
        es.close()
        eventSourceRef.current = null
      }
    }
  }, [user, notifyUpdateCallbacks, toast])

  const handleStartDuel = (duelId) => {
    setActiveAlert(null)
    navigate('/duel', { state: { duelId } })
  }

  const handleViewChallenges = () => {
    setActiveAlert(null)
    navigate('/duels')
  }

  return (
    <DuelNotificationContext.Provider value={{ subscribeToDuel, onDuelUpdate }}>
      {children}

      {/* Всплывающий баннер реального времени */}
      {activeAlert && (
        <div className="fixed top-4 left-4 right-4 z-50 md:max-w-md md:mx-auto animate-bounce-short">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-2xl border-2 border-violet-500 flex items-center justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
              <IconSword size={22} className="text-violet-600 dark:text-violet-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                {activeAlert.type === 'ACCEPTED' ? 'Вызов принят!' : 'Новый вызов!'}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {activeAlert.message}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {activeAlert.type === 'ACCEPTED' ? (
                <button
                  type="button"
                  onClick={() => handleStartDuel(activeAlert.duelId)}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <IconSword size={14} /> В бой!
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleViewChallenges}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Смотреть
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveAlert(null)}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 transition-colors"
              >
                <IconX size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </DuelNotificationContext.Provider>
  )
}

export const useDuelNotifications = () => useContext(DuelNotificationContext)
