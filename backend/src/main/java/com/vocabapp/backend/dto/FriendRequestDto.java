package com.vocabapp.backend.dto;

import com.vocabapp.backend.entity.Friendship;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Входящий запрос дружбы.
 * Показывается в разделе "Запросы" в профиле.
 */
public record FriendRequestDto(
        UUID friendshipId,
        UUID requesterId,
        String requesterUsername,
        int requesterLevel,
        LocalDateTime sentAt
) {
    public static FriendRequestDto from(Friendship friendship) {
        return new FriendRequestDto(
                friendship.getId(),
                friendship.getRequester().getId(),
                friendship.getRequester().getUsername(),
                friendship.getRequester().getLevel(),
                friendship.getCreatedAt()
        );
    }
}