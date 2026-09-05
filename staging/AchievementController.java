package com.vocabapp.backend.controller;

import com.vocabapp.backend.dto.AchievementDto;
import com.vocabapp.backend.entity.Achievement;
import com.vocabapp.backend.entity.UserAchievement;
import com.vocabapp.backend.repository.AchievementRepository;
import com.vocabapp.backend.repository.UserAchievementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Контроллер ачивок — список всех достижений с отметкой
 * какие уже получены текущим пользователем.
 */
@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;

    /**
     * Получить все ачивки с отметкой earned/locked для текущего пользователя.
     * GET /api/achievements
     */
    @GetMapping
    public ResponseEntity<List<AchievementDto>> getAll(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());

        List<Achievement> all = achievementRepository.findAll();
        List<UserAchievement> earned = userAchievementRepository.findByUserId(userId);

        Map<Integer, UserAchievement> earnedMap = earned.stream()
            .collect(Collectors.toMap(ua -> ua.getAchievement().getId(), ua -> ua));

        List<AchievementDto> result = all.stream()
            .map(a -> {
                UserAchievement ua = earnedMap.get(a.getId());
                return new AchievementDto(
                    a.getCode(), a.getTitle(), a.getDescription(), a.getXpReward(),
                    ua != null,
                    ua != null ? ua.getEarnedAt().toString() : null
                );
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
