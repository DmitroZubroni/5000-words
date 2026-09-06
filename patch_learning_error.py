import re

with open("frontend/src/ui/pages/LearningPage.jsx", "r") as f:
    content = f.read()

error_catch = r"toast\.error\(e\.response\?\.data\?\.message \|\| 'Не удалось начать сессию'\);\s*if\(e\.response\?\.status === 400 \|\| e\.response\?\.status === 403\) alert\(e\.response\?\.data\?\.message\);"
new_catch = """const msg = e.response?.data?.message
      if (msg && msg.includes('Дневной лимит')) {
        navigate('/premium')
      } else {
        toast.error(msg || 'Не удалось начать сессию')
      }"""

content = re.sub(error_catch, new_catch, content)

with open("frontend/src/ui/pages/LearningPage.jsx", "w") as f:
    f.write(content)
