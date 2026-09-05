import re

with open("frontend/src/ui/pages/LeaderboardPage.jsx", "r") as f:
    content = f.read()

# Add league to scope
content = content.replace("const [scope, setScope] = useState('global') // global | friends", "const [scope, setScope] = useState('global') // global | friends | league\n  const [leagueInfo, setLeagueInfo] = useState(null)")

# Fetch logic
old_fetch = """  useEffect(() => {
    setLoading(true)
    const endpoint = scope === 'global' ? '/api/users/leaderboard' : '/api/users/leaderboard/friends'
    api.get(endpoint)
      .then(r => setLeaders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false))
  }, [scope])"""

new_fetch = """  useEffect(() => {
    setLoading(true)
    if (scope === 'league') {
      api.get('/api/leagues')
        .then(r => {
          setLeagueInfo(r.data)
          setLeaders(Array.isArray(r.data.leaderboard) ? r.data.leaderboard : [])
        })
        .catch(() => setLeaders([]))
        .finally(() => setLoading(false))
    } else {
      const endpoint = scope === 'global' ? '/api/users/leaderboard' : '/api/users/leaderboard/friends'
      api.get(endpoint)
        .then(r => setLeaders(Array.isArray(r.data) ? r.data : []))
        .catch(() => setLeaders([]))
        .finally(() => setLoading(false))
    }
  }, [scope])"""
content = content.replace(old_fetch, new_fetch)

# Tabs
old_tabs = """        <div className="flex bg-white/20 p-1 rounded-xl mt-6">
          <button
            onClick={() => setScope('global')}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
              scope === 'global' ? 'bg-white text-violet-600 shadow' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <IconWorld size={18} /> Все
          </button>
          <button
            onClick={() => setScope('friends')}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
              scope === 'friends' ? 'bg-white text-violet-600 shadow' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <IconUsers size={18} /> Друзья
          </button>
        </div>"""

new_tabs = """        <div className="flex bg-white/20 p-1 rounded-xl mt-6">
          <button
            onClick={() => setScope('global')}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
              scope === 'global' ? 'bg-white text-violet-600 shadow' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <IconWorld size={18} /> Все
          </button>
          <button
            onClick={() => setScope('friends')}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
              scope === 'friends' ? 'bg-white text-violet-600 shadow' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <IconUsers size={18} /> Друзья
          </button>
          <button
            onClick={() => setScope('league')}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
              scope === 'league' ? 'bg-white text-violet-600 shadow' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <IconTrophy size={18} /> Лига
          </button>
        </div>"""
content = content.replace(old_tabs, new_tabs)

# League info block above leaderboard
league_block = """
      {scope === 'league' && leagueInfo && (
        <div className="px-4 py-4 text-center border-b dark:border-gray-800">
          <h2 className="text-xl font-bold text-violet-600 dark:text-violet-400">Лига: {leagueInfo.leagueName}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Осталось {leagueInfo.xpToNextLeague} XP до следующей лиги</p>
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 mt-3">
            <div className="bg-violet-600 h-2.5 rounded-full" style={{ width: `${(leagueInfo.xpInLeague / 10000) * 100}%` }}></div>
          </div>
        </div>
      )}
"""
content = content.replace('      <div className="px-4 mt-8 flex flex-col gap-2">', league_block + '      <div className="px-4 mt-8 flex flex-col gap-2">')

with open("frontend/src/ui/pages/LeaderboardPage.jsx", "w") as f:
    f.write(content)
