import re

with open("frontend/src/ui/pages/ProfilePage.jsx", "r") as f:
    content = f.read()

# Add useNavigate
if "useNavigate" not in content:
    content = content.replace("import { useAuth }", "import { useNavigate } from 'react-router-dom'\nimport { useAuth }")
    content = content.replace("const { user, logout } = useAuth()", "const navigate = useNavigate()\n  const { user, logout } = useAuth()")

# Replace Upgrade span with button
span = '<span className="text-xs bg-violet-600 text-white px-2.5 py-1 rounded-lg font-medium">\n                Upgrade\n              </span>'
btn = '<button onClick={() => navigate(\'/premium\')} className="text-xs bg-violet-600 text-white px-2.5 py-1 rounded-lg font-medium transition-transform active:scale-95">\n                Upgrade\n              </button>'
content = content.replace(span, btn)

with open("frontend/src/ui/pages/ProfilePage.jsx", "w") as f:
    f.write(content)
