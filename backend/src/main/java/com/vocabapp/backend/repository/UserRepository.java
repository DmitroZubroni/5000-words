package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Репозиторий для работы с пользователями.
 * Spring Data JPA автоматически генерирует реализацию
 * всех методов на основе их названий.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Найти пользователя по email.
     * Используется при логине и проверке уникальности email.
     * Spring генерирует: SELECT * FROM users WHERE email = ?
     */
    Optional<User> findByEmail(String email);

    /**
     * Проверить существует ли пользователь с данным email.
     * Используется при регистрации.
     * Spring генерирует: SELECT COUNT(*) > 0 FROM users WHERE email = ?
     */
    boolean existsByEmail(String email);

    /**
     * Проверить существует ли пользователь с данным username.
     * Используется при регистрации.
     * Spring генерирует: SELECT COUNT(*) > 0 FROM users WHERE username = ?
     */
    boolean existsByUsername(String username);

    /**
     * Топ пользователей по XP для таблицы лидеров.
     * Покрывается индексом idx_users_xp.
     * Pageable ограничивает количество результатов.
     */
    @Query("SELECT u FROM User u ORDER BY u.xp DESC")
    List<User> findTopByXp(Pageable pageable);

    /**
     * Проекция для поиска пользователей — только публичные поля.
     * Не отдаём email и passwordHash при поиске.
     */
    interface UserSearchResult {
        UUID getId();
        String getUsername();
        int getLevel();
        int getXp();
    }

    /**
     * Поиск пользователей по username (частичное совпадение).
     * Исключает текущего пользователя из результатов.
     * LIMIT 10 — не нужно больше для UI поиска.
     */
    @Query("""
    SELECT u.id as id, u.username as username,
           u.level as level, u.xp as xp
    FROM User u
    WHERE u.username LIKE %:query%
    AND u.id != :currentUserId
    ORDER BY u.username ASC
    LIMIT 10
    """)
    List<UserSearchResult> searchByUsername(
            @Param("currentUserId") UUID currentUserId,
            @Param("query") String query
    );
}