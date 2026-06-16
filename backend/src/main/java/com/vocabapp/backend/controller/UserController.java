package com.vocabapp.backend.controller;

import com.vocabapp.backend.dto.UserProfileResponse;
import com.vocabapp.backend.entity.User;
import com.vocabapp.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Контроллер для работы с профилем пользователя.
 * Все endpoints требуют аутентификации (JWT токен).
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Получить профиль текущего авторизованного пользователя.
     * GET /api/users/me
     *
     * @AuthenticationPrincipal — Spring автоматически подставляет
     * UserDetails из SecurityContext текущего запроса.
     * Помнишь в JwtAuthFilter мы делали User.builder().username(userId.toString())?
     * Вот этот объект сюда и приходит.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        User user = userService.getById(userId);
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }
}