package com.vocabapp.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Конфигурация Spring Security.
 *
 * Текущий этап: открываем /api/auth/** для неавторизованных запросов,
 * отключаем дефолтные механизмы (форма логина, Basic Auth, CSRF),
 * настраиваем CORS для работы с React-фронтендом.
 *
 * JWT-фильтр для защиты остальных endpoints будет добавлен
 * отдельным шагом после создания security/JwtAuthFilter.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Главная цепочка фильтров безопасности.
     * Spring вызывает этот бин при старте и строит на его основе
     * filter chain через которую проходит каждый запрос.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF защита нужна для сессионной авторизации с куками и формами.
                // Мы используем JWT в заголовке Authorization — CSRF здесь не применим.
                .csrf(csrf -> csrf.disable())

                // Подключаем CORS конфигурацию из бина corsConfigurationSource()
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Приложение stateless — сервер не хранит сессии пользователей.
                // Каждый запрос содержит JWT и аутентифицируется независимо.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Правила доступа к путям
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .anyRequest().permitAll() // временно — заменим на authenticated() после JWT-фильтра
                );

        return http.build();
    }

    /**
     * Настройка CORS — какие источники (origins) могут делать запросы
     * к этому API из браузера.
     *
     * Без этой настройки React на localhost:5173 получит ошибку
     * "blocked by CORS policy" при попытке fetch к localhost:8080.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfigurationFor("/**", configuration);

        return source;
    }
}