package com.vocabapp.backend.dto;

import java.util.Map;

/**
 * Статистика пользователя для личного кабинета.
 */
public record UserStatsResponse(
        int totalSessions,
        int totalWords,
        int masteredWords,
        int learningWords,
        int forgottenWords,
        double averageAccuracy,
        int currentStreak,
        int xp,
        int level,
        Map<String, Long> wordsByStatus
) {}