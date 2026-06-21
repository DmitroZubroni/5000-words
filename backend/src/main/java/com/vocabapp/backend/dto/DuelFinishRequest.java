package com.vocabapp.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Результаты игрока по завершении дуэли.
 */
public record DuelFinishRequest(
        @NotNull
        UUID duelId,

        int correct,
        int totalWords,
        int durationSeconds
) {}