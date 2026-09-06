package com.vocabapp.backend.dto;

import com.vocabapp.backend.entity.Duel;

import java.util.UUID;

/**
 * Текущее состояние дуэли.
 */
public record DuelStatusDto(
        UUID duelId,
        String status,
        UUID creatorId,
        String creatorUsername,
        Double creatorAccuracy,
        UUID opponentId,
        String opponentUsername,
        Double opponentAccuracy,
        UUID winnerId,
        String winnerUsername,
        String langFromCode,
        String langToCode
) {
    public static DuelStatusDto from(Duel duel) {
        return new DuelStatusDto(
                duel.getId(),
                duel.getStatus().name(),
                duel.getCreator() != null ? duel.getCreator().getId() : null,
                duel.getCreator() != null ? duel.getCreator().getUsername() : null,
                duel.getCreatorAccuracy(),
                duel.getOpponent() != null ? duel.getOpponent().getId() : null,
                duel.getOpponent() != null ? duel.getOpponent().getUsername() : null,
                duel.getOpponentAccuracy(),
                duel.getWinner() != null ? duel.getWinner().getId() : null,
                duel.getWinner() != null ? duel.getWinner().getUsername() : null,
                duel.getLangFrom() != null ? duel.getLangFrom().getCode() : null,
                duel.getLangTo() != null ? duel.getLangTo().getCode() : null
        );
    }
}