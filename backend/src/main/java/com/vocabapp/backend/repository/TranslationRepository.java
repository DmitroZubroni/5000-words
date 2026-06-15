package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.Translation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Репозиторий для работы с переводами слов.
 */
@Repository
public interface TranslationRepository extends JpaRepository<Translation, Integer> {

    /**
     * Найти перевод конкретного слова на конкретный язык.
     * Это основной запрос игровой сессии — вызывается для
     * каждого слова чтобы получить нужный перевод.
     *
     * Покрывается индексом idx_translations_word_lang
     * (word_id, target_language_id) — выполняется по индексу,
     * без скана таблицы.
     */
    @Query("""
        SELECT t FROM Translation t
        WHERE t.word.id = :wordId
        AND t.targetLanguage.id = :targetLanguageId
        """)
    Optional<Translation> findByWordAndTargetLanguage(
            @Param("wordId") Integer wordId,
            @Param("targetLanguageId") Integer targetLanguageId
    );

    /**
     * Найти переводы сразу для списка слов на конкретный язык.
     * Используется при формировании сессии — вместо N отдельных
     * запросов (по одному на слово) делаем один запрос со списком id.
     *
     * Это решает проблему N+1: если сессия из 20 слов и для каждого
     * слова отдельно запрашивать перевод — это 20 запросов к БД.
     * С этим методом — один запрос с WHERE word_id IN (...).
     */
    @Query("""
        SELECT t FROM Translation t
        WHERE t.word.id IN :wordIds
        AND t.targetLanguage.id = :targetLanguageId
        """)
    List<Translation> findByWordIdsAndTargetLanguage(
            @Param("wordIds") List<Integer> wordIds,
            @Param("targetLanguageId") Integer targetLanguageId
    );
}