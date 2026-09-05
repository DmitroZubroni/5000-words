import re

with open("frontend/src/index.css", "r") as f:
    content = f.read()

content = content.replace(":root {", ":root {\n  color-scheme: dark;")

with open("frontend/src/index.css", "w") as f:
    f.write(content)
