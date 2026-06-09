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
 * Пользовательский набор слов.
 * Пользователь может создать свой тематический набор
 * и опционально поделиться им с другими пользователями.
 */
@Entity
@Table(name = "custom_sets",
        indexes = {
                @Index(name = "idx_custom_sets_user",
                        columnList = "user_id"),
                @Index(name = "idx_custom_sets_public",
                        columnList = "is_public")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomSet {

    @Id
    private UUID id;

    /**
     * Пользователь создавший набор.
     * LAZY — пользователь подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Название набора которое видит пользователь. */
    @Column(nullable = false)
    private String title;

    /**
     * Флаг публичности набора.
     * true — набор виден всем пользователям в каталоге.
     * false — набор виден только создателю.
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isPublic = false;

    /**
     * Время создания набора.
     * Проставляется автоматически Hibernate при первом сохранении.
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    /**
     * Генерирует UUID v7 перед первым сохранением в БД.
     */
    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UuidCreator.getTimeOrderedEpoch();
        }
    }
}