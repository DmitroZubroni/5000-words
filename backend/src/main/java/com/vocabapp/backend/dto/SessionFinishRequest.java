package com.vocabapp.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * Запрос на завершение сессии с результатами по каждому слову.
 */
public record SessionFinishRequest(

        @NotNull
        UUID sessionId,

        /**
         * Результаты по каждому слову — был ли ответ правильным.
         * Именно эти данные идут в SM-2 алгоритм.
         */
        @NotEmpty(message = "Список результатов не может быть пустым")
        List<WordResult> results,

        /** Длительность сессии в секундах. */
        int durationSeconds
) {
    /**
     * Результат по одному слову.
     * quality — оценка ответа по шкале SM-2 (0-5):
     * 5 — идеальный ответ
     * 4 — правильный с небольшим затруднением
     * 3 — правильный с трудом
     * 0-2 — неправильный (разная степень провала)
     */
    public record WordResult(
            Integer wordId,
            boolean correct,
            int quality  // 0-5 по шкале SM-2
    ) {}
}