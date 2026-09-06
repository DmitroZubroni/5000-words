package com.vocabapp.backend.service;

import com.vocabapp.backend.dto.*;
import com.vocabapp.backend.entity.*;
import com.vocabapp.backend.exception.AuthException;
import com.vocabapp.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Сервис игровых сессий.
 * Отвечает за формирование набора слов для сессии,
 * обработку результатов и обновление SM-2 прогресса.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {
    private final LeagueService leagueService;
    private final StreakService streakService;
    private final AchievementService achievementService;
    private final com.vocabapp.backend.config.SubscriptionLimits subscriptionLimits;

    private final SessionRepository sessionRepository;
    private final TranslationRepository translationRepository;
    private final UserWordProgressRepository progressRepository;
    private final LanguageRepository languageRepository;
    private final UserService userService;
    private final Sm2Service sm2Service;

    /**
     * Начать новую игровую сессию.
     *
     * Логика подбора слов:
     * 1. Берём слова у которых next_review <= сегодня (SM-2 очередь)
     * 2. Если слов не хватает — добираем новые из тех что имеют
     *    перевод на целевой язык
     *
     * Лимит для бесплатного плана: максимум 50 НОВЫХ слов в день.
     * Режим MATCHING не учитывается в лимите — это повторение уже
     * известных слов через игру, а не изучение новых.
     */
    @Transactional
    public SessionStartResponse startSession(UUID userId, SessionStartRequest request) {
        User user = userService.getById(userId);

        // Проверка дневного лимита новых слов для бесплатного плана
        if (user.getSubscriptionTier() == User.SubscriptionTier.FREE
                && request.mode() != Session.SessionMode.MATCHING) {

            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            long newWordsToday = progressRepository.countNewWordsToday(userId, startOfDay);

            if (newWordsToday >= 50) {
                throw new IllegalArgumentException(
                        "Дневной лимит 50 новых слов исчерпан. Оформите Premium для безлимита."
                );
            }
        }

        // Проверка лимита тематических сессий для бесплатного плана (макс 1 в день)
        if (user.getSubscriptionTier() == User.SubscriptionTier.FREE
                && request.topic() != null
                && !request.topic().isBlank()) {
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            long themedToday = sessionRepository.countThemedSessionsToday(userId, startOfDay);
            if (themedToday >= 1) {
                throw new IllegalArgumentException(
                        "Тематические сессии на бесплатном плане доступны 1 раз в день. Оформите Premium для безлимита."
                );
            }
        }

        Language langFrom = languageRepository.findByCode(request.langFromCode())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Язык не найден: " + request.langFromCode()));

        Language langTo = languageRepository.findByCode(request.langToCode())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Язык не найден: " + request.langToCode()));

        int sessionSize = request.wordCount() != null && request.wordCount() > 0
                ? request.wordCount()
                : 10;

        List<WordCardDto> cards = new ArrayList<>();
        Set<Integer> usedWordIds = new HashSet<>();

        // Шаг 1 — берём слова из SM-2 очереди (уже встречались, пора повторить)
        List<UserWordProgress> dueProgress = progressRepository.findDueForReview(
                userId, LocalDate.now(), request.topic(), PageRequest.of(0, sessionSize)
        );

        if (!dueProgress.isEmpty()) {
            List<Integer> wordIds = dueProgress.stream()
                    .map(p -> p.getWord().getId())
                    .collect(Collectors.toList());

            Map<Integer, Translation> translationMap = translationRepository
                    .findByWordIdsAndTargetLanguage(wordIds, langTo.getId())
                    .stream()
                    .collect(Collectors.toMap(t -> t.getWord().getId(), t -> t));

            for (UserWordProgress progress : dueProgress) {
                Word word = progress.getWord();
                Translation translation = translationMap.get(word.getId());
                if (translation != null) {
                    cards.add(new WordCardDto(
                            word.getId(), word.getWord(),
                            translation.getTranslation(), word.getTopic(), false
                    ));
                    usedWordIds.add(word.getId());
                }
            }
        }

        // Шаг 2 — добираем новые слова из тех у которых есть перевод
        if (cards.size() < sessionSize) {
            int needed = sessionSize - cards.size();

            Set<Integer> seenWordIds = progressRepository.findByUserId(userId)
                    .stream()
                    .map(p -> p.getWord().getId())
                    .collect(Collectors.toSet());
            seenWordIds.addAll(usedWordIds);

            List<Integer> excluded = seenWordIds.isEmpty()
                    ? List.of(0)
                    : new ArrayList<>(seenWordIds);

            List<Translation> available = translationRepository.findAvailableTranslations(
                    langFrom.getId(), langTo.getId(), request.topic(), excluded
            );

            for (Translation t : available) {
                if (cards.size() >= sessionSize) break;

                Word word = t.getWord();
                if (usedWordIds.contains(word.getId())) continue;

                boolean progressExists = progressRepository
                        .findByUserIdAndWordId(userId, word.getId())
                        .isPresent();

                if (!progressExists) {
                    UserWordProgress newProgress = sm2Service.createInitial(user, word);
                    progressRepository.save(newProgress);
                }

                cards.add(new WordCardDto(
                        word.getId(), word.getWord(),
                        t.getTranslation(), word.getTopic(), true
                ));
                usedWordIds.add(word.getId());
            }
        }

        Session session = Session.builder()
                .user(user)
                .mode(request.mode())
                .langFrom(langFrom)
                .langTo(langTo)
                .topic(request.topic())
                .totalWords(cards.size())
                .correct(0)
                .incorrect(0)
                .durationSeconds(0)
                .startedAt(LocalDateTime.now())
                .build();

        Session saved = sessionRepository.save(session);

        log.info("Сессия {} начата. Пользователь: {}, режим: {}, запрошено: {}, получено: {}",
                saved.getId(), userId, request.mode(), sessionSize, cards.size());

        return new SessionStartResponse(
                saved.getId(), saved.getMode(),
                langFrom.getCode(), langTo.getCode(), cards
        );
    }
    /**
     * Завершить сессию и обновить SM-2 прогресс по каждому слову.
     */
    @Transactional
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
                streakResult.streakDays(), streakResult.increased(), streakResult.freezeUsed(),
                newAchievements,
                newLeagueName
        );
    }

    private void updateLevel(User user) {
        int newLevel = (user.getXp() / 500) + 1;
        if (newLevel > user.getLevel()) {
            user.setLevel(newLevel);
            log.info("Пользователь {} достиг уровня {}!", user.getId(), newLevel);
        }
    }


    /**
     *  === Новый метод для добавления в SessionService.java ===
     *             (добавить после метода startSession, перед finishSession)
     * Начать тренировочную сессию по самым сложным словам пользователя —
     * тем, где накопилось больше всего ошибок. В отличие от обычного
     * startSession, здесь НЕ используется SM-2 очередь (next_review),
     * набор слов формируется напрямую из findMostDifficultWords.
     *
     * Работает всегда в режиме WRITING — наиболее строгая проверка
     * знания слова, подходящая для целенаправленной тренировки.
     */
    @Transactional
    public SessionStartResponse startDifficultWordsSession(UUID userId, String langToCode) {
        User user = userService.getById(userId);

        Language langTo = languageRepository.findByCode(langToCode)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Язык не найден: " + langToCode));

        // Берём до 20 самых сложных слов — этого достаточно для
        // одной сфокусированной тренировочной сессии
        List<UserWordProgress> difficult = progressRepository
                .findMostDifficultWords(userId, PageRequest.of(0, 20));

        if (difficult.isEmpty()) {
            throw new IllegalArgumentException(
                    "У вас пока нет сложных слов для тренировки");
        }

        List<Integer> wordIds = difficult.stream()
                .map(p -> p.getWord().getId())
                .collect(Collectors.toList());

        Map<Integer, Translation> translationMap = translationRepository
                .findByWordIdsAndTargetLanguage(wordIds, langTo.getId())
                .stream()
                .collect(Collectors.toMap(t -> t.getWord().getId(), t -> t));

        List<WordCardDto> cards = new ArrayList<>();
        Language langFrom = null;

        for (UserWordProgress progress : difficult) {
            Word word = progress.getWord();
            Translation translation = translationMap.get(word.getId());
            if (translation != null) {
                if (langFrom == null) langFrom = word.getLanguage();
                cards.add(new WordCardDto(
                        word.getId(), word.getWord(),
                        translation.getTranslation(), word.getTopic(), false
                ));
            }
        }

        if (cards.isEmpty()) {
            throw new IllegalArgumentException(
                    "Нет переводов для сложных слов на выбранный язык");
        }

        Session session = Session.builder()
                .user(user)
                .mode(Session.SessionMode.WRITING)
                .langFrom(langFrom)
                .langTo(langTo)
                .topic(null)
                .totalWords(cards.size())
                .correct(0)
                .incorrect(0)
                .durationSeconds(0)
                .startedAt(LocalDateTime.now())
                .build();

        Session saved = sessionRepository.save(session);

        log.info("Тренировка сложных слов {} начата. Пользователь: {}, слов: {}",
                saved.getId(), userId, cards.size());

        return new SessionStartResponse(
                saved.getId(), saved.getMode(),
                langFrom.getCode(), langTo.getCode(), cards
        );
    }
}