import re

with open("frontend/src/ui/pages/LeaderboardPage.jsx", "r") as f:
    content = f.read()

# Change default scope
content = content.replace("const [scope, setScope] = useState('global') // global | friends | league", "const [scope, setScope] = useState('league')")

# Remove global button completely
global_btn_regex = re.compile(r'<button\s*onClick=\{[^}]*setScope\(\'global\'\)[^}]*\}[\s\S]*?</button>')
content = global_btn_regex.sub('', content)

# Also fix the fallback text:
content = content.replace("{scope === 'global' ? 'Все участники' : 'Вы и ваши друзья'}", "{scope === 'league' ? 'Ваша лига' : 'Вы и ваши друзья'}")

with open("frontend/src/ui/pages/LeaderboardPage.jsx", "w") as f:
    f.write(content)
