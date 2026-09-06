import re

with open("frontend/src/ui/pages/ProfilePage.jsx", "r") as f:
    content = f.read()

# 1. Add useState for achievements
state_regex = r"const \[stats, setStats\] = useState\(null\)"
new_state = "const [stats, setStats] = useState(null)\n  const [achievements, setAchievements] = useState([])"
content = re.sub(state_regex, new_state, content)

# 2. Add API call for achievements
effect_regex = r"api\.get\('/api/users/stats'\)\.then\(r => setStats\(r\.data\)\)\.catch\(\(\) => \{\}\)"
new_effect = "api.get('/api/users/stats').then(r => setStats(r.data)).catch(() => {})\n    api.get('/api/achievements').then(r => setAchievements(r.data)).catch(() => {})"
content = re.sub(effect_regex, new_effect, content)

# 3. Add Medal icon import
icon_regex = r"IconUser,"
new_icon = "IconUser,\n  IconMedal,"
content = re.sub(icon_regex, new_icon, content)

# 4. Add Achievements section
achievements_ui = """
        {/* Ачивки */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 pb-2">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">
              Достижения
            </p>
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
              {achievements.filter(a => a.earned).length} / {achievements.length}
            </span>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 pb-2 snap-x">
            {achievements.map((ach) => (
              <div 
                key={ach.code}
                className={`snap-center shrink-0 w-28 p-3 rounded-xl border flex flex-col items-center text-center transition-colors
                  ${ach.earned 
                    ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30' 
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2
                  ${ach.earned ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                  <IconMedal size={20} />
                </div>
                <p className={`text-xs font-medium mb-1 ${ach.earned ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                  {ach.title}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">
                  {ach.description}
                </p>
              </div>
            ))}
          </div>
        </div>
"""
# Insert before "Подписка"
content = content.replace("{/* Подписка */}", achievements_ui + "\n        {/* Подписка */}")

with open("frontend/src/ui/pages/ProfilePage.jsx", "w") as f:
    f.write(content)
