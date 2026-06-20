package com.vocabapp.backend.dto;

import com.vocabapp.backend.entity.UserWordProgress;

/**
 * Сложное слово с количеством ошибок.
 * Используется для отображения в папке "Сложные слова".
 */
public record DifficultWordDto(
        Integer wordId,
        String word,
        String topic,
        int errorCount,
        int intervalDays,
        String status
) {
    public static DifficultWordDto from(UserWordProgress progress) {
        return new DifficultWordDto(
                progress.getWord().getId(),
                progress.getWord().getWord(),
                progress.getWord().getTopic(),
                progress.getErrorCount(),
                progress.getIntervalDays(),
                progress.getStatus().name()
        );
    }
}