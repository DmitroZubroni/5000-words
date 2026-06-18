package com.vocabapp.backend.service;

import com.vocabapp.backend.dto.UserStatsResponse;
import com.vocabapp.backend.entity.UserWordProgress;
import com.vocabapp.backend.repository.SessionRepository;
import com.vocabapp.backend.repository.UserWordProgressRepository;
import com.vocabapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Сервис статистики пользователя.
 * Агрегирует данные из sessions и user_word_progress
 * для отображения в личном кабинете.
 */
@Service
@RequiredArgsConstructor
public class StatsService {

    private final SessionRepository sessionRepository;
    private final UserWordProgressRepository progressRepository;
    private final UserRepository userRepository;

    /**
     * Собрать полную статистику пользователя.
     * Все тяжёлые запросы идут через индексы —
     * session по idx_sessions_user_date,
     * progress по idx_uwp_user_review.
     */
    public UserStatsResponse getUserStats(UUID userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Сессии за последние 90 дней
        List<var> sessions = sessionRepository.findFinishedSessionsSince(
                userId, LocalDateTime.now().minusDays(90)
        );

        // Считаем среднюю точность по всем сессиям
        double averageAccuracy = sessions.isEmpty() ? 0 :
                sessions.stream()
                        .filter(s -> s.getTotalWords() > 0)
                        .mapToDouble(s -> 100.0 * s.getCorrect() / s.getTotalWords())
                        .average()
                        .orElse(0);

        // Статистика по словам из прогресса
        List<Object[]> statusCounts = progressRepository.countByStatusForUser(userId);

        Map<String, Long> wordsByStatus = new HashMap<>();
        long mastered = 0, learning = 0, forgotten = 0;

        for (Object[] row : statusCounts) {
            UserWordProgress.WordStatus status = (UserWordProgress.WordStatus) row[0];
            Long count = (Long) row[1];
            wordsByStatus.put(status.name(), count);

            switch (status) {
                case MASTERED -> mastered = count;
                case LEARNING -> learning = count;
                case FORGOTTEN -> forgotten = count;
            }
        }

        return new UserStatsResponse(
                sessions.size(),
                (int) (mastered + learning + forgotten),
                (int) mastered,
                (int) learning,
                (int) forgotten,
                Math.round(averageAccuracy * 10.0) / 10.0,
                user.getStreakDays(),
                user.getXp(),
                user.getLevel(),
                wordsByStatus
        );
    }
}