import re

with open("frontend/src/core/routing/Router.jsx", "r") as f:
    content = f.read()

# Add import
content = content.replace("import LeaderboardPage from '../../ui/pages/LeaderboardPage'", "import LeaderboardPage from '../../ui/pages/LeaderboardPage'\nimport PremiumPage from '../../ui/pages/PremiumPage'")

# Add route
route = """                {/* Сессия — без таббара */}
                <Route path="/session" element={
                    <PrivateRoute><SessionPage /></PrivateRoute>
                } />"""
new_route = route + """\n\n                {/* Premium — без таббара */}
                <Route path="/premium" element={
                    <PrivateRoute><PremiumPage /></PrivateRoute>
                } />"""
content = content.replace(route, new_route)

with open("frontend/src/core/routing/Router.jsx", "w") as f:
    f.write(content)
