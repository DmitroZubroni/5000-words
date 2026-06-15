package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Репозиторий для работы со словами.
 */
@Repository
public interface WordRepository extends JpaRepository<Word, Integer> {

    /**
     * Найти слова определённого языка, опционально отфильтрованные по теме.
     * Используется при формировании тематического набора для сессии.
     *
     * Если topic = null — JPQL условие "topic = NULL" никогда не сработает
     * в SQL (NULL = NULL даёт NULL, а не TRUE), поэтому добавлено
     * условие ":topic IS NULL OR w.topic = :topic" — фильтр применяется
     * только если topic передан.
     */
    @Query("""
        SELECT w FROM Word w
        WHERE w.language.id = :languageId
        AND (:topic IS NULL OR w.topic = :topic)
        """)
    List<Word> findByLanguageAndOptionalTopic(
            @Param("languageId") Integer languageId,
            @Param("topic") String topic
    );

    /**
     * Получить список всех уникальных тем для конкретного языка.
     * Используется для отображения списка доступных
     * тематических паков пользователю.
     * Spring генерирует: SELECT DISTINCT topic FROM words WHERE language_id = ?
     */
    @Query("SELECT DISTINCT w.topic FROM Word w WHERE w.language.id = :languageId AND w.topic IS NOT NULL")
    List<String> findDistinctTopicsByLanguage(@Param("languageId") Integer languageId);
}