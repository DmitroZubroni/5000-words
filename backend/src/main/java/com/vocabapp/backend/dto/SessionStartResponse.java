package com.vocabapp.backend.dto;

import com.vocabapp.backend.entity.Session;

import java.util.List;
import java.util.UUID;

/**
 * Ответ на старт сессии — id сессии и набор карточек.
 */
public record SessionStartResponse(
        UUID sessionId,
        Session.SessionMode mode,
        String langFromCode,
        String langToCode,
        List<WordCardDto> words
) {}