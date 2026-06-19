package com.vocabapp.backend.controller;

import com.vocabapp.backend.dto.UserProfileResponse;
import com.vocabapp.backend.dto.UserStatsResponse;
import com.vocabapp.backend.entity.User;
import com.vocabapp.backend.service.StatsService;
import com.vocabapp.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vocabapp.backend.dto.LeaderboardEntry;
import com.vocabapp.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import java.util.ArrayList;
import java.util.List;

import java.util.UUID;

/**
 * Контроллер для работы с профилем пользователя.
 * Все endpoints требуют аутентификации (JWT токен).
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    
    /**
     * Получить профиль текущего авторизованного пользователя.
     * GET /api/users/me
     *
     * @AuthenticationPrincipal — Spring автоматически подставляет
     * UserDetails из SecurityContext текущего запроса.
     * Помнишь в JwtAuthFilter мы делали User.builder().username(userId.toString())?
     * Вот этот объект сюда и приходит.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        User user = userService.getById(userId);
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }

    private final StatsService statsService;

    /**
     * Получить статистику текущего пользователя.
     * GET /api/users/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<UserStatsResponse> getStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(statsService.getUserStats(userId));
    }

    /**
     * Получить таблицу лидеров — топ-50 по XP.
     * GET /api/users/leaderboard
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard() {
        List<User> topUsers = userRepository.findTopByXp(PageRequest.of(0, 50));

        List<LeaderboardEntry> leaderboard = new ArrayList<>();
        for (int i = 0; i < topUsers.size(); i++) {
            User u = topUsers.get(i);
            leaderboard.add(new LeaderboardEntry(
                    i + 1,
                    u.getId(),
                    u.getUsername(),
                    u.getXp(),
                    u.getLevel(),
                    u.getStreakDays()
            ));
        }

        return ResponseEntity.ok(leaderboard);
    }
}