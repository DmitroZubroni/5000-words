import re

with open("backend/src/main/java/com/vocabapp/backend/service/SessionService.java", "r") as f:
    content = f.read()

content = content.replace("streakResult.streakDays(), streakResult.increased(),", "streakResult.streakDays(), streakResult.increased(), streakResult.freezeUsed(),")

with open("backend/src/main/java/com/vocabapp/backend/service/SessionService.java", "w") as f:
    f.write(content)
