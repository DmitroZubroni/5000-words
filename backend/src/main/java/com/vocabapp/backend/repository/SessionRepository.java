package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Репозиторий для работы с игровыми сессиями.
 * Источник данных для статистики и динамики прогресса.
 */
@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    /**
     * Найти завершённые сессии пользователя за период,
     * отсортированные от новых к старым.
     * Покрывается индексом idx_sessions_user_date (user_id, finished_at).
     *
     * finished_at IS NOT NULL — исключает незавершённые сессии
     * (пользователь закрыл приложение посередине).
     */
    @Query("""
        SELECT s FROM Session s
        WHERE s.user.id = :userId
        AND s.finishedAt IS NOT NULL
        AND s.finishedAt >= :since
        ORDER BY s.finishedAt DESC
        """)
    List<Session> findFinishedSessionsSince(
            @Param("userId") UUID userId,
            @Param("since") LocalDateTime since
    );

    /**
     * Найти последнюю завершённую сессию пользователя.
     * Используется для сравнения "стало лучше/хуже"
     * с предыдущей сессией.
     */
    @Query("""
        SELECT s FROM Session s
        WHERE s.user.id = :userId
        AND s.finishedAt IS NOT NULL
        ORDER BY s.finishedAt DESC
        LIMIT 1
        """)
    Session findLastFinishedSession(@Param("userId") UUID userId);
}