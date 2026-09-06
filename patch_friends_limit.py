import re

with open("frontend/src/ui/pages/FriendsPage.jsx", "r") as f:
    content = f.read()

# Make sure navigate is imported and used
if "const navigate = useNavigate()" not in content:
    content = content.replace("const toast = useToast()", "const toast = useToast()\n  const navigate = useNavigate()")
    content = content.replace("import { useState, useEffect } from 'react'", "import { useState, useEffect } from 'react'\nimport { useNavigate } from 'react-router-dom'")

old_catch = """    } catch (e) {
      toast.error(e.response?.data?.message || 'Не удалось отправить запрос')
    }"""
new_catch = """    } catch (e) {
      const msg = e.response?.data?.message
      if (msg && msg.includes('Бесплатный план ограничен')) {
        navigate('/premium')
      } else {
        toast.error(msg || 'Не удалось отправить запрос')
      }
    }"""
content = content.replace(old_catch, new_catch)

with open("frontend/src/ui/pages/FriendsPage.jsx", "w") as f:
    f.write(content)
