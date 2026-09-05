package com.vocabapp.backend.dto;

/**
 * Ачивка для отображения в профиле — со статусом получена/нет.
 */
public record AchievementDto(
    String code,
    String title,
    String description,
    int xpReward,
    boolean earned,
    String earnedAt // ISO строка или null если не получена
) {}
