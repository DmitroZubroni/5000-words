package com.vocabapp.backend.dto;

import java.util.List;

/**
 * Информация о лиге пользователя.
 * Лига вычисляется на лету из общего XP — отдельное поле в БД не нужно:
 * league = totalXp / 10000 (номер лиги, начиная с 0)
 * xpInLeague = totalXp % 10000 (прогресс внутри текущей лиги, 0-9999)
 */
public record LeagueInfo(
    int leagueNumber,
    String leagueName,
    int xpInLeague,
    int xpToNextLeague,
    int totalXp,
    List<LeaderboardEntry> leagueLeaderboard
) {}
