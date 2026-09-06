import re

with open("frontend/src/ui/pages/LeaderboardPage.jsx", "r") as f:
    content = f.read()
content = content.replace("r.data.leaderboard", "r.data.leagueLeaderboard")
with open("frontend/src/ui/pages/LeaderboardPage.jsx", "w") as f:
    f.write(content)

with open("frontend/src/ui/components/LeagueScreen.jsx", "r") as f:
    content = f.read()
content = content.replace("league.leaderboard", "league.leagueLeaderboard")
with open("frontend/src/ui/components/LeagueScreen.jsx", "w") as f:
    f.write(content)
