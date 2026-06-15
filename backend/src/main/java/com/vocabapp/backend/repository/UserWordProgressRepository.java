package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.UserWordProgress;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Репозиторий для работы с прогрессом пользователя по словам.
 * Здесь живут основные запросы SM-2 алгоритма.
 */
@Repository
public interface UserWordProgressRepository extends JpaRepository<UserWordProgress, UUID> {

    /**
     * Найти запись прогресса для конкретной пары (пользователь, слово).
     * Используется чтобы проверить — встречал ли пользователь
     * это слово раньше, или нужно создать новую запись.
     *
     * Spring генерирует:
     * SELECT * FROM user_word_progress WHERE user_id = ? AND word_id = ?
     */
    Optional<UserWordProgress> findByUserIdAndWordId(UUID userId, Integer wordId);

    /**
     * Найти слова пользователя готовые к повторению сегодня,
     * отсортированные по дате (самые просроченные — первыми).
     *
     * Покрывается индексом idx_uwp_user_review (user_id, next_review) —
     * выполняется по индексу без скана таблицы.
     *
     * Pageable позволяет ограничить количество результатов
     * (например LIMIT 20) без хардкода числа в запросе.
     */
    @Query("""
        SELECT uwp FROM UserWordProgress uwp
        WHERE uwp.user.id = :userId
        AND uwp.nextReview <= :today
        ORDER BY uwp.nextReview ASC
        """)
    List<UserWordProgress> findDueForReview(
            @Param("userId") UUID userId,
            @Param("today") LocalDate today,
            Pageable pageable
    );

    /**
     * Найти "сложные" слова пользователя — с наибольшим
     * количеством ошибок. Используется для папки "Сложные слова".
     */
    @Query("""
        SELECT uwp FROM UserWordProgress uwp
        WHERE uwp.user.id = :userId
        AND uwp.errorCount > 0
        ORDER BY uwp.errorCount DESC
        """)
    List<UserWordProgress> findMostDifficultWords(
            @Param("userId") UUID userId,
            Pageable pageable
    );

    /**
     * Подсчитать слова пользователя по статусу (LEARNING / MASTERED / FORGOTTEN).
     * Используется для статистики в личном кабинете —
     * "Выучено: 800, В процессе: 300, Забыто: 50".
     */
    @Query("""
        SELECT uwp.status, COUNT(uwp) FROM UserWordProgress uwp
        WHERE uwp.user.id = :userId
        GROUP BY uwp.status
        """)
    List<Object[]> countByStatusForUser(@Param("userId") UUID userId);
}