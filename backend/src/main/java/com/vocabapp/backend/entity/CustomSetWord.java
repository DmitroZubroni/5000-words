package com.vocabapp.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Связь между пользовательским набором и словами.
 * Реализует отношение многие-ко-многим между
 * {@link CustomSet} и {@link Word}.
 *
 * Используем отдельный entity вместо @ManyToMany —
 * это даёт контроль над таблицей и возможность
 * добавить поля в будущем (например порядок слов).
 */
@Entity
@Table(name = "custom_set_words",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_set_word",
                        columnNames = {"set_id", "word_id"}
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomSetWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Набор, которому принадлежит слово.
     * LAZY — набор подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_id", nullable = false)
    private CustomSet customSet;

    /**
     * Слово добавленное в набор.
     * LAZY — слово подгружается только при явном обращении.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;
}