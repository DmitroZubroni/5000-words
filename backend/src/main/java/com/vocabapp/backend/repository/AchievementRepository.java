package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Репозиторий для справочника достижений.
 * Таблица заполняется при инициализации БД и практически не изменяется.
 */
@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Integer> {

    /**
     * Найти достижение по его читаемому коду.
     * Используется в бизнес-логике при проверке и выдаче ачивок,
     * например achievementService.award(user, "STREAK_7").
     * Spring генерирует: SELECT * FROM achievements WHERE code = ?
     */
    Optional<Achievement> findByCode(String code);
}