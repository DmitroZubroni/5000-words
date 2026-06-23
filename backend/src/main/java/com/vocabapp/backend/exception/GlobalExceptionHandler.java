package com.vocabapp.backend.exception;

import com.vocabapp.backend.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

/**
 * Глобальный обработчик исключений.
 * Перехватывает исключения из всех контроллеров и превращает их
 * в чистые HTTP-ответы без стектрейсов и внутренних деталей.
 *
 * @RestControllerAdvice — комбинация @ControllerAdvice + @ResponseBody.
 * Spring автоматически применяет этот класс ко всем @RestController.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Обработка ошибок валидации (@Valid в контроллере).
     * Собирает все ошибки по полям в Map и возвращает 400.
     *
     * Вместо огромного стектрейса клиент получает:
     * {"status":400,"message":"Ошибка валидации",
     *  "errors":{"email":"Некорректный формат email",...}}
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex
    ) {
        Map<String, String> errors = new HashMap<>();

        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(400, "Ошибка валидации", errors));
    }

    /**
     * Обработка бизнес-ошибок авторизации.
     * Email занят, неверный пароль — возвращает 400.
     */
    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuthException(AuthException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(400, ex.getMessage()));
    }

    /**
     * Обработка всех остальных непредвиденных исключений.
     * Возвращает 500 с общим сообщением — никаких внутренних деталей.
     * В логах при этом будет полный стектрейс для дебага.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(500, "Внутренняя ошибка сервера"));
    }

    /**
     * Обработка запросов к несуществующим endpoints.
     * Spring выбрасывает NoResourceFoundException когда не находит
     * ни контроллера ни статического ресурса по указанному пути.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFoundException(NoResourceFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(404, "Ресурс не найден: " + ex.getResourcePath()));
    }

    /**
     * Обработка бизнес-ошибок с невалидными аргументами.
     * Например: запрос дружбы уже существует, дуэль не найдена и т.д.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(400, ex.getMessage()));
    }
}