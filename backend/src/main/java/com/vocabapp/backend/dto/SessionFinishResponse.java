package com.vocabapp.backend.dto;

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
        /**
         * Изменение точности относительно предыдущей сессии.
         * Положительное — стало лучше, отрицательное — хуже.
         * null если это первая сессия.
         */
        Double accuracyDelta
) {}