import re

with open("frontend/src/ui/pages/SessionPage.jsx", "r") as f:
    content = f.read()

content = content.replace("days={finishData.streakDays}", "days={finishData.streakDays}\n          frozen={finishData.freezeUsed}")

with open("frontend/src/ui/pages/SessionPage.jsx", "w") as f:
    f.write(content)
