package com.vocabapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Справочник достижений приложения.
 * Содержит все возможные ачивки — заполняется при инициализации БД.
 * Пример: "Выучил 100 слов", "7 дней подряд", "Идеальная сессия".
 */
@Entity
@Table(name = "achievements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * Уникальный код ачивки — используется в бизнес-логике.
     * Пример: "STREAK_7", "WORDS_100", "PERFECT_SESSION".
     * Код, а не id используется в коде — так читаемее и
     * не зависит от порядка вставки в БД.
     */
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Название ачивки которое видит пользователь. */
    @Column(nullable = false)
    private String title;

    /** Описание условия получения ачивки. */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Количество XP которое получает пользователь за ачивку.
     */
    @Column(nullable = false)
    @Builder.Default
    private Integer xpReward = 0;
}