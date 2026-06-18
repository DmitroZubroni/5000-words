package com.vocabapp.backend.dto;

import com.vocabapp.backend.entity.Session;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Запрос на старт новой игровой сессии.
 */
public record SessionStartRequest(

        @NotBlank(message = "Укажите исходный язык")
        String langFromCode,

        @NotBlank(message = "Укажите целевой язык")
        String langToCode,

        @NotNull(message = "Укажите режим сессии")
        Session.SessionMode mode,

        /**
         * Опциональная тема — если null, берём слова из всех тем.
         */
        String topic
) {}