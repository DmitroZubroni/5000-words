package com.vocabapp.backend.service;

import com.vocabapp.backend.entity.User;
import com.vocabapp.backend.exception.AuthException;
import com.vocabapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Сервис для работы с профилем пользователя.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Получить пользователя по id.
     * Используется контроллерами которым нужен полный объект User
     * на основе id из JWT токена.
     *
     * @throws AuthException если пользователь не найден —
     *         не должно происходить в нормальной ситуации,
     *         так как JwtAuthFilter уже проверил existsById.
     *         Но защищаемся на случай удаления пользователя
     *         между проверкой в фильтре и вызовом сервиса.
     */
    public User getById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AuthException("Пользователь не найден"));
    }
}