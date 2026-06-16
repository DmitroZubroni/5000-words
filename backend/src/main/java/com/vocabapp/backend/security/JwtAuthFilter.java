package com.vocabapp.backend.security;

import com.vocabapp.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

/**
 * JWT фильтр аутентификации.
 * Выполняется один раз на каждый HTTP запрос (OncePerRequestFilter).
 * Читает токен из заголовка Authorization, проверяет его,
 * и если токен валиден — помещает аутентификацию в SecurityContext.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Читаем заголовок Authorization
        String authHeader = request.getHeader("Authorization");

        // Если заголовка нет или он не начинается с "Bearer " —
        // просто пропускаем запрос дальше по цепочке.
        // Для публичных endpoints (/api/auth/**) это нормально.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Отрезаем "Bearer " (7 символов) и получаем сам токен
        String token = authHeader.substring(7);

        try {
            // Извлекаем id пользователя из токена.
            // Если токен подделан или истёк — jwtService выбросит исключение
            // и мы попадём в catch блок.
            UUID userId = jwtService.extractUserId(token);

            // Проверяем что пользователь ещё не аутентифицирован в этом запросе
            // (защита от повторной аутентификации если фильтр вызван дважды)
            if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Проверяем что пользователь существует в БД
                boolean userExists = userRepository.existsById(userId);

                if (userExists && !jwtService.isTokenExpired(token)) {
                    // Создаём объект аутентификации для Spring Security.
                    // Principal — id пользователя в виде строки.
                    // Credentials — null (пароль уже проверен при логине).
                    // Authorities — пустой список (роли добавим позже).
                    UserDetails userDetails = User.builder()
                            .username(userId.toString())
                            .password("")
                            .authorities(Collections.emptyList())
                            .build();

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    // Добавляем детали запроса (IP адрес, session id и т.д.)
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );

                    // Помещаем аутентификацию в SecurityContext —
                    // после этого Spring Security считает запрос аутентифицированным.
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception e) {
            // Токен невалиден — просто не аутентифицируем запрос.
            // Не прерываем цепочку — пусть Spring Security сам решит
            // что делать с неаутентифицированным запросом (вернёт 401).
        }

        // Передаём запрос дальше по цепочке фильтров
        filterChain.doFilter(request, response);
    }
}