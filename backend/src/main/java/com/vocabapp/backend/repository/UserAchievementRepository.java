package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Репозиторий для ачивок полученных пользователями.
 */
@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {

    /**
     * Найти все ачивки полученные пользователем,
     * для отображения в личном кабинете.
     * Покрывается индексом idx_user_achievements_user (user_id).
     * Spring генерирует: SELECT * FROM user_achievements WHERE user_id = ?
     */
    List<UserAchievement> findByUserId(UUID userId);

    /**
     * Проверить, получил ли пользователь конкретную ачивку.
     * Используется перед выдачей — чтобы не вызывать save()
     * если ачивка уже есть (хотя uq_user_achievement constraint
     * всё равно защитит БД от дубликата на уровне базы).
     * Spring генерирует:
     * SELECT COUNT(*) > 0 FROM user_achievements
     * WHERE user_id = ? AND achievement_id = ?
     */
    boolean existsByUserIdAndAchievementId(UUID userId, Integer achievementId);
}