package com.vocabapp.backend.config;

import com.vocabapp.backend.entity.Language;
import com.vocabapp.backend.entity.Achievement;
import com.vocabapp.backend.repository.AchievementRepository;
import com.vocabapp.backend.repository.LanguageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Инициализация справочных данных при старте приложения.
 * Выполняется один раз после полного старта Spring контекста.
 * Идемпотентен — повторный запуск не создаёт дублей
 * благодаря проверке existsBy перед каждой вставкой.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final LanguageRepository languageRepository;
    private final AchievementRepository achievementRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedLanguages();
        seedAchievements();
    }

    /**
     * Заполняет справочник языков если он пуст.
     * 10 поддерживаемых языков приложения.
     */
    private void seedLanguages() {
        if (languageRepository.count() > 0) {
            log.info("Языки уже загружены, пропускаем.");
            return;
        }

        List<Language> languages = List.of(
                Language.builder().code("en").name("English").build(),
                Language.builder().code("ru").name("Русский").build(),
                Language.builder().code("de").name("Deutsch").build(),
                Language.builder().code("fr").name("Français").build(),
                Language.builder().code("es").name("Español").build(),
                Language.builder().code("it").name("Italiano").build(),
                Language.builder().code("pt").name("Português").build(),
                Language.builder().code("zh").name("中文").build(),
                Language.builder().code("ja").name("日本語").build(),
                Language.builder().code("ko").name("한국어").build()
        );

        languageRepository.saveAll(languages);
        log.info("Загружено {} языков.", languages.size());
    }

    /**
     * Заполняет справочник ачивок если он пуст.
     * Коды ачивок используются в бизнес-логике AchievementService.
     */
    private void seedAchievements() {
        if (achievementRepository.count() > 0) {
            log.info("Ачивки уже загружены, пропускаем.");
            return;
        }

        List<Achievement> achievements = List.of(
                Achievement.builder()
                        .code("FIRST_SESSION")
                        .title("Первый шаг")
                        .description("Завершить первую сессию")
                        .xpReward(50)
                        .build(),
                Achievement.builder()
                        .code("WORDS_100")
                        .title("Сотня")
                        .description("Выучить 100 слов")
                        .xpReward(100)
                        .build(),
                Achievement.builder()
                        .code("WORDS_500")
                        .title("Полтысячи")
                        .description("Выучить 500 слов")
                        .xpReward(300)
                        .build(),
                Achievement.builder()
                        .code("WORDS_1000")
                        .title("Тысячник")
                        .description("Выучить 1000 слов")
                        .xpReward(500)
                        .build(),
                Achievement.builder()
                        .code("STREAK_3")
                        .title("Три дня подряд")
                        .description("Заниматься 3 дня подряд")
                        .xpReward(75)
                        .build(),
                Achievement.builder()
                        .code("STREAK_7")
                        .title("Неделя")
                        .description("Заниматься 7 дней подряд")
                        .xpReward(150)
                        .build(),
                Achievement.builder()
                        .code("STREAK_30")
                        .title("Месяц")
                        .description("Заниматься 30 дней подряд")
                        .xpReward(500)
                        .build(),
                Achievement.builder()
                        .code("PERFECT_SESSION")
                        .title("Идеальная сессия")
                        .description("Завершить сессию без единой ошибки")
                        .xpReward(100)
                        .build(),
                Achievement.builder()
                        .code("SURVIVAL_COMPLETE")
                        .title("Выживший")
                        .description("Пройти режим выживания без потери жизней")
                        .xpReward(200)
                        .build(),
                Achievement.builder()
                        .code("BOSS_ROUND_WIN")
                        .title("Босс повержен")
                        .description("Выиграть босс-раунд с результатом выше 80%")
                        .xpReward(250)
                        .build()
        );

        achievementRepository.saveAll(achievements);
        log.info("Загружено {} ачивок.", achievements.size());
    }
}