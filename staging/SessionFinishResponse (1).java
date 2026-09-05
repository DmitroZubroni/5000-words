package com.vocabapp.backend.dto;

import java.util.List;
import java.util.UUID;

/**
 * Итоги завершённой сессии.
 * Показывается пользователю на экране результатов.
 */
public record SessionFinishResponse(
    UUID sessionId,
    int totalWords,
    int correct,
    int incorrect,
    double accuracyPercent,
    int xpEarned,
    Double accuracyDelta,

    int streakDays,
    boolean streakIncreased,

    List<String> newAchievements,

    /**
     * Название новой лиги, если пользователь только что в неё перешёл
     * (набрав очередные 10 000 XP). null если лига не изменилась —
     * фронтенд показывает попап о новой лиге только в этом случае.
     */
    String newLeagueName
) {}
