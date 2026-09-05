import re

with open("frontend/src/ui/pages/ProfilePage.jsx", "r") as f:
    content = f.read()

# Remove the button for toggle
toggle_button_regex = re.compile(r'<button\s+onClick=\{toggle\}.*?</button>', re.DOTALL)
content = toggle_button_regex.sub('', content)

# Remove the hr above the button if it's there
content = content.replace('<div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />\n\n          ', '')
content = content.replace('<div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />\n\n', '')

with open("frontend/src/ui/pages/ProfilePage.jsx", "w") as f:
    f.write(content)
