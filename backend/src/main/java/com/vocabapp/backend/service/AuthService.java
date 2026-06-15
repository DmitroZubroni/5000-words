package com.vocabapp.backend.service;

import com.vocabapp.backend.dto.AuthResponse;
import com.vocabapp.backend.dto.LoginRequest;
import com.vocabapp.backend.dto.RegisterRequest;
import com.vocabapp.backend.entity.User;
import com.vocabapp.backend.exception.AuthException;
import com.vocabapp.backend.repository.UserRepository;
import com.vocabapp.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Сервис авторизации — регистрация и логин пользователей.
 * Генерация JWT делегирована JwtService.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Зарегистрировать нового пользователя и вернуть готовый JWT
     * вместе с базовыми данными профиля.
     *
     * Проверки выполняются до хеширования пароля и сохранения —
     * чтобы не тратить ресурсы BCrypt на запрос который точно провалится.
     *
     * @throws AuthException если email или username уже занят
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AuthException("Email уже используется");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new AuthException("Username уже занят");
        }

        User user = User.builder()
                .email(request.email())
                .username(request.username())
                .passwordHash(passwordEncoder.encode(request.password()))
                .appLanguage(request.appLanguage())
                .build();

        User saved = userRepository.save(user);

        return buildAuthResponse(saved);
    }

    /**
     * Авторизовать пользователя по email и паролю
     * и вернуть готовый JWT вместе с базовыми данными профиля.
     *
     * @throws AuthException если пользователь не найден
     *         или пароль не совпадает
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AuthException("Неверный email или пароль"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthException("Неверный email или пароль");
        }

        return buildAuthResponse(user);
    }

    /**
     * Собрать AuthResponse из сущности User — общая логика
     * для register и login, чтобы не дублировать сборку токена и DTO.
     */
    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId());

        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getAppLanguage()
        );
    }
}