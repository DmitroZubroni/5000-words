package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.CustomSetWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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
     */
    @Query("SELECT csw FROM CustomSetWord csw WHERE csw.customSet.id = :setId")
    List<CustomSetWord> findBySetId(@Param("setId") UUID setId);

    @Modifying
    @Query("DELETE FROM CustomSetWord csw WHERE csw.customSet.id = :setId")
    void deleteAllBySetId(@Param("setId") UUID setId);
}