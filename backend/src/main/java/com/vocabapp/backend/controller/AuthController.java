package com.vocabapp.backend.controller;

import com.vocabapp.backend.dto.AuthResponse;
import com.vocabapp.backend.dto.LoginRequest;
import com.vocabapp.backend.dto.RegisterRequest;
import com.vocabapp.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Контроллер авторизации.
 * Не содержит бизнес-логики — только маршрутизация
 * запросов к AuthService и формирование HTTP-ответов.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Регистрация нового пользователя.
     * POST /api/auth/register
     *
     * @Valid запускает проверку аннотаций валидации в RegisterRequest
     * (@NotBlank, @Email, @Size). Если данные невалидны — Spring
     * сам вернёт 400 Bad Request до того как метод выполнится.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Логин существующего пользователя.
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}