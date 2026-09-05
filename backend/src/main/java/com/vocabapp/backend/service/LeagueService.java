package com.vocabapp.backend.service;

import com.vocabapp.backend.dto.LeaderboardEntry;
import com.vocabapp.backend.dto.LeagueInfo;
import com.vocabapp.backend.entity.User;
import com.vocabapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Сервис системы лиг.
 *
 * Лига = totalXp / 10000, то есть каждые 10 000 XP переводят
 * пользователя в следующую лигу. Названия — по возрастанию силы
 * животного, что более "живо" чем абстрактные номера или металлы.
 *
 * Лига не хранится как отдельное поле в БД — вычисляется на лету
 * из user.xp. Это исключает рассинхронизацию (не нужно помнить
 * обновить два поля при начислении XP) и упрощает миграции.
 */
@Service
@RequiredArgsConstructor
public class LeagueService {

    private static final int XP_PER_LEAGUE = 10_000;

    /**
     * Названия лиг по возрастанию. Индекс массива = номер лиги.
     * Все кто выше индекса — попадают в последнюю категорию "Легенда".
     */
    private static final String[] LEAGUE_NAMES = {
        "Черепаха", "Кролик", "Лиса", "Сова", "Волк",
        "Пантера", "Тигр", "Медведь", "Дракон", "Феникс"
    };

    private final UserRepository userRepository;

    /**
     * Вычислить номер лиги по общему XP.
     */
    public int calculateLeague(int totalXp) {
        return totalXp / XP_PER_LEAGUE;
    }

    /**
     * Получить название лиги по номеру.
     * Начиная с 10-й лиги (индекс за пределами массива) — "Легенда".
     */
    public String getLeagueName(int leagueNumber) {
        if (leagueNumber < LEAGUE_NAMES.length) {
            return LEAGUE_NAMES[leagueNumber];
        }
        return "Легенда";
    }

    /**
     * Собрать полную информацию о лиге пользователя,
     * включая таблицу лидеров среди пользователей той же лиги.
     */
    public LeagueInfo getLeagueInfo(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        int totalXp = user.getXp();
        int leagueNumber = calculateLeague(totalXp);
        int xpInLeague = totalXp % XP_PER_LEAGUE;
        int xpToNextLeague = XP_PER_LEAGUE - xpInLeague;

        // Границы XP текущей лиги — от leagueNumber*10000 до (leagueNumber+1)*10000-1
        int leagueMinXp = leagueNumber * XP_PER_LEAGUE;
        int leagueMaxXp = leagueMinXp + XP_PER_LEAGUE - 1;

        List<User> leagueUsers = userRepository
            .findByXpBetweenOrderByXpDesc(leagueMinXp, leagueMaxXp);

        List<LeaderboardEntry> leaderboard = new java.util.ArrayList<>();
        for (int i = 0; i < leagueUsers.size(); i++) {
            User u = leagueUsers.get(i);
            leaderboard.add(new LeaderboardEntry(
                i + 1, u.getId(), u.getUsername(), u.getXp(), u.getLevel(), u.getStreakDays()
            ));
        }

        return new LeagueInfo(
            leagueNumber,
            getLeagueName(leagueNumber),
            xpInLeague,
            xpToNextLeague,
            totalXp,
            leaderboard
        );
    }
}
