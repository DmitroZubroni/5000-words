package com.vocabapp.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Данные для регистрации нового пользователя.
 * record — неизменяемый объект-данные, Java генерирует
 * конструктор, геттеры, equals/hashCode/toString автоматически.
 */
public record RegisterRequest(

        @NotBlank(message = "Email не может быть пустым")
        @Email(message = "Некорректный формат email")
        String email,

        @NotBlank(message = "Username не может быть пустым")
        @Size(min = 3, max = 30, message = "Username от 3 до 30 символов")
        String username,

        @NotBlank(message = "Пароль не может быть пустым")
        @Size(min = 8, message = "Пароль минимум 8 символов")
        String password,

        @NotBlank(message = "Укажите язык приложения")
        String appLanguage
) {}