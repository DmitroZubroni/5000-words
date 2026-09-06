import re

with open("backend/src/main/java/com/vocabapp/backend/repository/UserRepository.java", "r") as f:
    content = f.read()

old_query = "WHERE u.username LIKE %:query%"
new_query = "WHERE lower(u.username) LIKE lower(concat('%', :query, '%'))"
content = content.replace(old_query, new_query)

with open("backend/src/main/java/com/vocabapp/backend/repository/UserRepository.java", "w") as f:
    f.write(content)
