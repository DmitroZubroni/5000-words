import { useNavigate } from 'react-router-dom'
import { IconChevronLeft, IconShieldCheck, IconRocket, IconInfinity, IconCrown } from '@tabler/icons-react'
import { useAuth } from '../../core/context/AuthContext'
import api from '../../core/api'

export default function PremiumPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleBuy = async () => {
    // В будущем здесь будет интеграция с платежкой (Stripe/Apple Pay/и т.д.)
    alert('Интеграция с платежной системой в разработке!')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8 flex flex-col relative overflow-hidden">
      {/* Декоративный фон */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-violet-600/20 to-transparent" />
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-violet-600/30 blur-3xl rounded-full" />
      <div className="absolute top-16 -left-16 w-48 h-48 bg-fuchsia-600/20 blur-3xl rounded-full" />

      <div className="relative px-4 pt-12 pb-4 flex items-center justify-between z-10">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-700">
          <IconChevronLeft size={20} className="text-gray-900 dark:text-white" />
        </button>
      </div>

      <div className="relative px-6 pt-4 pb-8 text-center z-10 flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="w-20 h-20 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-600/30">
          <IconCrown size={40} className="text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          5000 Words <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">PRO</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">
          Учите язык без ограничений и достигайте целей быстрее
        </p>

        <div className="space-y-4 text-left bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <Feature icon={<IconInfinity />} title="Безлимит новых слов" desc="Учите столько, сколько хотите, без дневных ограничений" />
          <Feature icon={<IconRocket />} title="Умное повторение" desc="Приоритетный доступ к самым эффективным алгоритмам" />
          <Feature icon={<IconShieldCheck />} title="Сохранение прогресса" desc="Защита вашего стрика один раз в месяц" />
          <Feature icon={<IconCrown />} title="Безлимитные темы" desc="Доступ ко всем тематическим сессиям (бизнес, путешествия, IT и др.) без лимитов" />
        </div>

        <div className="mt-10">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Оформить подписку</p>
          <button 
            onClick={handleBuy}
            className="w-full py-4 rounded-2xl text-white font-semibold text-lg shadow-lg shadow-violet-600/30 transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #c026d3)' }}
          >
            $3.00 / месяц
          </button>
          <p className="text-xs text-gray-400 mt-4">Отменить можно в любой момент.</p>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex flex-shrink-0 items-center justify-center text-violet-600 dark:text-violet-400">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
