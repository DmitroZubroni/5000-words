import re

with open("frontend/src/ui/pages/SessionPage.jsx", "r") as f:
    content = f.read()

# Imports
content = content.replace("import api from '../../core/api'", "import api from '../../core/api'\nimport StreakPopup from '../components/StreakPopup'\nimport LeagueScreen from '../components/LeagueScreen'")

# State
content = content.replace("const [startTime] = useState(Date.now())", "const [startTime] = useState(Date.now())\n  const [showStreakPopup, setShowStreakPopup] = useState(false)\n  const [showLeaguePopup, setShowLeaguePopup] = useState(false)")

# finishSession
old_finish = """  const finishSession = useCallback(async (finalResults) => {
    const duration = Math.round((Date.now() - startTime) / 1000)
    try {
      const { data } = await api.post('/api/sessions/finish', {
        sessionId: session.sessionId,
        results: finalResults,
        durationSeconds: duration,
      })
      setFinishData(data)
    } catch (e) {
      console.error(e)
    } finally {
      setFinished(true)
    }
  }, [session, startTime])"""

new_finish = """  const finishSession = useCallback(async (finalResults) => {
    const duration = Math.round((Date.now() - startTime) / 1000)
    try {
      const { data } = await api.post('/api/sessions/finish', {
        sessionId: session.sessionId,
        results: finalResults,
        durationSeconds: duration,
      })
      setFinishData(data)
      if (data.newLeagueName) {
        setShowLeaguePopup(true)
      } else if (data.streakIncreased) {
        setShowStreakPopup(true)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFinished(true)
    }
  }, [session, startTime])"""
content = content.replace(old_finish, new_finish)

# render block
old_render = """  if (finished) {
    return <ResultScreen data={finishData} onHome={() => navigate('/')} />
  }"""

new_render = """  if (finished) {
    if (showLeaguePopup) {
      return (
        <LeagueScreen 
          leagueName={finishData.newLeagueName}
          onDone={() => {
            setShowLeaguePopup(false)
            if (finishData.streakIncreased) {
              setShowStreakPopup(true)
            }
          }}
        />
      )
    }
    if (showStreakPopup) {
      return (
        <StreakPopup
          days={finishData.streakDays}
          onDone={() => setShowStreakPopup(false)}
        />
      )
    }
    return <ResultScreen data={finishData} onHome={() => navigate('/')} />
  }"""
content = content.replace(old_render, new_render)

with open("frontend/src/ui/pages/SessionPage.jsx", "w") as f:
    f.write(content)
