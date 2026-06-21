package com.vocabapp.backend.service;

import com.vocabapp.backend.dto.DuelChallengeDto;
import com.vocabapp.backend.dto.DuelFinishRequest;
import com.vocabapp.backend.dto.DuelStartRequest;
import com.vocabapp.backend.dto.DuelStatusDto;
import com.vocabapp.backend.entity.Duel;
import com.vocabapp.backend.entity.Friendship;
import com.vocabapp.backend.entity.Language;
import com.vocabapp.backend.entity.Translation;
import com.vocabapp.backend.entity.User;
import com.vocabapp.backend.entity.Word;
import com.vocabapp.backend.exception.AuthException;
import com.vocabapp.backend.repository.DuelRepository;
import com.vocabapp.backend.repository.FriendshipRepository;
import com.vocabapp.backend.repository.LanguageRepository;
import com.vocabapp.backend.repository.TranslationRepository;
import com.vocabapp.backend.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Сервис дуэлей между пользователями.
 * Polling подход — клиент запрашивает статус каждые 2 секунды.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DuelService {

    /** Количество слов в дуэли — фиксированное для честности. */
    private static final int DUEL_WORD_COUNT = 10;

    private final DuelRepository duelRepository;
    private final FriendshipRepository friendshipRepository;
    private final WordRepository wordRepository;
    private final TranslationRepository translationRepository;
    private final LanguageRepository languageRepository;
    private final UserService userService;

    /**
     * Вызвать друга на дуэль.
     * Проверяем что оба пользователя действительно друзья —
     * нельзя вызвать случайного пользователя.
     */
    @Transactional
    public DuelStatusDto challenge(UUID challengerId, DuelStartRequest request) {
        User challenger = userService.getById(challengerId);
        User opponent = userService.getById(request.friendId());

        // Проверяем дружбу
        Friendship friendship = friendshipRepository
                .findBetweenUsers(challengerId, request.friendId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Можно вызывать только друзей"));

        if (friendship.getStatus() != Friendship.FriendshipStatus.ACCEPTED) {
            throw new IllegalArgumentException("Можно вызывать только друзей");
        }

        Language langFrom = languageRepository.findByCode(request.langFromCode())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Язык не найден: " + request.langFromCode()));

        Language langTo = languageRepository.findByCode(request.langToCode())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Язык не найден: " + request.langToCode()));

        // Подбираем слова — одинаковые для обоих игроков
        List<Word> words = wordRepository
                .findByLanguageAndOptionalTopic(langFrom.getId(), null);

        // Перемешиваем и берём нужное количество
        Collections.shuffle(words);
        List<Integer> wordIds = words.stream()
                .limit(DUEL_WORD_COUNT)
                .map(Word::getId)
                .collect(Collectors.toList());

        // Сохраняем id слов как строку
        String wordIdsStr = wordIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));

        Duel duel = Duel.builder()
                .creator(challenger)
                .opponent(opponent)
                .langFrom(langFrom)
                .langTo(langTo)
                .status(Duel.DuelStatus.PENDING)
                .wordIds(wordIdsStr)
                .build();

        Duel saved = duelRepository.save(duel);
        log.info("Дуэль {} создана: {} вызывает {}", saved.getId(), challengerId, request.friendId());

        return DuelStatusDto.from(saved);
    }

    /**
     * Принять вызов на дуэль.
     * Статус меняется на IN_PROGRESS — оба игрока могут начинать.
     */
    @Transactional
    public DuelStatusDto acceptDuel(UUID userId, UUID duelId) {
        Duel duel = getDuelAndValidateOpponent(userId, duelId);

        if (duel.getStatus() != Duel.DuelStatus.PENDING) {
            throw new IllegalArgumentException("Дуэль уже не ожидает принятия");
        }

        duel.setStatus(Duel.DuelStatus.IN_PROGRESS);
        duelRepository.save(duel);
        log.info("Дуэль {} принята пользователем {}", duelId, userId);

        return DuelStatusDto.from(duel);
    }

    /**
     * Отклонить вызов на дуэль.
     */
    @Transactional
    public void declineDuel(UUID userId, UUID duelId) {
        Duel duel = getDuelAndValidateOpponent(userId, duelId);

        if (duel.getStatus() != Duel.DuelStatus.PENDING) {
            throw new IllegalArgumentException("Дуэль уже не ожидает принятия");
        }

        duel.setStatus(Duel.DuelStatus.DECLINED);
        duelRepository.save(duel);
        log.info("Дуэль {} отклонена пользователем {}", duelId, userId);
    }

    /**
     * Получить слова для дуэли.
     * Оба игрока вызывают этот метод и получают одинаковый набор.
     */
    @Transactional(readOnly = true)
    public List<com.vocabapp.backend.dto.WordCardDto> getDuelWords(UUID userId, UUID duelId) {
        Duel duel = duelRepository.findById(duelId)
                .orElseThrow(() -> new IllegalArgumentException("Дуэль не найдена"));

        validateParticipant(userId, duel);

        if (duel.getStatus() != Duel.DuelStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Дуэль ещё не началась или уже завершена");
        }

        // Парсим id слов из строки
        List<Integer> wordIds = Arrays.stream(duel.getWordIds().split(","))
                .map(Integer::parseInt)
                .collect(Collectors.toList());

        // Batch запрос переводов
        Map<Integer, Translation> translationMap = translationRepository
                .findByWordIdsAndTargetLanguage(wordIds, duel.getLangTo().getId())
                .stream()
                .collect(Collectors.toMap(
                        t -> t.getWord().getId(),
                        t -> t
                ));

        // Собираем карточки в том же порядке что и wordIds
        return wordIds.stream()
                .filter(translationMap::containsKey)
                .map(wordId -> {
                    Translation t = translationMap.get(wordId);
                    return new com.vocabapp.backend.dto.WordCardDto(
                            wordId,
                            t.getWord().getWord(),
                            t.getTranslation(),
                            t.getWord().getTopic(),
                            false
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * Сохранить результаты игрока и определить победителя
     * если оба уже завершили.
     */
    @Transactional
    public DuelStatusDto finishDuel(UUID userId, DuelFinishRequest request) {
        Duel duel = duelRepository.findById(request.duelId())
                .orElseThrow(() -> new IllegalArgumentException("Дуэль не найдена"));

        validateParticipant(userId, duel);

        if (duel.getStatus() != Duel.DuelStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Дуэль не в процессе");
        }

        double accuracy = request.totalWords() > 0
                ? Math.round(100.0 * request.correct() / request.totalWords() * 10.0) / 10.0
                : 0;

        boolean isCreator = duel.getCreator().getId().equals(userId);

        if (isCreator) {
            duel.setCreatorAccuracy(accuracy);
        } else {
            duel.setOpponentAccuracy(accuracy);
        }

        // Если оба завершили — определяем победителя
        if (duel.getCreatorAccuracy() != null && duel.getOpponentAccuracy() != null) {
            duel.setStatus(Duel.DuelStatus.FINISHED);
            duel.setFinishedAt(LocalDateTime.now());

            if (duel.getCreatorAccuracy() > duel.getOpponentAccuracy()) {
                duel.setWinner(duel.getCreator());
            } else if (duel.getOpponentAccuracy() > duel.getCreatorAccuracy()) {
                duel.setWinner(duel.getOpponent());
            }
            // Если равно — ничья, winner остаётся null

            log.info("Дуэль {} завершена. Создатель: {}%, Соперник: {}%",
                    duel.getId(), duel.getCreatorAccuracy(), duel.getOpponentAccuracy());
        }

        duelRepository.save(duel);
        return DuelStatusDto.from(duel);
    }

    /**
     * Получить текущий статус дуэли — используется для polling.
     * Клиент вызывает каждые 2 секунды чтобы видеть счёт соперника.
     */
    @Transactional(readOnly = true)
    public DuelStatusDto getDuelStatus(UUID userId, UUID duelId) {
        Duel duel = duelRepository.findById(duelId)
                .orElseThrow(() -> new IllegalArgumentException("Дуэль не найдена"));

        validateParticipant(userId, duel);
        return DuelStatusDto.from(duel);
    }

    /**
     * Получить входящие вызовы на дуэль.
     */
    public List<DuelChallengeDto> getPendingChallenges(UUID userId) {
        return duelRepository.findPendingChallenges(userId)
                .stream()
                .map(DuelChallengeDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Получить историю дуэлей пользователя.
     */
    public List<DuelStatusDto> getDuelHistory(UUID userId) {
        return duelRepository.findFinishedDuels(userId)
                .stream()
                .map(DuelStatusDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Найти дуэль и проверить что пользователь является соперником.
     */
    private Duel getDuelAndValidateOpponent(UUID userId, UUID duelId) {
        Duel duel = duelRepository.findById(duelId)
                .orElseThrow(() -> new IllegalArgumentException("Дуэль не найдена"));

        if (!duel.getOpponent().getId().equals(userId)) {
            throw new AuthException("Нет доступа к этой дуэли");
        }

        return duel;
    }

    /**
     * Проверить что пользователь является участником дуэли.
     */
    private void validateParticipant(UUID userId, Duel duel) {
        boolean isParticipant = duel.getCreator().getId().equals(userId)
                || duel.getOpponent().getId().equals(userId);

        if (!isParticipant) {
            throw new AuthException("Вы не являетесь участником этой дуэли");
        }
    }
}