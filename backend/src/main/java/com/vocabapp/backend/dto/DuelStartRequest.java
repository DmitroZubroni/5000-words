package com.vocabapp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Запрос на вызов друга на дуэль.
 */
public record DuelStartRequest(
        @NotNull(message = "Укажите id друга")
        UUID friendId,

        @NotBlank(message = "Укажите исходный язык")
        String langFromCode,

        @NotBlank(message = "Укажите целевой язык")
        String langToCode,

        @NotNull(message = "Укажите количество слов")
        Integer wordCount,

        @NotNull(message = "Укажите режим слов")
        Boolean sameWords
) {}