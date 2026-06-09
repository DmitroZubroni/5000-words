package com.vocabapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Представляет слово на конкретном языке.
 * Переводы слова хранятся отдельно в таблице {@link Translation}.
 */
@Entity
@Table(name = "words",
        indexes = {
                @Index(name = "idx_words_lang_topic", columnList = "language_id, topic")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Word {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * Язык которому принадлежит слово.
     * LAZY — язык подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "language_id", nullable = false)
    private Language language;

    /** Само слово на исходном языке. */
    @Column(nullable = false)
    private String word;

    /**
     * Тематическая категория слова — например "Бизнес", "Путешествия".
     * Используется для фильтрации при выборе тематического пака.
     */
    @Column
    private String topic;
}