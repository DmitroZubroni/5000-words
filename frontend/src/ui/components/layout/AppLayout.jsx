import { Outlet, NavLink } from 'react-router-dom'
import {
  IconBook,
  IconChartBar,
  IconSword,
  IconUsers,
  IconUser,
  IconTrophy
} from '@tabler/icons-react'

const tabs = [
  { to: '/',            icon: IconBook,     label: 'Обучение'  },
  { to: '/progress',    icon: IconChartBar, label: 'Прогресс'  },
  { to: '/leaderboard', icon: IconTrophy,   label: 'Топ'       },
  { to: '/duels',       icon: IconSword,    label: 'Дуэли'     },
  { to: '/friends',     icon: IconUsers,    label: 'Друзья'    },
  { to: '/profile',     icon: IconUser,     label: 'Профиль'   },
]

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">

      <main className="flex-1 overflow-y-auto pb-24 w-full md:max-w-2xl md:mx-auto lg:max-w-4xl">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex pt-2 w-full md:max-w-2xl md:mx-auto lg:max-w-4xl">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 pb-1 cursor-pointer transition-colors
                ${isActive ? 'text-violet-600' : 'text-gray-400 dark:text-gray-500'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-1 h-1 rounded-full mb-0.5 ${isActive ? 'bg-violet-600' : 'bg-transparent'}`} />
                  <Icon size={22} stroke={isActive ? 2 : 1.5} />
                  <span className={`text-[10px] ${isActive ? 'font-medium' : ''}`}>
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