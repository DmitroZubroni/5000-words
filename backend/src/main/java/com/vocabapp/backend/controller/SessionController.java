package com.vocabapp.backend.controller;

import com.vocabapp.backend.dto.SessionFinishRequest;
import com.vocabapp.backend.dto.SessionFinishResponse;
import com.vocabapp.backend.dto.SessionStartRequest;
import com.vocabapp.backend.dto.SessionStartResponse;
import com.vocabapp.backend.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Контроллер игровых сессий.
 * Все endpoints требуют JWT аутентификации.
 */
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    /**
     * Начать новую сессию.
     * POST /api/sessions/start
     *
     * Возвращает id сессии и набор карточек слов.
     */
    @PostMapping("/start")
    public ResponseEntity<SessionStartResponse> startSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SessionStartRequest request
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(sessionService.startSession(userId, request));
    }

    /**
     * Завершить сессию и сохранить результаты.
     * POST /api/sessions/finish
     *
     * Обновляет SM-2 прогресс по каждому слову,
     * начисляет XP, возвращает итоги сессии.
     */
    @PostMapping("/finish")
    public ResponseEntity<SessionFinishResponse> finishSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SessionFinishRequest request
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(sessionService.finishSession(userId, request));
    }
}