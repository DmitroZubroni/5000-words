package com.vocabapp.backend.controller;

import com.vocabapp.backend.dto.FriendDto;
import com.vocabapp.backend.dto.FriendRequestDto;
import com.vocabapp.backend.repository.UserRepository;
import com.vocabapp.backend.service.FriendService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Контроллер управления друзьями.
 * Все endpoints требуют JWT аутентификации.
 */
@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    /**
     * Получить список друзей.
     * GET /api/friends
     */
    @GetMapping
    public ResponseEntity<List<FriendDto>> getFriends(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(friendService.getFriends(userId));
    }

    /**
     * Получить входящие запросы дружбы.
     * GET /api/friends/requests
     */
    @GetMapping("/requests")
    public ResponseEntity<List<FriendRequestDto>> getPendingRequests(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(friendService.getPendingRequests(userId));
    }

    /**
     * Отправить запрос дружбы пользователю.
     * POST /api/friends/request/{userId}
     */
    @PostMapping("/request/{addresseeId}")
    public ResponseEntity<Void> sendRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID addresseeId
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        friendService.sendFriendRequest(userId, addresseeId);
        return ResponseEntity.ok().build();
    }

    /**
     * Принять запрос дружбы.
     * POST /api/friends/accept/{requesterId}
     */
    @PostMapping("/accept/{requesterId}")
    public ResponseEntity<Void> acceptRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID requesterId
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        friendService.acceptFriendRequest(userId, requesterId);
        return ResponseEntity.ok().build();
    }

    /**
     * Отклонить запрос дружбы.
     * POST /api/friends/decline/{requesterId}
     */
    @PostMapping("/decline/{requesterId}")
    public ResponseEntity<Void> declineRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID requesterId
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        friendService.declineFriendRequest(userId, requesterId);
        return ResponseEntity.ok().build();
    }

    /**
     * Удалить друга.
     * DELETE /api/friends/{friendId}
     */
    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> removeFriend(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID friendId
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        friendService.removeFriend(userId, friendId);
        return ResponseEntity.ok().build();
    }

    /**
     * Поиск пользователей по username.
     * GET /api/friends/search?q=username
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserRepository.UserSearchResult>> searchUsers(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String q
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(friendService.searchUsers(userId, q));
    }
}