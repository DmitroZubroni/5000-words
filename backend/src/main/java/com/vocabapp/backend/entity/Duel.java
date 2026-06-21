package com.vocabapp.backend.entity;

import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Дуэль между двумя пользователями.
 * Создаётся когда один пользователь вызывает другого.
 * Оба получают одинаковый набор слов.
 */
@Entity
@Table(name = "duels",
        indexes = {
                @Index(name = "idx_duels_creator", columnList = "creator_id"),
                @Index(name = "idx_duels_opponent", columnList = "opponent_id"),
                @Index(name = "idx_duels_status", columnList = "status")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Duel {

    @Id
    private UUID id;

    /**
     * Пользователь создавший дуэль (инициатор вызова).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    /**
     * Вызванный пользователь.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opponent_id", nullable = false)
    private User opponent;

    /**
     * Язык с которого переводят в дуэли.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lang_from_id", nullable = false)
    private Language langFrom;

    /**
     * Язык на который переводят в дуэли.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lang_to_id", nullable = false)
    private Language langTo;

    /**
     * Статус дуэли.
     * PENDING     — вызов отправлен, ожидает принятия
     * IN_PROGRESS — оба приняли, идёт сражение
     * FINISHED    — оба завершили, есть победитель
     * DECLINED    — вызов отклонён
     * CANCELLED   — создатель отменил вызов
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DuelStatus status = DuelStatus.PENDING;

    public enum DuelStatus {
        PENDING, IN_PROGRESS, FINISHED, DECLINED, CANCELLED
    }

    /**
     * Победитель дуэли — null пока дуэль не завершена
     * или при ничьей.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    private User winner;

    /**
     * Слова для дуэли — сохраняем как строку id через запятую.
     * Оба игрока получают одинаковый набор.
     * Пример: "14,29,43,54,56,59,61,72,88,95"
     */
    @Column(columnDefinition = "TEXT")
    private String wordIds;

    /** Точность создателя в процентах — null пока не завершил. */
    @Column
    private Double creatorAccuracy;

    /** Точность соперника в процентах — null пока не завершил. */
    @Column
    private Double opponentAccuracy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime finishedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UuidCreator.getTimeOrderedEpoch();
        }
    }
}