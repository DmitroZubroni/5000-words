package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.CustomSetWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Репозиторий для связи между пользовательскими наборами и словами.
 */
@Repository
public interface CustomSetWordRepository extends JpaRepository<CustomSetWord, Long> {

    /**
     * Найти все слова входящие в конкретный набор.
     * Используется при запуске сессии на основе пользовательского набора.
     * Spring генерирует: SELECT * FROM custom_set_words WHERE set_id = ?
     */
    List<CustomSetWord> findBySetId(UUID setId);

    /**
     * Удалить все слова набора одним запросом —
     * используется при удалении самого набора (CustomSet),
     * чтобы избежать orphan-записей в custom_set_words.
     *
     * @Modifying обязателен для запросов которые изменяют данные
     * (DELETE, UPDATE) — без него Spring Data выбросит исключение,
     * так как по умолчанию @Query предполагает SELECT.
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM CustomSetWord csw WHERE csw.customSet.id = :setId")
    void deleteAllBySetId(@Param("setId") UUID setId);
}