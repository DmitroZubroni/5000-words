import re

with open("frontend/src/ui/pages/LeaderboardPage.jsx", "r") as f:
    content = f.read()

league_block = """
      {scope === 'league' && leagueInfo && (
        <div className="px-4 py-5 mb-2 bg-white/5 dark:bg-gray-800/50 rounded-2xl mx-4 mt-4 border border-violet-100 dark:border-violet-900/30">
          <h2 className="text-lg font-bold text-violet-700 dark:text-violet-400 text-center">Лига: {leagueInfo.leagueName}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">Осталось {leagueInfo.xpToNextLeague} XP до следующей лиги</p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div className="bg-violet-500 dark:bg-violet-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(leagueInfo.xpInLeague / 10000) * 100}%` }}></div>
          </div>
        </div>
      )}
"""

content = content.replace('      <div className="px-4 pt-4 flex flex-col gap-2">', league_block + '      <div className="px-4 pt-4 flex flex-col gap-2">')

with open("frontend/src/ui/pages/LeaderboardPage.jsx", "w") as f:
    f.write(content)
