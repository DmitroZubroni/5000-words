package com.vocabapp.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

/**
 * Сервис генерации и проверки JWT токенов.
 * Токен содержит id пользователя (subject) и время истечения.
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    /**
     * Значения подставляются Spring из application.yml
     * через @Value при создании бина.
     */
    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expirationMs
    ) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Сгенерировать токен для пользователя.
     * Subject токена — id пользователя в виде строки.
     */
    public String generateToken(UUID userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Извлечь id пользователя из токена.
     * Если токен подделан или истёк — выбросит исключение
     * (JwtException и его подклассы из io.jsonwebtoken).
     */
    public UUID extractUserId(String token) {
        String subject = extractClaim(token, Claims::getSubject);
        return UUID.fromString(subject);
    }

    /**
     * Проверить не истёк ли токен.
     */
    public boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    /**
     * Универсальный метод извлечения произвольного claim из токена.
     * claimsResolver — функция которая указывает какое именно
     * поле взять из распарсенных claims (subject, expiration и т.д.)
     */
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claimsResolver.apply(claims);
    }
}