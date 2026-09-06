package com.vocabapp.backend.dto;

import com.vocabapp.backend.entity.Duel;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Вызов на дуэль (входящий или исходящий).
 */
public record DuelChallengeDto(
        UUID duelId,
        UUID challengerId,
        String challengerUsername,
        int challengerLevel,
        UUID opponentId,
        String opponentUsername,
        String langFromCode,
        String langToCode,
        Integer wordCount,
        Boolean sameWords,
        LocalDateTime sentAt
) {
    public static DuelChallengeDto from(Duel duel) {
        return new DuelChallengeDto(
                duel.getId(),
                duel.getCreator().getId(),
                duel.getCreator().getUsername(),
                duel.getCreator().getLevel(),
                duel.getOpponent() != null ? duel.getOpponent().getId() : null,
                duel.getOpponent() != null ? duel.getOpponent().getUsername() : null,
                duel.getLangFrom() != null ? duel.getLangFrom().getCode() : null,
                duel.getLangTo() != null ? duel.getLangTo().getCode() : null,
                duel.getWordCount(),
                duel.getSameWords(),
                duel.getCreatedAt()
        );
    }
}