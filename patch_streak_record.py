import re

with open("backend/src/main/java/com/vocabapp/backend/service/StreakService.java", "r") as f:
    content = f.read()

content = content.replace("public record StreakResult(int streakDays, boolean increased) {}", "public record StreakResult(int streakDays, boolean increased, boolean freezeUsed) {}")
content = content.replace("return new StreakResult(user.getStreakDays(), increased);", "return new StreakResult(user.getStreakDays(), increased, freezeUsed);")

with open("backend/src/main/java/com/vocabapp/backend/service/StreakService.java", "w") as f:
    f.write(content)
