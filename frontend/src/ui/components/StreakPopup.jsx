import { useEffect, useState } from 'react'

/**
 * Полноэкранный momentary попап при увеличении стрика.
 * Показывается ~2.2 секунды и автоматически исчезает.
 * Психологический механизм из Duolingo/Snapchat — стрик не просто
 * цифра в углу, а яркое событие которое хочется поддерживать.
 */
export default function StreakPopup({ days, onDone, frozen }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), 1900)
    const t2 = setTimeout(() => onDone(), 2300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-400
        ${visible ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: frozen ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' : 'linear-gradient(135deg, #F97316 0%, #DC2626 100%)' }}
    >
            <div className="text-8xl mb-4 animate-flame-pop">{frozen ? '🧊' : '🔥'}</div>
      <div className="text-white text-5xl font-bold animate-count-pop">{days}</div>
            <p className="text-white text-lg font-medium mt-2">
        {days === 1 ? 'день подряд!' : 'дней подряд!'}
      </p>
      <p className="text-orange-100 text-sm mt-1">
        {frozen ? 'Premium спас твой стрик!' : 'Не прерывай серию завтра 🔥'}
      </p>

      <style>{`
        @keyframes flame-pop {
          0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes count-pop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-flame-pop { animation: flame-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-count-pop { animation: count-pop 0.4s ease-out 0.2s both; }
      `}</style>
    </div>
  )
}
