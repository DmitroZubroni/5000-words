import re

with open("backend/src/main/java/com/vocabapp/backend/service/SessionService.java", "r") as f:
    content = f.read()

deps = """    private final LeagueService leagueService;
    private final StreakService streakService;
    private final AchievementService achievementService;
    private final com.vocabapp.backend.config.SubscriptionLimits subscriptionLimits;"""

# Add dependencies
content = re.sub(r'(public class SessionService \{)', r'\1\n' + deps, content)

# Replace finishSession
finish_session_pattern = re.compile(r'    @Transactional\n    public SessionFinishResponse finishSession\(UUID userId, SessionFinishRequest request\) \{.*?\n    \}', re.DOTALL)

new_finish = """    @Transactional
    public SessionFinishResponse finishSession(UUID userId, SessionFinishRequest request) {
        Session session = sessionRepository.findById(request.sessionId())
                .orElseThrow(() -> new IllegalArgumentException("Сессия не найдена"));

        if (!session.getUser().getId().equals(userId)) {
            throw new AuthException("Нет доступа к этой сессии");
        }

        User user = userService.getById(userId);

        int correct = 0;
        int incorrect = 0;

        for (SessionFinishRequest.WordResult result : request.results()) {
            Optional<UserWordProgress> progressOpt = progressRepository
                    .findByUserIdAndWordId(userId, result.wordId());

            if (progressOpt.isPresent()) {
                UserWordProgress progress = progressOpt.get();
                sm2Service.update(progress, result.quality());
                progressRepository.save(progress);
            }

            if (result.correct()) correct++;
            else incorrect++;
        }

        Session lastSession = sessionRepository.findLastFinishedSession(userId);
        Double accuracyDelta = null;

        if (lastSession != null && lastSession.getTotalWords() > 0) {
            double previousAccuracy = 100.0 * lastSession.getCorrect() / lastSession.getTotalWords();
            double currentAccuracy = correct + incorrect > 0
                    ? 100.0 * correct / (correct + incorrect) : 0;
            accuracyDelta = Math.round((currentAccuracy - previousAccuracy) * 10.0) / 10.0;
        }

        int totalAnswered = correct + incorrect;
        double accuracy = totalAnswered > 0 ? 100.0 * correct / totalAnswered : 0;
        int xpEarned = correct * 10 + (accuracy >= 90 ? 50 : accuracy >= 70 ? 20 : 0);

        session.setCorrect(correct);
        session.setIncorrect(incorrect);
        session.setDurationSeconds(request.durationSeconds());
        session.setFinishedAt(LocalDateTime.now());
        sessionRepository.save(session);

        int leagueBefore = leagueService.calculateLeague(user.getXp());

        user.setXp(user.getXp() + xpEarned);
        updateLevel(user);

        int leagueAfter = leagueService.calculateLeague(user.getXp());
        String newLeagueName = leagueAfter > leagueBefore
                ? leagueService.getLeagueName(leagueAfter)
                : null;

        StreakService.StreakResult streakResult = streakService.updateStreak(user);

        int totalUserSessions = sessionRepository.findFinishedSessionsSince(
                userId, LocalDateTime.now().minusYears(10)
        ).size();

        List<String> newAchievements = achievementService.checkAfterSession(
                user, session, totalUserSessions, accuracy, streakResult.streakDays()
        );

        log.info("Сессия {} завершена. Правильных: {}/{}, XP: +{}, стрик: {}",
                request.sessionId(), correct, totalAnswered, xpEarned, streakResult.streakDays());

        return new SessionFinishResponse(
                session.getId(), totalAnswered, correct, incorrect,
                accuracy, xpEarned, accuracyDelta,
                streakResult.streakDays(), streakResult.increased(),
                newAchievements,
                newLeagueName
        );
    }"""

content = finish_session_pattern.sub(new_finish, content)

with open("backend/src/main/java/com/vocabapp/backend/service/SessionService.java", "w") as f:
    f.write(content)

