package com.vocabapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Справочник поддерживаемых языков приложения.
 * Содержит 10 языков, заполняется при инициализации БД.
 */
@Entity
@Table(name = "languages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Language {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * ISO 639-1 код языка — например "en", "ru", "de".
     * Ограничен 10 символами как constraint на уровне БД.
     */
    @Column(nullable = false, unique = true, length = 10)
    private String code;

    /** Полное название языка — например "English", "Русский". */
    @Column(nullable = false, unique = true)
    private String name;
}