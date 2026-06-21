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
 * Запрос дружбы или установленная дружба между двумя пользователями.
 * Дружба направленная — requester отправил запрос addressee.
 * После принятия оба считаются друзьями.
 */
@Entity
@Table(name = "friendships",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_friendship",
                        columnNames = {"requester_id", "addressee_id"}
                )
        },
        indexes = {
                @Index(name = "idx_friendships_requester", columnList = "requester_id"),
                @Index(name = "idx_friendships_addressee", columnList = "addressee_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Friendship {

    @Id
    private UUID id;

    /**
     * Пользователь который отправил запрос дружбы.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    /**
     * Пользователь которому отправили запрос.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "addressee_id", nullable = false)
    private User addressee;

    /**
     * Текущий статус отношений.
     * PENDING  — запрос отправлен, ожидает ответа
     * ACCEPTED — дружба установлена
     * DECLINED — запрос отклонён
     * BLOCKED  — пользователь заблокирован
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FriendshipStatus status = FriendshipStatus.PENDING;

    public enum FriendshipStatus {
        PENDING, ACCEPTED, DECLINED, BLOCKED
    }

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UuidCreator.getTimeOrderedEpoch();
        }
    }
}