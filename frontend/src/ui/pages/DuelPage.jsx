import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../core/context/AuthContext'
import api from '../../core/api'
import {
  IconSword,
  IconTrophy,
  IconClock,
  IconCheck,
  IconX,
  IconArrowLeft
} from '@tabler/icons-react'

export default function DuelPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user } = useAuth()
  const duelId = state?.duelId

  const [phase, setPhase] = useState('loading') // loading | playing | waiting | finished
  const [words, setWords] = useState([])
  const [status, setStatus] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [wordStatus, setWordStatus] = useState(null) // null | correct | wrong
  const [correct, setCorrect] = useState(0)
  const [startTime] = useState(Date.now())
  const [waitSeconds, setWaitSeconds] = useState(0)

  const pollingRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!duelId) { navigate('/duels'); return }
    loadWords()
    return () => clearPolling()
  }, [duelId])

  // После того как сам закончил — polling каждые 2 сек
  useEffect(() => {
    if (phase === 'waiting') {
      startPolling()
    }
    return () => clearPolling()
  }, [phase])

  const loadWords = async () => {
    try {
      const { data } = await api.get(`/api/duels/${duelId}/words`)
      setWords(data)
      setPhase('playing')
    } catch {
      navigate('/duels')
    }
  }

  const startPolling = () => {
    pollingRef.current = setInterval(async () => {
      setWaitSeconds(s => s + 2)
      try {
        const { data } = await api.get(`/api/duels/${duelId}/status`)
        setStatus(data)
        if (data.status === 'FINISHED') {
          clearPolling()
          setPhase('finished')
        }
      } catch {}
    }, 2000)
  }

  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const checkAnswer = () => {
    if (!input.trim() || wordStatus) return
    const word = words[currentIndex]
    const isCorrect = input.trim().toLowerCase() === word.translation.toLowerCase()

    setWordStatus(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) setCorrect(c => c + 1)

    setTimeout(() => {
      setInput('')
      setWordStatus(null)
      if (currentIndex + 1 >= words.length) {
        submitResults(isCorrect ? correct + 1 : correct)
      } else {
        setCurrentIndex(i => i + 1)
        inputRef.current?.focus()
      }
    }, 700)
  }

  const submitResults = async (finalCorrect) => {
    const duration = Math.round((Date.now() - startTime) / 1000)
    try {
      const { data } = await api.post('/api/duels/finish', {
        duelId,
        correct: finalCorrect,
        totalWords: words.length,
        durationSeconds: duration,
      })
      setStatus(data)
      if (data.status === 'FINISHED') {
        setPhase('finished')
      } else {
        setPhase('waiting')
      }
    } catch {
      setPhase('waiting')
    }
  }

  if (phase === 'loading') return <LoadingScreen />

  if (phase === 'finished' && status) {
    return <FinishedScreen status={status} username={user?.username} onHome={() => navigate('/duels')} />
  }

  if (phase === 'waiting') {
    return <WaitingScreen status={status} username={user?.username} seconds={waitSeconds} />
  }

  const word = words[currentIndex]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">

      {/* Хедер */}
      <div
        className="px-4 pt-12 pb-4"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/duels')} className="text-white/70">
            <IconArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <IconSword size={16} color="white" />
            <span className="text-white text-sm font-medium">Дуэль</span>
          </div>
        </div>

        {/* Счёт */}
        <div className="flex items-center justify-between bg-white/15 rounded-2xl px-4 py-3">
          <div className="text-center">
            <p className="text-white font-semibold text-lg">{correct}</p>
            <p className="text-violet-200 text-xs">{user?.username}</p>
          </div>
          <div className="text-white/40 text-sm">vs</div>
          <div className="text-center">
            <p className="text-white/50 font-semibold text-lg">?</p>
            <p className="text-violet-200 text-xs">
              {status
                ? (user?.username === status.creatorUsername ? status.opponentUsername : status.creatorUsername)
                : 'Соперник'
              }
            </p>
          </div>
        </div>

        {/* Прогресс */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${(currentIndex / words.length) * 100}%` }}
            />
          </div>
          <span className="text-violet-200 text-xs whitespace-nowrap">
            {currentIndex + 1} / {words.length}
          </span>
        </div>
      </div>

      {/* Игровой контент */}
      <div className="flex-1 flex flex-col items-center px-4 pt-10 gap-6 md:max-w-2xl md:mx-auto w-full">

        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Переведите слово</p>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{word?.word}</h2>
          <p className="text-sm text-gray-400 mt-1">{word?.topic}</p>
        </div>

        <div className={`w-full rounded-2xl border-2 transition-colors overflow-hidden
          ${wordStatus === 'correct' ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
            : wordStatus === 'wrong' ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkAnswer()}
            disabled={!!wordStatus}
            placeholder="Введите перевод..."
            autoFocus
            className="w-full px-4 py-4 text-lg text-center bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-300"
          />
        </div>

        {wordStatus === 'wrong' && (
          <p className="text-red-500 text-sm -mt-2">
            Правильно: <span className="font-medium">{word?.translation}</span>
          </p>
        )}

        <button
          onClick={checkAnswer}
          disabled={!!wordStatus || !input.trim()}
          className="w-full py-4 rounded-2xl text-white font-medium disabled:opacity-50 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
        >
          Проверить
        </button>

      </div>
    </div>
  )
}

// ─── Экран ожидания соперника ─────────────────────────────────────────────────
function WaitingScreen({ status, username, seconds }) {
  const isCreator = status?.creatorUsername === username
  const myAccuracy = isCreator ? status?.creatorAccuracy : status?.opponentAccuracy
  const opponentName = isCreator ? status?.opponentUsername : status?.creatorUsername

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
      <div className="text-center mb-8">
        <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          Ждём {opponentName}...
        </h2>
        <p className="text-gray-400 text-sm">
          Ожидание {seconds} сек
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full max-w-sm border border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Ваш результат</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{username}</p>
            <p className="text-xs text-gray-400">завершили</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-violet-600">
              {myAccuracy !== null && myAccuracy !== undefined ? `${myAccuracy}%` : '—'}
            </p>
            <p className="text-xs text-gray-400">точность</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Экран результатов дуэли ──────────────────────────────────────────────────
function FinishedScreen({ status, username, onHome }) {
  const isCreator = status.creatorUsername === username
  const myAccuracy = isCreator ? status.creatorAccuracy : status.opponentAccuracy
  const opponentAccuracy = isCreator ? status.opponentAccuracy : status.creatorAccuracy
  const opponentName = isCreator ? status.opponentUsername : status.creatorUsername
  const iWon = status.winnerUsername === username
  const isDraw = !status.winnerId

  const emoji = isDraw ? '🤝' : iWon ? '🏆' : '😔'
  const title = isDraw ? 'Ничья!' : iWon ? 'Победа!' : 'Поражение'
  const subtitle = isDraw
    ? 'Вы сыграли одинаково!'
    : iWon
    ? `Вы победили ${opponentName}!`
    : `${opponentName} победил!`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div
        className="px-4 pt-16 pb-10 flex flex-col items-center text-center"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
      >
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-white text-2xl font-bold mb-1">{title}</h2>
        <p className="text-violet-200 text-sm">{subtitle}</p>
      </div>

      <div className="px-4 pt-6 flex flex-col gap-4 md:max-w-2xl md:mx-auto w-full">

        {/* Сравнение результатов */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Результаты</p>
          <div className="flex items-center gap-4">

            <div className="flex-1 text-center">
              <div className={`w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center text-lg font-bold ${iWon || isDraw ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {username?.[0]?.toUpperCase()}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{username}</p>
              <p className="text-2xl font-bold text-violet-600 mt-1">{myAccuracy ?? 0}%</p>
              {iWon && !isDraw && <IconTrophy size={16} className="text-yellow-500 mx-auto mt-1" />}
            </div>

            <div className="flex flex-col items-center gap-1">
              <IconSword size={20} className="text-gray-300" />
              <span className="text-xs text-gray-400">vs</span>
            </div>

            <div className="flex-1 text-center">
              <div className={`w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center text-lg font-bold ${!iWon || isDraw ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {opponentName?.[0]?.toUpperCase()}
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{opponentName}</p>
              <p className="text-2xl font-bold text-violet-600 mt-1">{opponentAccuracy ?? 0}%</p>
              {!iWon && !isDraw && <IconTrophy size={16} className="text-yellow-500 mx-auto mt-1" />}
            </div>

          </div>
        </div>

        <button
          onClick={onHome}
          className="w-full py-4 rounded-2xl text-white font-medium"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
        >
          К дуэлям
        </button>

      </div>
    </div>
  )
}

// ─── Загрузка ─────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Загружаем дуэль...</p>
      </div>
    </div>
  )
}