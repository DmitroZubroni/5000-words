import re

with open("frontend/src/ui/components/StreakPopup.jsx", "r") as f:
    content = f.read()

content = content.replace("export default function StreakPopup({ days, onDone }) {", "export default function StreakPopup({ days, onDone, frozen }) {")

bg_logic = """      style={{ background: frozen ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' : 'linear-gradient(135deg, #F97316 0%, #DC2626 100%)' }}"""
content = content.replace("style={{ background: 'linear-gradient(135deg, #F97316 0%, #DC2626 100%)' }}", bg_logic)

icon_logic = """      <div className="text-8xl mb-4 animate-flame-pop">{frozen ? '🧊' : '🔥'}</div>"""
content = content.replace("""<div className="text-8xl mb-4 animate-flame-pop">🔥</div>""", icon_logic)

text_logic = """      <p className="text-white text-lg font-medium mt-2">
        {days === 1 ? 'день подряд!' : 'дней подряд!'}
      </p>
      <p className="text-orange-100 text-sm mt-1">
        {frozen ? 'Premium спас твой стрик!' : 'Не прерывай серию завтра 🔥'}
      </p>"""
content = content.replace("""<p className="text-white text-lg font-medium mt-2">
        {days === 1 ? 'день подряд!' : 'дней подряд!'}
      </p>
      <p className="text-orange-100 text-sm mt-1">Не прерывай серию завтра 🔥</p>""", text_logic)

with open("frontend/src/ui/components/StreakPopup.jsx", "w") as f:
    f.write(content)
