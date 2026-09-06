import { useEffect, useState } from 'react'
import { IconX, IconCoffee, IconBrandTelegram, IconCheck, IconCopy, IconShieldCheck, IconExternalLink } from '@tabler/icons-react'

export default function DonateModal({ onClose }) {
  const [copied, setCopied] = useState(false)
  const donateUrl = 'https://pay.cloudtips.ru/p/42656f86'
  const telegramUrl = 'https://t.me/DmitroZybroni'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const copyLink = () => {
    navigator.clipboard.writeText(donateUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Декоративное свечение */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-600/20 blur-3xl rounded-full pointer-events-none" />

        {/* Верхняя панель */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-300 text-[11px] font-medium uppercase tracking-wider">
            <IconCoffee size={14} />
            <span>Поддержать проект</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Заголовок и описание */}
        <div className="mb-6 text-left">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Спасибо за поддержку! ☕
          </h2>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            5000 Words создаётся с душой, чтобы изучение языков было доступным, бесплатным и эффективным для всех. Ваш донат помогает оплачивать серверы и делать приложение ещё лучше.
          </p>
        </div>

        {/* Основная кнопка доната CloudTips */}
        <div className="space-y-3">
          <a
            href={donateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-violet-600/40 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <IconCoffee size={22} className="text-white" />
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="font-semibold text-sm">
                  Отправить донат (CloudTips)
                </span>
                <span className="text-xs text-violet-200 mt-0.5">
                  СБП, банковские карты, T-Pay, SberPay
                </span>
              </div>
            </div>
            <IconExternalLink size={18} className="shrink-0 text-white/80 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Кнопка копирования ссылки */}
          <button
            type="button"
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {copied ? (
              <>
                <IconCheck size={16} className="text-green-500" />
                <span className="text-green-600 dark:text-green-400">Ссылка скопирована!</span>
              </>
            ) : (
              <>
                <IconCopy size={16} className="text-gray-400" />
                <span>Скопировать ссылку на донат</span>
              </>
            )}
          </button>
        </div>

        {/* Безопасность */}
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-gray-400">
          <IconShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span>Безопасный платёж через платёжный сервис CloudTips</span>
        </div>

        {/* Telegram автора */}
        <div className="mt-5 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center shrink-0">
              <IconBrandTelegram size={20} />
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                Связь с разработчиком
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                @DmitroZybroni
              </span>
            </div>
          </div>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 text-[#229ED9] text-xs font-semibold transition-colors shrink-0"
          >
            Написать ↗
          </a>
        </div>
      </div>
    </div>
  )
}
