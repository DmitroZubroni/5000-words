import re

with open("frontend/src/App.jsx", "r") as f:
    content = f.read()

# Add import
if "PremiumPage" not in content:
    content = content.replace("import LeaderboardPage", "import PremiumPage from './ui/pages/PremiumPage'\nimport LeaderboardPage")
    
    # Add route
    route = '<Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />'
    new_route = route + '\n          <Route path="/premium" element={<PrivateRoute><PremiumPage /></PrivateRoute>} />'
    content = content.replace(route, new_route)

    with open("frontend/src/App.jsx", "w") as f:
        f.write(content)
