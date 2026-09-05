import re

with open("frontend/src/ui/pages/LeaderboardPage.jsx", "r") as f:
    content = f.read()

tabs = """        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setScope('league')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors
              ${scope === 'league' ? 'bg-white text-violet-700' : 'bg-white/15 text-white'}`}
          >
            <IconTrophy size={15} /> Лига
          </button>
          <button
            onClick={() => setScope('friends')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors
              ${scope === 'friends' ? 'bg-white text-violet-700' : 'bg-white/15 text-white'}`}
          >
            <IconUsers size={15} /> Друзья
          </button>
        </div>"""

content = re.sub(r'        \{/\* Переключатель Все / Друзья \*/\}(.|\n)*?</div>', tabs, content)

with open("frontend/src/ui/pages/LeaderboardPage.jsx", "w") as f:
    f.write(content)
