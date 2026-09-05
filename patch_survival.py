import re

with open("frontend/src/ui/pages/SessionPage.jsx", "r") as f:
    content = f.read()

# 1. Remove key={currentIndex} from SurvivalMode
survival_render = re.search(r'<SurvivalMode\s+key=\{currentIndex\}\s+word=\{currentWord\}', content)
if survival_render:
    content = content.replace(survival_render.group(0), '<SurvivalMode\n            word={currentWord}')
else:
    print("Survival render not found")

# 2. Add useEffect to SurvivalMode
survival_func = re.search(r'function SurvivalMode\(\{ word, onResult, onGameOver \}\) \{[\s\S]*?inputRef\.current\?\.focus\(\)\s*\}, \[\]\)', content)
if survival_func:
    new_useEffect = """  useEffect(() => {
    setInput('')
    setStatus(null)
    doneRef.current = false
    inputRef.current?.focus()
  }, [word])"""
    content = content.replace(survival_func.group(0), survival_func.group(0).replace("useEffect(() => {\n    inputRef.current?.focus()\n  }, [])", new_useEffect))
else:
    print("Survival func not found")

with open("frontend/src/ui/pages/SessionPage.jsx", "w") as f:
    f.write(content)
