import re

with open("frontend/src/ui/pages/LearningPage.jsx", "r") as f:
    content = f.read()

# Replace toast.error with toast and alert just in case
error_catch = r"toast\.error\(e\.response\?\.data\?\.message \|\| 'Не удалось начать сессию'\)"
new_catch = "toast.error(e.response?.data?.message || 'Не удалось начать сессию');\n      if(e.response?.status === 400 || e.response?.status === 403) alert(e.response?.data?.message);"

content = re.sub(error_catch, new_catch, content)

with open("frontend/src/ui/pages/LearningPage.jsx", "w") as f:
    f.write(content)
