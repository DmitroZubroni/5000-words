package com.vocabapp.backend.dto;

import com.vocabapp.backend.entity.Session;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Запрос на старт новой игровой сессии.
 */
public record SessionStartRequest(

        @NotBlank String langFromCode,
        @NotBlank String langToCode,
        @NotNull Session.SessionMode mode,
        String topic,
        Integer wordCount
) {}
