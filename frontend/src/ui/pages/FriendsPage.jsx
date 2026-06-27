import { useState, useEffect } from 'react'
import api from '../../core/api'
import {
  IconSearch,
  IconUserPlus,
  IconUserCheck,
  IconUsers,
  IconX,
  IconCheck,
  IconSword,
  IconTrophy
} from '@tabler/icons-react'

export default function FriendsPage() {
  const [tab, setTab] = useState('friends') // friends | requests | search
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.get('/api/friends'),
        api.get('/api/friends/requests'),
      ])
      setFriends(friendsRes.data)
      setRequests(requestsRes.data)
    } finally {
      setLoading(false)
    }
  }

  const search = async (q) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    const { data } = await api.get(`/api/friends/search?q=${q}`)
    setSearchResults(data)
  }

  const sendRequest = async (userId) => {
    await api.post(`/api/friends/request/${userId}`)
    setSearchResults(prev => prev.filter(u => u.id !== userId))
  }

  const acceptRequest = async (requesterId) => {
    await api.post(`/api/friends/accept/${requesterId}`)
    await loadData()
  }

  const declineRequest = async (requesterId) => {
    await api.post(`/api/friends/decline/${requesterId}`)
    setRequests(prev => prev.filter(r => r.requesterId !== requesterId))
  }

  const removeFriend = async (friendId) => {
    await api.delete(`/api/friends/${friendId}`)
    setFriends(prev => prev.filter(f => f.friendId !== friendId))
  }

  return (
    <div className="pb-4">

      {/* Хедер */}
      <div
        className="px-4 pt-12 pb-5"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
      >
        <h1 className="text-white text-xl font-semibold mb-1">Друзья</h1>
        <p className="text-violet-200 text-sm">{friends.length} друзей</p>

        {/* Поиск */}
        <div className="mt-4 relative">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => { search(e.target.value); setTab('search') }}
            onFocus={() => setTab('search')}
            placeholder="Найти пользователя..."
            className="w-full bg-white dark:bg-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none"
          />
        </div>
      </div>

      {/* Табы */}
      {tab !== 'search' && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <TabBtn active={tab === 'friends'} onClick={() => setTab('friends')} label="Друзья" count={friends.length} />
          <TabBtn active={tab === 'requests'} onClick={() => setTab('requests')} label="Запросы" count={requests.length} />
        </div>
      )}

      <div className="px-4 pt-4">

        {/* Поиск */}
        {tab === 'search' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery.length < 2 ? 'Введите минимум 2 символа' : `Результаты: ${searchResults.length}`}
              </p>
              <button onClick={() => { setTab('friends'); setSearchQuery(''); setSearchResults([]) }} className="text-violet-600 text-sm">
                Отмена
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {searchResults.map(u => (
                <div key={u.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.username} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{u.username}</p>
                      <p className="text-xs text-gray-400">Уровень {u.level}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => sendRequest(u.id)}
                    className="flex items-center gap-1.5 bg-violet-600 text-white text-xs px-3 py-1.5 rounded-xl"
                  >
                    <IconUserPlus size={14} />
                    Добавить
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Список друзей */}
        {tab === 'friends' && (
          <div className="flex flex-col gap-2">
            {friends.length === 0 ? (
              <EmptyState
                icon={<IconUsers size={40} className="text-gray-300" />}
                title="Пока нет друзей"
                subtitle="Найдите друзей через поиск выше"
              />
            ) : friends.map(f => (
              <div key={f.friendshipId} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={f.username} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{f.username}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <IconTrophy size={11} /> {f.xp} XP
                        </span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">Ур. {f.level}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                      <IconSword size={15} className="text-violet-600" />
                    </button>
                    <button
                      onClick={() => removeFriend(f.friendId)}
                      className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
                    >
                      <IconX size={15} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Входящие запросы */}
        {tab === 'requests' && (
          <div className="flex flex-col gap-2">
            {requests.length === 0 ? (
              <EmptyState
                icon={<IconUserCheck size={40} className="text-gray-300" />}
                title="Нет входящих запросов"
                subtitle="Когда кто-то добавит вас, запрос появится здесь"
              />
            ) : requests.map(r => (
              <div key={r.friendshipId} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.requesterUsername} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{r.requesterUsername}</p>
                      <p className="text-xs text-gray-400">Уровень {r.requesterLevel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptRequest(r.requesterId)}
                      className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center"
                    >
                      <IconCheck size={15} className="text-green-500" />
                    </button>
                    <button
                      onClick={() => declineRequest(r.requesterId)}
                      className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center"
                    >
                      <IconX size={15} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
      <span className="text-violet-600 dark:text-violet-300 font-semibold text-sm">
        {name?.[0]?.toUpperCase()}
      </span>
    </div>
  )
}

function TabBtn({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors
        ${active
          ? 'border-violet-600 text-violet-600'
          : 'border-transparent text-gray-400 dark:text-gray-500'
        }`}
    >
      {label} {count > 0 && <span className="ml-1 text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-600 px-1.5 py-0.5 rounded-full">{count}</span>}
    </button>
  )
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3">{icon}</div>
      <p className="text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{subtitle}</p>
    </div>
  )
}