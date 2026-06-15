package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}