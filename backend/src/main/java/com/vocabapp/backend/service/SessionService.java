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

    private static final int WORDS_MATCHING = 10;
    private static final int WORDS_WRITING = 20;
    private static final int WORDS_TIME_ATTACK = 15;
    private static final int WORDS_SURVIVAL = 20;
    private static final int WORDS_BOSS_ROUND = 50;

    private final SessionRepository sessionRepository;
    private final WordRepository wordRepository;
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
     * 2. Если слов не хватает — добираем новые (которых пользователь ещё не видел)
     * 3. Для каждого слова загружаем перевод одним batch запросом (не N+1)
     */
    @Transactional
    public SessionStartResponse startSession(UUID userId, SessionStartRequest request) {
        User user = userService.getById(userId);

        Language langFrom = languageRepository.findByCode(request.langFromCode())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Язык не найден: " + request.langFromCode()));

        Language langTo = languageRepository.findByCode(request.langToCode())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Язык не найден: " + request.langToCode()));

        int sessionSize = getSessionSize(request.mode());

        // Шаг 1 — берём слова из SM-2 очереди (уже встречались, пора повторить)
        List<UserWordProgress> dueProgress = progressRepository.findDueForReview(
                userId, LocalDate.now(), PageRequest.of(0, sessionSize)
        );

        List<WordCardDto> cards = new ArrayList<>();
        Set<Integer> usedWordIds = new HashSet<>();

        // Конвертируем слова из очереди в карточки
        if (!dueProgress.isEmpty()) {
            List<Integer> wordIds = dueProgress.stream()
                    .map(p -> p.getWord().getId())
                    .collect(Collectors.toList());

            Map<Integer, Translation> translationMap = translationRepository
                    .findByWordIdsAndTargetLanguage(wordIds, langTo.getId())
                    .stream()
                    .collect(Collectors.toMap(
                            t -> t.getWord().getId(),
                            t -> t
                    ));

            for (UserWordProgress progress : dueProgress) {
                Word word = progress.getWord();
                Translation translation = translationMap.get(word.getId());

                if (translation != null) {
                    cards.add(new WordCardDto(
                            word.getId(),
                            word.getWord(),
                            translation.getTranslation(),
                            word.getTopic(),
                            false
                    ));
                    usedWordIds.add(word.getId());
                }
            }
        }

        // Шаг 2 — если слов не хватает, добираем новые
        if (cards.size() < sessionSize) {
            int needed = sessionSize - cards.size();

            // Получаем id ВСЕХ слов которые пользователь уже видел когда-либо —
            // чтобы не показывать их снова как новые пока не подошёл их интервал
            Set<Integer> seenWordIds = progressRepository
                    .findByUserId(userId)
                    .stream()
                    .map(p -> p.getWord().getId())
                    .collect(Collectors.toSet());

            seenWordIds.addAll(usedWordIds);

            List<Word> newWords = wordRepository
                    .findByLanguageAndOptionalTopic(langFrom.getId(), request.topic())
                    .stream()
                    .filter(w -> !seenWordIds.contains(w.getId()))
                    .limit(needed * 3L)
                    .collect(Collectors.toList());

            if (!newWords.isEmpty()) {
                List<Integer> newWordIds = newWords.stream()
                        .map(Word::getId)
                        .collect(Collectors.toList());

                Map<Integer, Translation> newTranslationMap = translationRepository
                        .findByWordIdsAndTargetLanguage(newWordIds, langTo.getId())
                        .stream()
                        .collect(Collectors.toMap(
                                t -> t.getWord().getId(),
                                t -> t
                        ));

                for (Word word : newWords) {
                    if (cards.size() >= sessionSize) break;

                    Translation translation = newTranslationMap.get(word.getId());
                    if (translation != null) {
                        // Проверяем что прогресс ещё не существует перед созданием.
                        // Защита от дублей на случай гонки состояний — constraint
                        // на уровне БД (uq_user_word_progress) также страхует от этого.
                        boolean progressExists = progressRepository
                                .findByUserIdAndWordId(userId, word.getId())
                                .isPresent();

                        if (!progressExists) {
                            UserWordProgress newProgress = sm2Service.createInitial(user, word);
                            progressRepository.save(newProgress);
                        }

                        cards.add(new WordCardDto(
                                word.getId(),
                                word.getWord(),
                                translation.getTranslation(),
                                word.getTopic(),
                                true
                        ));
                        usedWordIds.add(word.getId());
                    }
                }
            }
        }

        Session session = Session.builder()
                .user(user)
                .mode(request.mode())
                .langFrom(langFrom)
                .langTo(langTo)
                .totalWords(cards.size())
                .correct(0)
                .incorrect(0)
                .durationSeconds(0)
                .startedAt(LocalDateTime.now())
                .build();

        Session saved = sessionRepository.save(session);

        log.info("Сессия {} начата. Пользователь: {}, режим: {}, слов: {}",
                saved.getId(), userId, request.mode(), cards.size());

        return new SessionStartResponse(
                saved.getId(),
                saved.getMode(),
                langFrom.getCode(),
                langTo.getCode(),
                cards
        );
    }

    /**
     * Завершить сессию и обновить SM-2 прогресс по каждому слову.
     *
     * @Transactional — обновление прогресса по всем словам атомарно.
     * Если упадёт на середине — все изменения откатятся.
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

        // Предыдущая сессия для расчёта delta точности
        Session lastSession = sessionRepository.findLastFinishedSession(userId);
        Double accuracyDelta = null;

        if (lastSession != null && lastSession.getTotalWords() > 0) {
            double previousAccuracy = 100.0 * lastSession.getCorrect() / lastSession.getTotalWords();
            double currentAccuracy = correct + incorrect > 0
                    ? 100.0 * correct / (correct + incorrect)
                    : 0;
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

        user.setXp(user.getXp() + xpEarned);
        updateLevel(user);

        log.info("Сессия {} завершена. Правильных: {}/{}, XP: +{}",
                request.sessionId(), correct, totalAnswered, xpEarned);

        return new SessionFinishResponse(
                session.getId(),
                totalAnswered,
                correct,
                incorrect,
                accuracy,
                xpEarned,
                accuracyDelta
        );
    }

    private void updateLevel(User user) {
        int newLevel = (user.getXp() / 500) + 1;
        if (newLevel > user.getLevel()) {
            user.setLevel(newLevel);
            log.info("Пользователь {} достиг уровня {}!", user.getId(), newLevel);
        }
    }

    private int getSessionSize(Session.SessionMode mode) {
        return switch (mode) {
            case MATCHING -> WORDS_MATCHING;
            case WRITING -> WORDS_WRITING;
            case TIME_ATTACK -> WORDS_TIME_ATTACK;
            case SURVIVAL -> WORDS_SURVIVAL;
            case BOSS_ROUND -> WORDS_BOSS_ROUND;
        };
    }
}