package com.vocabapp.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Конфигурация компонентов безопасности, доступных как Spring-бины.
 * Вынесены отдельно от основной конфигурации Security (фильтры, цепочка),
 * чтобы PasswordEncoder можно было внедрить в AuthService
 * без зависимости от полной конфигурации авторизации.
 */
@Configuration
public class SecurityBeansConfig {

    /**
     * BCrypt — алгоритм хеширования паролей со встроенной "солью".
     * Каждый вызов encode() даёт разный хеш для одного и того же пароля,
     * но matches() корректно проверяет совпадение.
     * Необратим — из хеша невозможно восстановить исходный пароль.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}