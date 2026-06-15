package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Репозиторий для работы со справочником языков.
 * Таблица заполняется один раз при инициализации (10 языков)
 * и практически не изменяется.
 */
@Repository
public interface LanguageRepository extends JpaRepository<Language, Integer> {

    /**
     * Найти язык по его ISO-коду.
     * Используется при сидировании данных и валидации
     * языковой пары которую выбрал пользователь.
     * Spring генерирует: SELECT * FROM languages WHERE code = ?
     */
    Optional<Language> findByCode(String code);
}