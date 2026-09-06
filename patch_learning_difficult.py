import re

with open("frontend/src/ui/pages/LearningPage.jsx", "r") as f:
    content = f.read()

# Add new method
start_session_regex = r"const startSession = async \(\) => \{[\s\S]*?finally \{\n      setLoading\(false\)\n    \}\n  \}"
difficult_method = """  const startDifficultSession = async () => {
    setLoading(true)
    try {
      const { data } = await api.post(`/api/sessions/start-difficult?langToCode=${langTo}`)
      navigate('/session', { state: { session: data } })
    } catch (e) {
      const msg = e.response?.data?.message
      toast.error(msg || 'Не удалось начать сессию сложных слов')
    } finally {
      setLoading(false)
    }
  }"""

content = re.sub(start_session_regex, r"\g<0>\n\n" + difficult_method, content)

# Add icon import
icon_regex = r"IconPlayerPlay,"
new_icon = "IconPlayerPlay,\n  IconBrain,"
content = re.sub(icon_regex, new_icon, content)

# Add button
button_regex = r"<IconPlayerPlay size=\{18\} />\n\s*\{loading \? 'Загружаем слова\.\.\.' : 'Начать сессию'\}\n\s*</button>"
new_buttons = """<IconPlayerPlay size={18} />
          {loading ? 'Загружаем слова...' : 'Начать сессию'}
        </button>

        <button
          onClick={startDifficultSession}
          disabled={loading}
          className="w-full py-3 rounded-2xl text-violet-600 dark:text-violet-400 font-medium flex items-center justify-center gap-2 disabled:opacity-60 border-2 border-violet-100 dark:border-violet-900/30 transition-colors bg-white dark:bg-gray-800"
        >
          <IconBrain size={18} />
          Тренировка сложных слов
        </button>"""
content = re.sub(button_regex, new_buttons, content)

with open("frontend/src/ui/pages/LearningPage.jsx", "w") as f:
    f.write(content)
