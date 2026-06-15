package com.vocabapp.backend.exception;

/**
 * Исключение для ошибок авторизации и регистрации —
 * занятый email/username, неверный пароль.
 *
 * RuntimeException, а не checked exception — не нужно
 * объявлять throws в каждом методе по цепочке вызовов.
 * Перехватывается глобальным обработчиком в controller-слое
 * и превращается в HTTP 400/401 ответ.
 */
public class AuthException extends RuntimeException {
    public AuthException(String message) {
        super(message);
    }
}