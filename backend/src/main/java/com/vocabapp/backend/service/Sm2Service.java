package com.vocabapp.backend.service;

import com.vocabapp.backend.entity.UserWordProgress;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Реализация алгоритма интервальных повторений SM-2.
 *
 * Алгоритм определяет когда показывать слово снова на основе
 * того насколько хорошо пользователь его помнит.
 * Чем лучше помнит — тем реже показываем, тем больше слов охватываем.
 *
 * Оригинальная спецификация: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-SuperMemo-method
 */
@Service
public class Sm2Service {

    /**
     * Минимальный easiness factor — 1.3 (храним как 130).
     * Ниже опускаться нельзя — иначе интервалы схлопнутся до нуля.
     */
    private static final int MIN_EASINESS_FACTOR = 130;

    /**
     * Начальный easiness factor — 2.5 (храним как 250).
     */
    private static final int DEFAULT_EASINESS_FACTOR = 250;

    /**
     * Обновить прогресс по слову на основе качества ответа.
     *
     * Логика SM-2:
     * - quality >= 3 (правильный ответ) → увеличиваем интервал
     * - quality < 3 (неправильный ответ) → сбрасываем прогресс, показываем завтра
     *
     * @param progress текущий прогресс пользователя по слову
     * @param quality  оценка ответа по шкале 0-5
     */
    public void update(UserWordProgress progress, int quality) {
        if (quality < 0 || quality > 5) {
            throw new IllegalArgumentException("Quality должен быть от 0 до 5");
        }

        if (quality >= 3) {
            handleCorrectAnswer(progress, quality);
        } else {
            handleWrongAnswer(progress);
        }

        // Обновляем статус на основе нового интервала
        updateStatus(progress);
    }

    /**
     * Создать начальный прогресс для нового слова.
     * Вызывается когда пользователь впервые встречает слово.
     */
    public UserWordProgress createInitial(
            com.vocabapp.backend.entity.User user,
            com.vocabapp.backend.entity.Word word
    ) {
        return UserWordProgress.builder()
                .user(user)
                .word(word)
                .easinessFactor(DEFAULT_EASINESS_FACTOR)
                .intervalDays(1)
                .repetitions(0)
                .errorCount(0)
                .nextReview(LocalDate.now())
                .status(UserWordProgress.WordStatus.LEARNING)
                .build();
    }

    /**
     * Обработка правильного ответа.
     *
     * Формула SM-2 для нового интервала:
     * - repetitions == 0 → interval = 1 день
     * - repetitions == 1 → interval = 6 дней
     * - repetitions > 1  → interval = предыдущий_интервал × easiness_factor
     *
     * Формула для нового easiness factor:
     * EF' = EF + (0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02))
     * Умноженная на 100 для целочисленного хранения.
     */
    private void handleCorrectAnswer(UserWordProgress progress, int quality) {
        int repetitions = progress.getRepetitions();

        // Вычисляем новый интервал
        int newInterval;
        if (repetitions == 0) {
            newInterval = 1;
        } else if (repetitions == 1) {
            newInterval = 6;
        } else {
            // easinessFactor хранится ×100, поэтому делим на 100
            newInterval = (int) Math.round(
                    progress.getIntervalDays() * (progress.getEasinessFactor() / 100.0)
            );
        }

        // Вычисляем новый easiness factor по формуле SM-2
        // Умножаем на 100 чтобы хранить как integer
        int delta = (int) Math.round(
                100 * (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        );
        int newEasinessFactor = Math.max(
                MIN_EASINESS_FACTOR,
                progress.getEasinessFactor() + delta
        );

        progress.setRepetitions(repetitions + 1);
        progress.setIntervalDays(newInterval);
        progress.setEasinessFactor(newEasinessFactor);
        progress.setNextReview(LocalDate.now().plusDays(newInterval));
        progress.setLastSeen(java.time.LocalDateTime.now());
    }

    /**
     * Обработка неправильного ответа.
     * SM-2: сбрасываем repetitions в 0 и показываем слово завтра.
     * easiness_factor при этом не меняется — только счётчик ошибок.
     */
    private void handleWrongAnswer(UserWordProgress progress) {
        progress.setRepetitions(0);
        progress.setIntervalDays(1);
        progress.setErrorCount(progress.getErrorCount() + 1);
        progress.setNextReview(LocalDate.now().plusDays(1));
        progress.setLastSeen(java.time.LocalDateTime.now());
    }

    /**
     * Обновить статус слова на основе текущего интервала.
     * MASTERED — интервал больше 60 дней (слово хорошо усвоено).
     * LEARNING  — всё остальное.
     */
    private void updateStatus(UserWordProgress progress) {
        if (progress.getIntervalDays() > 60) {
            progress.setStatus(UserWordProgress.WordStatus.MASTERED);
        } else {
            progress.setStatus(UserWordProgress.WordStatus.LEARNING);
        }
    }
}