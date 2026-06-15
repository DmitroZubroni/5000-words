package com.vocabapp.backend.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Данные для входа в систему.
 */
public record LoginRequest(

        @NotBlank(message = "Email не может быть пустым")
        String email,

        @NotBlank(message = "Пароль не может быть пустым")
        String password
) {}