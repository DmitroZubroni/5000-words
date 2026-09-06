import re

with open("backend/src/main/java/com/vocabapp/backend/service/SessionService.java", "r") as f:
    content = f.read()

content = content.replace("максимум 100 НОВЫХ слов в день", "максимум 50 НОВЫХ слов в день")
content = content.replace("if (newWordsToday >= 100) {", "if (newWordsToday >= 50) {")
content = content.replace("Дневной лимит 100 новых слов исчерпан", "Дневной лимит 50 новых слов исчерпан")

with open("backend/src/main/java/com/vocabapp/backend/service/SessionService.java", "w") as f:
    f.write(content)
