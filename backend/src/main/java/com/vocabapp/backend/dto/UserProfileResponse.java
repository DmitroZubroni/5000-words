package com.vocabapp.backend.dto;

import com.vocabapp.backend.entity.User;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Профиль пользователя для отображения в личном кабинете.
 * Не содержит passwordHash и других внутренних полей.
 */
public record UserProfileResponse(
        UUID id,
        String email,
        String username,
        String appLanguage,
        String subscriptionTier,
        Integer xp,
        Integer level,
        Integer streakDays,
        LocalDate lastActive,
        LocalDateTime createdAt
) {
    /**
     * Создать DTO из entity.
     * Статический фабричный метод — удобнее чем конструктор
     * с 10 параметрами, и держит логику маппинга рядом с DTO.
     */
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getAppLanguage(),
                user.getSubscriptionTier().name(),
                user.getXp(),
                user.getLevel(),
                user.getStreakDays(),
                user.getLastActive(),
                user.getCreatedAt()
        );
    }
}