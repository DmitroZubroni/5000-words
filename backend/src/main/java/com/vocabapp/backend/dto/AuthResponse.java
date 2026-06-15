package com.vocabapp.backend.dto;

import java.util.UUID;

/**
 * Ответ после успешной регистрации или логина.
 * Содержит JWT токен и базовую информацию о пользователе
 * для немедленного отображения в UI без дополнительного запроса.
 */
public record AuthResponse(
        String token,
        UUID userId,
        String username,
        String appLanguage
) {}