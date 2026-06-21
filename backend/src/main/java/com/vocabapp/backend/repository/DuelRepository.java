package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.Duel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Репозиторий для работы с дуэлями.
 */
@Repository
public interface DuelRepository extends JpaRepository<Duel, UUID> {

    /**
     * Найти активные дуэли пользователя — входящие вызовы
     * которые ещё не приняты или уже идут.
     * Используется для показа уведомлений при открытии приложения.
     */
    @Query("""
        SELECT d FROM Duel d
        JOIN FETCH d.creator
        JOIN FETCH d.langFrom
        JOIN FETCH d.langTo
        WHERE d.opponent.id = :userId
        AND d.status = 'PENDING'
        """)
    List<Duel> findPendingChallenges(@Param("userId") UUID userId);

    /**
     * Найти историю дуэлей пользователя — завершённые дуэли
     * в которых он участвовал как создатель или соперник.
     */
    @Query("""
        SELECT d FROM Duel d
        JOIN FETCH d.creator
        JOIN FETCH d.opponent
        WHERE (d.creator.id = :userId OR d.opponent.id = :userId)
        AND d.status = 'FINISHED'
        ORDER BY d.finishedAt DESC
        """)
    List<Duel> findFinishedDuels(@Param("userId") UUID userId);
}