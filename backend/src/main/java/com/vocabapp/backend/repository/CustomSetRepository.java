package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.CustomSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Репозиторий для пользовательских наборов слов.
 */
@Repository
public interface CustomSetRepository extends JpaRepository<CustomSet, UUID> {

    /**
     * Найти все наборы созданные конкретным пользователем —
     * для отображения в его личном кабинете.
     * Покрывается индексом idx_custom_sets_user (user_id).
     * Spring генерирует: SELECT * FROM custom_sets WHERE user_id = ?
     */
    List<CustomSet> findByUserId(UUID userId);

    /**
     * Найти публичные наборы — для общего каталога,
     * которым могут пользоваться все.
     * Покрывается индексом idx_custom_sets_public (is_public).
     * Spring генерирует: SELECT * FROM custom_sets WHERE is_public = true
     */
    List<CustomSet> findByIsPublicTrue();
}