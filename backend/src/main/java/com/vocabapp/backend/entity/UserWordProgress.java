package com.vocabapp.backend.entity;

import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Прогресс пользователя по конкретному слову.
 * Хранит параметры алгоритма SM-2 для интервального повторения.
 * Запись создаётся лениво — только когда пользователь
 * впервые встречает слово, а не при регистрации.
 */
@Entity
@Table(name = "user_word_progress",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_user_word_progress",
                        columnNames = {"user_id", "word_id"}
                )
        },
        indexes = {
                @Index(name = "idx_uwp_user_review",
                        columnList = "user_id, next_review"),
                @Index(name = "idx_uwp_word",
                        columnList = "word_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWordProgress {

    @Id
    private UUID id;

    /**
     * Пользователь которому принадлежит прогресс.
     * LAZY — пользователь подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Слово по которому отслеживается прогресс.
     * LAZY — слово подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    /**
     * Коэффициент лёгкости из алгоритма SM-2.
     * Начальное значение 250 (соответствует 2.5 в алгоритме, храним x100 чтобы избежать float).
     * Уменьшается при ошибках, увеличивается при правильных ответах.
     * Минимум 130 (1.3) — слово не может повторяться слишком редко.
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer easinessFactor = 250;

    /**
     * Текущий интервал до следующего повторения в днях.
     * SM-2: первый раз — 1 день, второй — 6 дней, далее умножается на easinessFactor.
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer intervalDays = 1;

    /**
     * Количество успешных повторений подряд без ошибок.
     * При ошибке сбрасывается в 0 и слово возвращается к началу.
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer repetitions = 0;

    /**
     * Общее количество ошибок по данному слову за всё время.
     * Используется для формирования папки "Сложные слова".
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer errorCount = 0;

    /**
     * Дата следующего повторения по алгоритму SM-2.
     * Основной критерий выборки слов для сессии.
     * Индексировано вместе с user_id для быстрого запроса.
     */
    @Column(nullable = false)
    private LocalDate nextReview;

    /** Время последнего показа слова пользователю. */
    @Column
    private LocalDateTime lastSeen;

    /**
     * Статус слова в обучении пользователя.
     * LEARNING  — в процессе изучения, появляется регулярно.
     * MASTERED  — выучено, intervalDays > 60.
     * FORGOTTEN — пользователь не заходил долго, требует повторения.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WordStatus status = WordStatus.LEARNING;

    public enum WordStatus {
        LEARNING, MASTERED, FORGOTTEN
    }

    /**
     * Генерирует UUID v7 перед первым сохранением в БД.
     * UUID v7 содержит timestamp — обеспечивает последовательную
     * вставку в индекс без page split.
     */
    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UuidCreator.getTimeOrderedEpoch();
        }
        if (nextReview == null) {
            nextReview = LocalDate.now();
        }
    }
}