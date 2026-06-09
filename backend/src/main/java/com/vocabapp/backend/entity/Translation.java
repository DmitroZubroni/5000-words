package com.vocabapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Перевод слова на целевой язык.
 * Одно слово может иметь переводы на все остальные 9 языков.
 * Связь: {@link Word} → множество {@link Translation}.
 */
@Entity
@Table(name = "translations",
        indexes = {
                @Index(name = "idx_translations_word_lang",
                        columnList = "word_id, target_language_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Translation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * Исходное слово для которого дан перевод.
     * LAZY — слово подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    /**
     * Язык на который переведено слово.
     * LAZY — язык подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_language_id", nullable = false)
    private Language targetLanguage;

    /** Перевод слова на целевой язык. */
    @Column(nullable = false)
    private String translation;

    /**
     * Пример использования слова в предложении на целевом языке.
     * Опционален — может быть null.
     */
    @Column(columnDefinition = "TEXT")
    private String exampleSentence;
}