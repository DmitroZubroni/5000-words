import { Outlet, NavLink } from 'react-router-dom'
import {
  IconBook,
  IconChartBar,
  IconSword,
  IconUsers,
  IconUser
} from '@tabler/icons-react'

const tabs = [
  { to: '/', icon: IconBook, label: 'Обучение' },
  { to: '/progress', icon: IconChartBar, label: 'Прогресс' },
  { to: '/duels', icon: IconSword, label: 'Дуэли' },
  { to: '/friends', icon: IconUsers, label: 'Друзья' },
  { to: '/profile', icon: IconUser, label: 'Профиль' },
]

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen max-w-sm mx-auto bg-gray-50 dark:bg-gray-900">
      {/* Контент страницы */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Нижний таббар */}
      <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-4 pt-2">
        <div className="flex">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 pt-1 cursor-pointer transition-colors
                ${isActive
                  ? 'text-violet-600'
                  : 'text-gray-400 dark:text-gray-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-1 h-1 rounded-full mb-0.5 ${isActive ? 'bg-violet-600' : 'bg-transparent'}`} />
                  <Icon size={24} stroke={1.5} />
                  <span className={`text-[11px] ${isActive ? 'font-medium' : ''}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}