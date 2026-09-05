import re

with open("frontend/src/core/context/ThemeContext.jsx", "w") as f:
    f.write("""import { createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: 'dark', toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
""")

with open("frontend/src/ui/pages/ProfilePage.jsx", "r") as f:
    content = f.read()

# Remove theme toggle from ProfilePage
toggle_block = re.search(r'<div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4">.*?<IconMoon size={24} />.*?</button>\s*</div>\s*</div>', content, re.DOTALL)
if toggle_block:
    content = content.replace(toggle_block.group(0), "")

with open("frontend/src/ui/pages/ProfilePage.jsx", "w") as f:
    f.write(content)

