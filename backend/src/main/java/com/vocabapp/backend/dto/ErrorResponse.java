package com.vocabapp.backend.dto;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Стандартный формат ответа при ошибках.
 * Возвращается глобальным обработчиком для всех исключений.
 * Никогда не содержит стектрейс или внутренние детали реализации.
 */
public record ErrorResponse(
        int status,
        String message,
        Map<String, String> errors,
        LocalDateTime timestamp
) {
    /**
     * Создать ответ с одним сообщением без детализации полей.
     * Используется для AuthException и других бизнес-ошибок.
     */
    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(status, message, null, LocalDateTime.now());
    }

    /**
     * Создать ответ с детализацией по полям.
     * Используется для ошибок валидации — показывает
     * какое именно поле не прошло проверку.
     */
    public static ErrorResponse of(int status, String message, Map<String, String> errors) {
        return new ErrorResponse(status, message, errors, LocalDateTime.now());
    }
}