import re

with open("backend/src/main/java/com/vocabapp/backend/repository/UserRepository.java", "r") as f:
    content = f.read()
content = content.replace("boolean existsByUsername(String username);", "boolean existsByUsernameIgnoreCase(String username);")
with open("backend/src/main/java/com/vocabapp/backend/repository/UserRepository.java", "w") as f:
    f.write(content)

with open("backend/src/main/java/com/vocabapp/backend/service/AuthService.java", "r") as f:
    content = f.read()
content = content.replace("existsByUsername(request.username())", "existsByUsernameIgnoreCase(request.username())")
with open("backend/src/main/java/com/vocabapp/backend/service/AuthService.java", "w") as f:
    f.write(content)
