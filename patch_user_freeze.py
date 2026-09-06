import re

with open("backend/src/main/java/com/vocabapp/backend/entity/User.java", "r") as f:
    content = f.read()

# Add lastFreezeUsed below lastActive
old_field = "private LocalDate lastActive;"
new_field = "private LocalDate lastActive;\n\n    private LocalDate lastFreezeUsed;"
content = content.replace(old_field, new_field)

with open("backend/src/main/java/com/vocabapp/backend/entity/User.java", "w") as f:
    f.write(content)
