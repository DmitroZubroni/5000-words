package com.vocabapp.backend.service;

import com.vocabapp.backend.entity.User;
import com.vocabapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Сервис учёта дневного стрика пользователя.
 * Стрик — количество дней подряд когда пользователь завершил
 * хотя бы одну сессию. Вызывается из SessionService.finishSession.
 */
@Service
@RequiredArgsConstructor
public class StreakService {

    /**
     * Результат обновления стрика — новое значение и флаг,
     * увеличился ли он именно сейчас (для показа попапа на фронте).
     */
    public record StreakResult(int streakDays, boolean increased, boolean freezeUsed) {}

    private final UserRepository userRepository;

    /**
     * Обновить стрик пользователя на основе сегодняшней активности.
     *
     * Логика:
     * - lastActive == null → первый визит, streak = 1
     * - lastActive == сегодня → уже засчитан сегодня, ничего не делаем
     * - lastActive == вчера → стрик продолжается, +1
     * - lastActive раньше чем вчера → стрик прервался, сброс на 1
     */
    public StreakResult updateStreak(User user) {
        LocalDate today = LocalDate.now();
        LocalDate lastActive = user.getLastActive();

        if (lastActive != null && lastActive.equals(today)) {
            return new StreakResult(user.getStreakDays(), false, false);
        }

        boolean increased = true; // по умолчанию считаем что есть прогресс
        boolean freezeUsed = false;

        if (lastActive != null && lastActive.equals(today.minusDays(1))) {
            // Идеально: зашел на следующий день
            user.setStreakDays(user.getStreakDays() + 1);
        } else if (lastActive != null && lastActive.equals(today.minusDays(2))
                && user.getSubscriptionTier() == User.SubscriptionTier.PREMIUM) {
            // Пропустил ровно 1 день. Если Premium - проверяем квоту на заморозку (1 раз в 30 дней)
            LocalDate lastFreeze = user.getLastFreezeUsed();
            if (lastFreeze == null || lastFreeze.isBefore(today.minusDays(30))) {
                user.setStreakDays(user.getStreakDays() + 1); // спасаем стрик
                user.setLastFreezeUsed(today); // фиксируем использование
                freezeUsed = true;
            } else {
                user.setStreakDays(1); // заморозка еще не откатилась
            }
        } else {
            // Сброс стрика
            user.setStreakDays(1);
        }

        user.setLastActive(today);
        userRepository.save(user);

        return new StreakResult(user.getStreakDays(), increased, freezeUsed);
    }
}
