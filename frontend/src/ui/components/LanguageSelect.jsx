import { useState, useRef, useEffect } from 'react'
import { IconChevronDown, IconCheck } from '@tabler/icons-react'

/**
 * Кастомный выпадающий список языков.
 * Заменяет нативный <select>, который на некоторых браузерах
 * рендерит список системным окном и может визуально "вылезать"
 * за пределы карточки при большом количестве опций.
 * Здесь список — обычный div, полностью управляется нашими стилями.
 */
export default function LanguageSelect({ value, onChange, languages }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = languages.find(l => l.code === value)

  // Закрываем список при клике снаружи
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-violet-50 dark:bg-gray-700 text-violet-700 dark:text-violet-300 font-medium text-sm rounded-xl px-3 py-2.5 border border-violet-200 dark:border-violet-800 outline-none"
      >
        <span className="truncate">{selected?.name || 'Выберите язык'}</span>
        <IconChevronDown
          size={16}
          className={`flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-h-56 overflow-y-auto">
          {languages.map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => { onChange(l.code); setOpen(false) }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors
                ${l.code === value
                  ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
            >
              {l.name}
              {l.code === value && <IconCheck size={15} className="text-violet-600 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}