package com.vocabapp.backend.dto;

import com.vocabapp.backend.entity.Friendship;
import com.vocabapp.backend.entity.User;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Друг в списке друзей.
 * Содержит базовую информацию о друге и дате установления дружбы.
 */
public record FriendDto(
        UUID friendshipId,
        UUID friendId,
        String username,
        int level,
        int xp,
        int streakDays,
        LocalDateTime friendsSince
) {
    /**
     * Создать из Friendship — определяем кто из двух участников
     * является "другом" (не текущим пользователем).
     */
    public static FriendDto from(Friendship friendship, UUID currentUserId) {
        User friend = friendship.getRequester().getId().equals(currentUserId)
                ? friendship.getAddressee()
                : friendship.getRequester();

        return new FriendDto(
                friendship.getId(),
                friend.getId(),
                friend.getUsername(),
                friend.getLevel(),
                friend.getXp(),
                friend.getStreakDays(),
                friendship.getCreatedAt()
        );
    }
}