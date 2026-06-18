package com.vocabapp.backend.dto;

/**
 * Карточка слова для отображения в игровой сессии.
 * Содержит только то что нужно фронтенду —
 * без внутренних id прогресса и SM-2 параметров.
 */
public record WordCardDto(
        Integer wordId,
        String word,
        String translation,
        String topic,
        /**
         * Флаг — видел ли пользователь это слово раньше.
         * Фронтенд может показывать новые слова особым образом.
         */
        boolean isNew
) {}