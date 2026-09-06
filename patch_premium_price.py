import re

with open("frontend/src/ui/pages/PremiumPage.jsx", "r") as f:
    content = f.read()

content = content.replace("$4.99", "$3.00")

with open("frontend/src/ui/pages/PremiumPage.jsx", "w") as f:
    f.write(content)
