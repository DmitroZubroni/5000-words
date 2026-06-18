package com.vocabapp.backend.controller;

import com.vocabapp.backend.entity.Language;
import com.vocabapp.backend.repository.LanguageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Контроллер справочника языков.
 * Публичный — не требует JWT, так как список языков
 * нужен даже на экране регистрации.
 */
@RestController
@RequestMapping("/api/languages")
@RequiredArgsConstructor
public class LanguageController {

    private final LanguageRepository languageRepository;

    /**
     * Получить список всех поддерживаемых языков.
     * GET /api/languages
     */
    @GetMapping
    public ResponseEntity<List<Language>> getAllLanguages() {
        return ResponseEntity.ok(languageRepository.findAll());
    }
}