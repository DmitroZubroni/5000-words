package com.vocabapp.backend.entity;

import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

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
                        columnList = "word_id"),
                @Index(name = "idx_uwp_user_created",
                        columnList = "user_id, created_at")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWordProgress {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    @Column(nullable = false)
    @Builder.Default
    private Integer easinessFactor = 250;

    @Column(nullable = false)
    @Builder.Default
    private Integer intervalDays = 1;

    @Column(nullable = false)
    @Builder.Default
    private Integer repetitions = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer errorCount = 0;

    @Column(nullable = false)
    private LocalDate nextReview;

    @Column
    private LocalDateTime lastSeen;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WordStatus status = WordStatus.LEARNING;

    public enum WordStatus {
        LEARNING, MASTERED, FORGOTTEN
    }

    /**
     * Время когда пользователь ВПЕРВЫЕ встретил это слово.
     * Используется для подсчёта дневного лимита новых слов
     * на бесплатном плане — считаем сколько записей
     * создано начиная с полуночи текущего дня.
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

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