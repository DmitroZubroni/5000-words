import re

with open("backend/src/main/java/com/vocabapp/backend/service/StreakService.java", "r") as f:
    content = f.read()

content = content.replace("return new StreakResult(user.getStreakDays(), false);", "return new StreakResult(user.getStreakDays(), false, false);")

with open("backend/src/main/java/com/vocabapp/backend/service/StreakService.java", "w") as f:
    f.write(content)
