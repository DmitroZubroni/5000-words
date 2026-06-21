package com.vocabapp.backend.dto;

import com.vocabapp.backend.entity.Duel;

import java.util.UUID;

/**
 * Текущее состояние дуэли.
 * Возвращается при polling каждые 2 секунды.
 * Фронтенд обновляет счёт соперника на основе этих данных.
 */
public record DuelStatusDto(
        UUID duelId,
        String status,
        String creatorUsername,
        Double creatorAccuracy,
        String opponentUsername,
        Double opponentAccuracy,
        UUID winnerId,
        String winnerUsername
) {
    public static DuelStatusDto from(Duel duel) {
        return new DuelStatusDto(
                duel.getId(),
                duel.getStatus().name(),
                duel.getCreator().getUsername(),
                duel.getCreatorAccuracy(),
                duel.getOpponent().getUsername(),
                duel.getOpponentAccuracy(),
                duel.getWinner() != null ? duel.getWinner().getId() : null,
                duel.getWinner() != null ? duel.getWinner().getUsername() : null
        );
    }
}