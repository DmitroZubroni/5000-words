package com.vocabapp.backend.dto;

import java.util.UUID;

/**
 * Одна строка таблицы лидеров.
 */
public record LeaderboardEntry(
        int rank,
        UUID userId,
        String username,
        int xp,
        int level,
        int streakDays
) {}