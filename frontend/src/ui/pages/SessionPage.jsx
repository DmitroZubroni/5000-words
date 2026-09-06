import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../core/api'
import StreakPopup from '../components/StreakPopup'
import LeagueScreen from '../components/LeagueScreen'
import {
  IconHeart,
  IconHeartFilled,
  IconArrowLeft
} from '@tabler/icons-react'

export default function SessionPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const session = state?.session

  const resultsRef = useRef([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [finished, setFinished] = useState(false)
  const [finishData, setFinishData] = useState(null)
  const [startTime] = useState(Date.now())
  const [showStreakPopup, setShowStreakPopup] = useState(false)
  const [showLeaguePopup, setShowLeaguePopup] = useState(false)

  useEffect(() => {
    if (!session) navigate('/')
  }, [session])

  if (!session) return null

  const words = session.words
  const mode = session.mode

  const finishSession = useCallback(async (finalResults) => {
    const duration = Math.round((Date.now() - startTime) / 1000)
    try {
      const { data } = await api.post('/api/sessions/finish', {
        sessionId: session.sessionId,
        results: finalResults,
        durationSeconds: duration,
      })
      setFinishData(data)
      if (data.newLeagueName) {
        setShowLeaguePopup(true)
      } else if (data.streakIncreased) {
        setShowStreakPopup(true)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFinished(true)
    }
  }, [session, startTime])

  const handleResult = useCallback((wordId, correct, quality) => {
    const newResults = [...resultsRef.current, { wordId, correct, quality }]
    resultsRef.current = newResults

    if (newResults.length >= words.length) {
      finishSession(newResults)
    } else {
      setCurrentIndex(newResults.length)
    }
  }, [words, finishSession])

  if (finished) {
    if (showLeaguePopup) {
      return (
        <LeagueScreen 
          leagueName={finishData.newLeagueName}
          onDone={() => {
            setShowLeaguePopup(false)
            if (finishData.streakIncreased) {
              setShowStreakPopup(true)
            }
          }}
        />
      )
    }
    if (showStreakPopup) {
      return (
        <StreakPopup
          days={finishData.streakDays}
          frozen={finishData.freezeUsed}
          onDone={() => setShowStreakPopup(false)}
        />
      )
    }
    return <ResultScreen data={finishData} onHome={() => navigate('/')} />
  }

  const currentWord = words[currentIndex]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">

      {/* Прогресс бар */}
      <div className="px-4 pt-12 pb-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400">
            <IconArrowLeft size={20} />
          </button>
          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex / words.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-400 whitespace-nowrap">
            {currentIndex + 1} / {words.length}
          </span>
        </div>
      </div>

      {/* Игровой контент */}
      <div className="flex-1 px-4 py-8 md:max-w-2xl md:mx-auto w-full">
        {mode === 'MATCHING' && (
          <MatchingMode
            words={words}
            onFinish={finishSession}
          />
        )}
        {mode === 'WRITING' && currentWord && (
          <WritingMode
            key={currentIndex}
            word={currentWord}
            onResult={handleResult}
          />
        )}
        {mode === 'TIME_ATTACK' && currentWord && (
          <TimeAttackMode
            key={currentIndex}
            word={currentWord}
            onResult={handleResult}
          />
        )}
        {mode === 'SURVIVAL' && currentWord && (
          <SurvivalMode
            word={currentWord}
            onResult={handleResult}
            onGameOver={() => finishSession(resultsRef.current)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Режим: Дописывание ───────────────────────────────────────────────────────
function WritingMode({ word, onResult }) {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState(null)
  const inputRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  if (!word) return null

  const check = () => {
    if (!input.trim() || status || doneRef.current) return
    doneRef.current = true
    const correct = input.trim().toLowerCase() === word.translation.toLowerCase()
    setStatus(correct ? 'correct' : 'wrong')
    setTimeout(() => onResult(word.wordId, correct, correct ? 4 : 1), 800)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Переведите слово</p>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{word.word}</h2>
        <p className="text-sm text-gray-400 mt-1">{word.topic}</p>
      </div>

      <div className={`w-full rounded-2xl border-2 transition-colors overflow-hidden
        ${status === 'correct' ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
          : status === 'wrong' ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          disabled={!!status}
          placeholder="Введите перевод..."
          className="w-full px-4 py-4 text-lg text-center bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-300"
        />
      </div>

      {status === 'wrong' && (
        <p className="text-red-500 text-sm">
          Правильно: <span className="font-medium">{word.translation}</span>
        </p>
      )}

      <button
        onClick={check}
        disabled={!!status || !input.trim()}
        className="w-full py-4 rounded-2xl text-white font-medium disabled:opacity-50 transition-opacity"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
      >
        Проверить
      </button>
    </div>
  )
}

// ─── Режим: На время ──────────────────────────────────────────────────────────
function TimeAttackMode({ word, onResult }) {
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [status, setStatus] = useState(null)
  const [expired, setExpired] = useState(false)
  const inputRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (doneRef.current) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          setExpired(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (expired && !doneRef.current && word) {
      doneRef.current = true
      onResult(word.wordId, false, 0)
    }
  }, [expired])

  if (!word) return null

  const check = () => {
    if (!input.trim() || status || doneRef.current) return
    doneRef.current = true
    const correct = input.trim().toLowerCase() === word.translation.toLowerCase()
    setStatus(correct ? 'correct' : 'wrong')
    setTimeout(() => onResult(word.wordId, correct, correct ? 5 : 1), 600)
  }

  const pct = (timeLeft / 30) * 100
  const timerColor = timeLeft > 15 ? '#7C3AED' : timeLeft > 7 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#E5E7EB" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke={timerColor} strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color: timerColor }}>{timeLeft}</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Переведите слово</p>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{word.word}</h2>
        <p className="text-sm text-gray-400 mt-1">{word.topic}</p>
      </div>

      <div className={`w-full rounded-2xl border-2 transition-colors overflow-hidden
        ${status === 'correct' ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
          : status === 'wrong' ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
            : expired ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          disabled={!!status || expired}
          placeholder={expired ? 'Время вышло!' : 'Введите перевод...'}
          className="w-full px-4 py-4 text-lg text-center bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-300"
        />
      </div>

      {status === 'wrong' && (
        <p className="text-red-500 text-sm">
          Правильно: <span className="font-medium">{word.translation}</span>
        </p>
      )}

      {expired && !status && (
        <p className="text-orange-500 text-sm">
          Время вышло! Правильно: <span className="font-medium">{word.translation}</span>
        </p>
      )}

      <button
        onClick={check}
        disabled={!!status || !input.trim() || expired}
        className="w-full py-4 rounded-2xl text-white font-medium disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
      >
        Проверить
      </button>
    </div>
  )
}

// ─── Режим: Выживание ─────────────────────────────────────────────────────────
function SurvivalMode({ word, onResult, onGameOver }) {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState(null)
  const [lives, setLives] = useState(3)
  const inputRef = useRef(null)
  const doneRef = useRef(false)

    useEffect(() => {
    setInput('')
    setStatus(null)
    doneRef.current = false
    inputRef.current?.focus()
  }, [word])

  if (!word) return null

  const check = () => {
    if (!input.trim() || status || doneRef.current) return
    const correct = input.trim().toLowerCase() === word.translation.toLowerCase()
    const newLives = correct ? lives : lives - 1

    setStatus(correct ? 'correct' : 'wrong')
    if (!correct) setLives(newLives)

    setTimeout(() => {
      doneRef.current = true
      if (!correct && newLives <= 0) {
        onGameOver()
      } else {
        onResult(word.wordId, correct, correct ? 4 : 1)
      }
    }, 800)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(i => (
          <div key={i}>
            {i <= lives
              ? <IconHeartFilled size={28} className="text-red-500" />
              : <IconHeart size={28} className="text-gray-300" />
            }
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Переведите слово</p>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{word.word}</h2>
        <p className="text-sm text-gray-400 mt-1">{word.topic}</p>
      </div>

      <div className={`w-full rounded-2xl border-2 transition-colors overflow-hidden
        ${status === 'correct' ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
          : status === 'wrong' ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          disabled={!!status}
          placeholder="Введите перевод..."
          className="w-full px-4 py-4 text-lg text-center bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-300"
        />
      </div>

      {status === 'wrong' && (
        <p className="text-red-500 text-sm">
          Правильно: <span className="font-medium">{word.translation}</span>
        </p>
      )}

      <button
        onClick={check}
        disabled={!!status || !input.trim()}
        className="w-full py-4 rounded-2xl text-white font-medium disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
      >
        Проверить
      </button>
    </div>
  )
}

// ─── Режим: Сопоставление ─────────────────────────────────────────────────────
// ─── Режим: Сопоставление ─────────────────────────────────────────────────────
function MatchingMode({ words, onFinish }) {
  const [selected, setSelected] = useState({ left: null, right: null })
  const [matched, setMatched] = useState([])
  const [wrong, setWrong] = useState([])
  const [isChecking, setIsChecking] = useState(false)

  const shuffledRight = useRef([...words].sort(() => Math.random() - 0.5))
  const matchedRef = useRef([])
  const finishedRef = useRef(false)
  const processedPairRef = useRef(null) // защита от повторной обработки одной пары
  // (React StrictMode дважды вызывает updater)

  const handleLeft = (wordId) => {
    if (isChecking || matchedRef.current.includes(wordId)) return
    setSelected(prev => ({ ...prev, left: wordId }))
  }

  const handleRight = (word) => {
    if (isChecking || matchedRef.current.includes(word.wordId)) return
    setSelected(prev => ({ ...prev, right: word }))
  }

  // Побочные эффекты вынесены сюда — useEffect в StrictMode
  // тоже может вызываться дважды при монтировании, но НЕ при
  // каждом обновлении состояния, а именно от смены selected
  // мы защищаемся ключом processedPairRef.
  useEffect(() => {
    const { left, right } = selected
    if (left === null || right === null) return

    const pairKey = `${left}-${right.wordId}`
    if (processedPairRef.current === pairKey) return
    processedPairRef.current = pairKey

    const correct = left === right.wordId

    if (correct) {
      if (!matchedRef.current.includes(left)) {
        const newMatched = [...matchedRef.current, left]
        matchedRef.current = newMatched
        setMatched(newMatched)
      }

      const timer = setTimeout(() => {
        setSelected({ left: null, right: null })
        processedPairRef.current = null

        if (matchedRef.current.length === words.length && !finishedRef.current) {
          finishedRef.current = true
          onFinish(words.map(w => ({ wordId: w.wordId, correct: true, quality: 5 })))
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setIsChecking(true)
      setWrong([left, right.wordId])
      const timer = setTimeout(() => {
        setWrong([])
        setSelected({ left: null, right: null })
        setIsChecking(false)
        processedPairRef.current = null
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [selected, words, onFinish])

  const getLeftStyle = (wordId) => {
    if (matched.includes(wordId)) return 'border-green-400 bg-green-50 dark:bg-green-900/20 opacity-40 cursor-default'
    if (wrong.includes(wordId)) return 'border-red-400 bg-red-50 dark:bg-red-900/20'
    if (selected.left === wordId) return 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
    return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
  }

  const getRightStyle = (wordId) => {
    if (matched.includes(wordId)) return 'border-green-400 bg-green-50 dark:bg-green-900/20 opacity-40 cursor-default'
    if (wrong.includes(wordId)) return 'border-red-400 bg-red-50 dark:bg-red-900/20'
    if (selected.right?.wordId === wordId) return 'border-violet-500 bg-violet-50 dark:bg-violet-900/30'
    return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
  }

  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider text-center mb-2">
        Сопоставьте слова с переводами
      </p>
      <p className="text-center text-sm text-violet-600 font-medium mb-4">
        {matched.length} / {words.length}
      </p>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-2">
          {words.map(w => (
            <button
              key={w.wordId}
              onClick={() => handleLeft(w.wordId)}
              className={`w-full py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all text-gray-900 dark:text-white ${getLeftStyle(w.wordId)}`}
            >
              {w.word}
            </button>
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {shuffledRight.current.map(w => (
            <button
              key={w.wordId}
              onClick={() => handleRight(w)}
              className={`w-full py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all text-gray-900 dark:text-white ${getRightStyle(w.wordId)}`}
            >
              {w.translation}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Экран результатов ────────────────────────────────────────────────────────
function ResultScreen({ data, onHome }) {
  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-gray-500">Сессия завершена</p>
      <button onClick={onHome} className="bg-violet-600 text-white px-6 py-3 rounded-2xl">
        На главную
      </button>
    </div>
  )

  const accuracy = Math.round(data.accuracyPercent)
  const emoji = accuracy >= 90 ? '🏆' : accuracy >= 70 ? '🎉' : accuracy >= 50 ? '💪' : '📚'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div
        className="px-4 pt-16 pb-10 flex flex-col items-center text-center"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
      >
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="text-white text-2xl font-bold mb-1">Сессия завершена!</h2>
        <p className="text-violet-200 text-sm">
          {accuracy >= 90 ? 'Отличный результат!'
            : accuracy >= 70 ? 'Хороший результат!'
              : 'Продолжайте практиковаться!'}
        </p>
      </div>

      <div className="px-4 pt-6 flex flex-col gap-4 md:max-w-2xl md:mx-auto w-full">
        <div className="grid grid-cols-3 gap-3">
          <ResultCard label="Точность" value={`${accuracy}%`} color="text-violet-600" />
          <ResultCard label="Правильно" value={data.correct} color="text-green-500" />
          <ResultCard label="Ошибки" value={data.incorrect} color="text-red-400" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Заработано</p>
              <p className="text-2xl font-bold text-violet-600 mt-0.5">+{data.xpEarned} XP</p>
            </div>
            {data.accuracyDelta !== null && data.accuracyDelta !== undefined && (
              <div className={`text-right ${data.accuracyDelta >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                <p className="text-xs text-gray-400 uppercase tracking-wider">vs прошлый раз</p>
                <p className="text-xl font-bold mt-0.5">
                  {data.accuracyDelta >= 0 ? '+' : ''}{data.accuracyDelta}%
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onHome}
          className="w-full py-4 rounded-2xl text-white font-medium"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
        >
          На главную
        </button>
      </div>
    </div>
  )
}

function ResultCard({ label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-100 dark:border-gray-700">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}