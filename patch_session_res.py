import re

with open("backend/src/main/java/com/vocabapp/backend/dto/SessionFinishResponse.java", "r") as f:
    content = f.read()

content = content.replace("boolean streakIncreased,", "boolean streakIncreased,\n    boolean freezeUsed,")

with open("backend/src/main/java/com/vocabapp/backend/dto/SessionFinishResponse.java", "w") as f:
    f.write(content)
