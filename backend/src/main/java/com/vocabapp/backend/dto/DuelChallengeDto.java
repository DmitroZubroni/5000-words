package com.vocabapp.backend.dto;

import com.vocabapp.backend.entity.Duel;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Входящий вызов на дуэль.
 * Показывается как уведомление при открытии приложения.
 */
public record DuelChallengeDto(
        UUID duelId,
        UUID challengerId,
        String challengerUsername,
        int challengerLevel,
        String langFromCode,
        String langToCode,
        LocalDateTime sentAt
) {
    public static DuelChallengeDto from(Duel duel) {
        return new DuelChallengeDto(
                duel.getId(),
                duel.getCreator().getId(),
                duel.getCreator().getUsername(),
                duel.getCreator().getLevel(),
                duel.getLangFrom().getCode(),
                duel.getLangTo().getCode(),
                duel.getCreatedAt()
        );
    }
}