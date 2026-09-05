import re

with open("frontend/src/ui/pages/DashboardPage.jsx", "r") as f:
    content = f.read()

# Add toast or alert for error
error_catch = r"\} catch \(e\) \{\s*console\.error\(e\)\s*\}"
new_catch = """} catch (e) {
      console.error(e)
      alert(e.response?.data?.message || e.message || 'Ошибка запуска сессии')
    }"""
content = re.sub(error_catch, new_catch, content)

with open("frontend/src/ui/pages/DashboardPage.jsx", "w") as f:
    f.write(content)
