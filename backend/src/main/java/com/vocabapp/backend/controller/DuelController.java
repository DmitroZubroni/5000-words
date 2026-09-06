package com.vocabapp.backend.controller;

import com.vocabapp.backend.dto.DuelChallengeDto;
import com.vocabapp.backend.dto.DuelFinishRequest;
import com.vocabapp.backend.dto.DuelStartRequest;
import com.vocabapp.backend.dto.DuelStatusDto;
import com.vocabapp.backend.dto.WordCardDto;
import com.vocabapp.backend.service.DuelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.vocabapp.backend.service.DuelNotificationService;

import java.util.List;
import java.util.UUID;

/**
 * Контроллер дуэлей.
 * Все endpoints требуют JWT аутентификации.
 */
@RestController
@RequestMapping("/api/duels")
@RequiredArgsConstructor
public class DuelController {

    private final DuelService duelService;
    private final DuelNotificationService duelNotificationService;

    /**
     * Real-time поток событий дуэлей через Server-Sent Events.
     * GET /api/duels/events
     */
    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToEvents(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return duelNotificationService.subscribe(userId);
    }

    /**
     * Вызвать друга на дуэль.
     * POST /api/duels/challenge
     */
    @PostMapping("/challenge")
    public ResponseEntity<DuelStatusDto> challenge(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DuelStartRequest request
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(duelService.challenge(userId, request));
    }

    /**
     * Принять вызов на дуэль.
     * POST /api/duels/{duelId}/accept
     */
    @PostMapping("/{duelId}/accept")
    public ResponseEntity<DuelStatusDto> acceptDuel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID duelId
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(duelService.acceptDuel(userId, duelId));
    }

    /**
     * Отклонить вызов на дуэль.
     * POST /api/duels/{duelId}/decline
     */
    @PostMapping("/{duelId}/decline")
    public ResponseEntity<Void> declineDuel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID duelId
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        duelService.declineDuel(userId, duelId);
        return ResponseEntity.ok().build();
    }

    /**
     * Получить слова для дуэли.
     * GET /api/duels/{duelId}/words
     */
    @GetMapping("/{duelId}/words")
    public ResponseEntity<List<WordCardDto>> getDuelWords(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID duelId
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(duelService.getDuelWords(userId, duelId));
    }

    /**
     * Завершить дуэль и сохранить результаты.
     * POST /api/duels/finish
     */
    @PostMapping("/finish")
    public ResponseEntity<DuelStatusDto> finishDuel(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DuelFinishRequest request
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(duelService.finishDuel(userId, request));
    }

    /**
     * Получить текущий статус дуэли — для polling каждые 2 сек.
     * GET /api/duels/{duelId}/status
     */
    @GetMapping("/{duelId}/status")
    public ResponseEntity<DuelStatusDto> getDuelStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID duelId
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(duelService.getDuelStatus(userId, duelId));
    }

    /**
     * Получить входящие вызовы на дуэль.
     * GET /api/duels/challenges
     */
    @GetMapping("/challenges")
    public ResponseEntity<List<DuelChallengeDto>> getPendingChallenges(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(duelService.getPendingChallenges(userId));
    }

    /**
     * Получить историю дуэлей.
     * GET /api/duels/history
     */
    @GetMapping("/history")
    public ResponseEntity<List<DuelStatusDto>> getDuelHistory(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(duelService.getDuelHistory(userId));
    }

    /**
     * Получить активные дуэли в процессе игры.
     * GET /api/duels/active
     */
    @GetMapping("/active")
    public ResponseEntity<List<DuelStatusDto>> getActiveDuels(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(duelService.getActiveDuels(userId));
    }

    /**
     * Получить исходящие вызовы, отправленные пользователем.
     * GET /api/duels/outgoing
     */
    @GetMapping("/outgoing")
    public ResponseEntity<List<DuelChallengeDto>> getOutgoingChallenges(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(duelService.getOutgoingChallenges(userId));
    }

    /**
     * Отменить исходящий вызов.
     * POST /api/duels/{duelId}/cancel
     */
    @PostMapping("/{duelId}/cancel")
    public ResponseEntity<Void> cancelDuel(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID duelId
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        duelService.cancelDuel(userId, duelId);
        return ResponseEntity.ok().build();
    }
}