import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../core/context/AuthContext'
import api from '../../core/api'
import {
  IconFlame,
  IconPuzzle,
  IconPencil,
  IconClock,
  IconHeart,
  IconArrowsExchange,
  IconPlayerPlay,
  IconStar
} from '@tabler/icons-react'

const MODES = [
  { key: 'MATCHING',   icon: IconPuzzle, label: 'Сопоставление', hint: 'два столбца'     },
  { key: 'WRITING',    icon: IconPencil, label: 'Дописывание',   hint: 'вводишь перевод' },
  { key: 'TIME_ATTACK',icon: IconClock,  label: 'На время',      hint: '30 секунд'       },
  { key: 'SURVIVAL',   icon: IconHeart,  label: 'Выживание',     hint: '3 жизни'         },
]

const WORD_COUNTS = [5, 10, 15, 20, 30, 50]

export default function LearningPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [languages, setLanguages] = useState([])
  const [stats, setStats] = useState(null)
  const [langFrom, setLangFrom] = useState('en')
  const [langTo, setLangTo] = useState('ru')
  const [mode, setMode] = useState('MATCHING')
  const [wordCount, setWordCount] = useState(10)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/languages').then(r => setLanguages(r.data))
    api.get('/api/users/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const swapLanguages = () => {
    setLangFrom(langTo)
    setLangTo(langFrom)
  }

  const startSession = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/sessions/start', {
        langFromCode: langFrom,
        langToCode: langTo,
        mode,
        topic: null,
        wordCount,
      })
      navigate('/session', { state: { session: data } })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const langName = code => languages.find(l => l.code === code)?.name || code

  return (
    <div className="pb-4">

      {/* Хедер */}
      <div
        className="px-4 pt-12 pb-6"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <h1 className="text-white text-xl font-semibold">Обучение</h1>
            <p className="text-violet-200 text-sm mt-0.5">
              {stats
                ? `${stats.learningWords} слов готовы к повторению`
                : 'Загрузка...'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/15 rounded-2xl px-3 py-2.5">
            <div className="flex items-center gap-1 mb-0.5">
              <IconFlame size={14} color="white" />
              <span className="text-white text-sm font-medium">
                {stats?.currentStreak ?? 0}
              </span>
            </div>
            <p className="text-violet-200 text-[11px]">дней подряд</p>
          </div>
          <div className="bg-white/15 rounded-2xl px-3 py-2.5">
            <div className="flex items-center gap-1 mb-0.5">
              <IconStar size={14} color="white" />
              <span className="text-white text-sm font-medium">
                {stats?.xp ?? 0}
              </span>
            </div>
            <p className="text-violet-200 text-[11px]">очков XP</p>
          </div>
          <div className="bg-white/15 rounded-2xl px-3 py-2.5">
            <div className="mb-0.5">
              <span className="text-white text-sm font-medium">
                {stats?.averageAccuracy ?? 0}%
              </span>
            </div>
            <p className="text-violet-200 text-[11px]">точность</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">

        {/* Языковая пара */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-3">Языковая пара</p>
          <div className="flex items-center gap-3">
            <select
              value={langFrom}
              onChange={e => setLangFrom(e.target.value)}
              className="flex-1 bg-violet-50 dark:bg-gray-700 text-violet-700 dark:text-violet-300 font-medium text-sm rounded-xl px-3 py-2.5 border border-violet-200 dark:border-violet-800 outline-none"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>

            <button
              onClick={swapLanguages}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"
            >
              <IconArrowsExchange size={18} className="text-gray-500 dark:text-gray-400" />
            </button>

            <select
              value={langTo}
              onChange={e => setLangTo(e.target.value)}
              className="flex-1 bg-violet-50 dark:bg-gray-700 text-violet-700 dark:text-violet-300 font-medium text-sm rounded-xl px-3 py-2.5 border border-violet-200 dark:border-violet-800 outline-none"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Режим */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-3">Режим тренировки</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {MODES.map(({ key, icon: Icon, label, hint }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left
                  ${mode === key
                    ? 'bg-violet-50 dark:bg-violet-900/30 border-violet-400 dark:border-violet-600'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
              >
                <Icon
                  size={20}
                  className={`mb-2 ${mode === key ? 'text-violet-600' : 'text-gray-400'}`}
                />
                <span className={`text-sm font-medium block ${mode === key ? 'text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {label}
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5">{hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Количество слов */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">Количество слов</p>
            <span className="text-violet-600 font-semibold text-lg">{wordCount}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {WORD_COUNTS.map(n => (
              <button
                key={n}
                onClick={() => setWordCount(n)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-all
                  ${wordCount === n
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Кнопка старт */}
        <button
          onClick={startSession}
          disabled={loading || langFrom === langTo}
          className="w-full py-4 rounded-2xl text-white font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
        >
          <IconPlayerPlay size={18} />
          {loading ? 'Загружаем слова...' : 'Начать сессию'}
        </button>

        {langFrom === langTo && (
          <p className="text-center text-sm text-red-400">
            Выберите разные языки
          </p>
        )}

      </div>
    </div>
  )
}