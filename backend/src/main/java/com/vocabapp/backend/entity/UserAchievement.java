package com.vocabapp.backend.entity;

import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Ачивки полученные конкретным пользователем.
 * Связывает пользователя с достижением и фиксирует время получения.
 * Одна запись = одна полученная ачивка.
 */
@Entity
@Table(name = "user_achievements",
        indexes = {
                @Index(name = "idx_user_achievements_user",
                        columnList = "user_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_user_achievement",
                        columnNames = {"user_id", "achievement_id"}
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAchievement {

    @Id
    private UUID id;

    /**
     * Пользователь получивший ачивку.
     * LAZY — пользователь подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Полученная ачивка из справочника.
     * LAZY — ачивка подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "achievement_id", nullable = false)
    private Achievement achievement;

    /**
     * Время получения ачивки.
     * Используется для сортировки в личном кабинете.
     */
    @Column(nullable = false)
    private LocalDateTime earnedAt;

    /**
     * Генерирует UUID v7 перед первым сохранением в БД.
     */
    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UuidCreator.getTimeOrderedEpoch();
        }
        if (earnedAt == null) {
            earnedAt = LocalDateTime.now();
        }
    }
}