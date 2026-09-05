package com.vocabapp.backend.service;

import com.vocabapp.backend.entity.Achievement;
import com.vocabapp.backend.entity.Session;
import com.vocabapp.backend.entity.User;
import com.vocabapp.backend.entity.UserAchievement;
import com.vocabapp.backend.repository.AchievementRepository;
import com.vocabapp.backend.repository.UserAchievementRepository;
import com.vocabapp.backend.repository.UserWordProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Сервис проверки и выдачи ачивок.
 * Вызывается после завершения сессии — проверяет набор условий
 * и выдаёт новые достижения если они выполнены впервые.
 *
 * Таблицы achievements/user_achievements существовали в схеме
 * с самого начала (заполняются DataSeeder), но логика проверки
 * не была реализована — этот сервис закрывает пробел.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserWordProgressRepository progressRepository;

    /**
     * Проверить условия достижений после завершения сессии
     * и выдать те что выполнены впервые.
     *
     * @return коды новых ачивок (для показа уведомления на фронте)
     */
    @Transactional
    public List<String> checkAfterSession(
        User user, Session session, int totalUserSessions,
        double accuracy, int streakDays
    ) {
        List<String> newlyAwarded = new ArrayList<>();

        if (totalUserSessions == 1) {
            tryAward(user, "FIRST_SESSION", newlyAwarded);
        }

        if (accuracy >= 100.0 && session.getTotalWords() > 0) {
            tryAward(user, "PERFECT_SESSION", newlyAwarded);
        }

        if (streakDays >= 3) tryAward(user, "STREAK_3", newlyAwarded);
        if (streakDays >= 7) tryAward(user, "STREAK_7", newlyAwarded);
        if (streakDays >= 30) tryAward(user, "STREAK_30", newlyAwarded);

        long masteredCount = progressRepository.countByStatusForUser(user.getId())
            .stream()
            .filter(row -> "MASTERED".equals(row[0].toString()))
            .mapToLong(row -> (Long) row[1])
            .sum();

        if (masteredCount >= 100) tryAward(user, "WORDS_100", newlyAwarded);
        if (masteredCount >= 500) tryAward(user, "WORDS_500", newlyAwarded);
        if (masteredCount >= 1000) tryAward(user, "WORDS_1000", newlyAwarded);

        return newlyAwarded;
    }

    /**
     * Выдать конкретную ачивку по коду если она ещё не выдана.
     * Идемпотентно — повторный вызов с тем же кодом ничего не делает.
     */
    private void tryAward(User user, String code, List<String> newlyAwarded) {
        Achievement achievement = achievementRepository.findByCode(code).orElse(null);
        if (achievement == null) {
            log.warn("Ачивка с кодом {} не найдена в справочнике", code);
            return;
        }

        boolean alreadyHas = userAchievementRepository
            .existsByUserIdAndAchievementId(user.getId(), achievement.getId());
        if (alreadyHas) return;

        UserAchievement ua = UserAchievement.builder()
            .user(user)
            .achievement(achievement)
            .earnedAt(LocalDateTime.now())
            .build();

        userAchievementRepository.save(ua);
        newlyAwarded.add(code);
        log.info("Ачивка {} выдана пользователю {}", code, user.getId());
    }
}
