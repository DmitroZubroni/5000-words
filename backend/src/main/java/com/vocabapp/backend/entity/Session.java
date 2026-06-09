package com.vocabapp.backend.entity;

import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Игровая сессия пользователя.
 * Одна запись = одна завершённая сессия.
 * Используется для подсчёта статистики и динамики прогресса.
 */
@Entity
@Table(name = "sessions",
        indexes = {
                @Index(name = "idx_sessions_user_date",
                        columnList = "user_id, finished_at")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    private UUID id;

    /**
     * Пользователь которому принадлежит сессия.
     * LAZY — пользователь подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Режим сессии — сопоставление, дописывание, выживание и т.д.
     * Хранится как строка для читаемости в БД.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionMode mode;

    /**
     * Исходный язык сессии — язык с которого переводили.
     * LAZY — язык подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lang_from_id", nullable = false)
    private Language langFrom;

    /**
     * Целевой язык сессии — язык на который переводили.
     * LAZY — язык подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lang_to_id", nullable = false)
    private Language langTo;

    /** Общее количество слов в сессии. */
    @Column(nullable = false)
    private Integer totalWords;

    /** Количество правильных ответов. */
    @Column(nullable = false)
    private Integer correct;

    /** Количество неправильных ответов. */
    @Column(nullable = false)
    private Integer incorrect;

    /** Длительность сессии в секундах. */
    @Column(nullable = false)
    private Integer durationSeconds;

    /** Время начала сессии. */
    @Column(nullable = false)
    private LocalDateTime startedAt;

    /**
     * Время завершения сессии.
     * Индексировано вместе с user_id для быстрого
     * запроса статистики за период.
     */
    @Column
    private LocalDateTime finishedAt;

    /**
     * Генерирует UUID v7 перед первым сохранением в БД.
     */
    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UuidCreator.getTimeOrderedEpoch();
        }
    }

    /**
     * Режимы игровой сессии.
     */
    public enum SessionMode {
        /** Сопоставление двух столбцов по 5 слов. */
        MATCHING,
        /** Пользователь вписывает перевод вручную. */
        WRITING,
        /** Ответы на время — 30 секунд на раунд. */
        TIME_ATTACK,
        /** 3 жизни, ошибся 3 раза — сессия сброшена. */
        SURVIVAL,
        /** Еженедельный тест на все слова за неделю. */
        BOSS_ROUND
    }
}