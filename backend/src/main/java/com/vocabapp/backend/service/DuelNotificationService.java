package com.vocabapp.backend.service;

import com.vocabapp.backend.entity.Duel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Сервис push-уведомлений о событиях дуэлей через Server-Sent Events (SSE).
 * Заменяет неэффективный HTTP polling мгновенной доставкой событий
 * (вызов, принятие, завершение раунда, победа).
 */
@Slf4j
@Service
public class DuelNotificationService {

    // Таймаут SSE соединения: 10 минут (клиент автоматически переподключается)
    private static final long SSE_TIMEOUT = 600_000L;

    // Пользователь -> список активных SSE соединений (например несколько вкладок)
    private final Map<UUID, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    /**
     * Подписать пользователя на поток событий дуэлей.
     */
    public SseEmitter subscribe(UUID userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(e -> removeEmitter(userId, emitter));

        // Отправляем начальное событие для подтверждения соединения
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data(Map.of("status", "connected", "userId", userId.toString())));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        log.debug("Пользователь {} подключился к SSE потоку дуэлей", userId);
        return emitter;
    }

    /**
     * Отправить уведомление конкретному пользователю.
     */
    public void notifyUser(UUID userId, String eventName, Object data) {
        List<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (Exception e) {
                log.warn("Не удалось отправить SSE событие {} пользователю {}: {}", eventName, userId, e.getMessage());
                removeEmitter(userId, emitter);
            }
        }
    }

    /**
     * Отправить уведомление обоим участникам дуэли (создателю и сопернику).
     */
    public void notifyDuelParticipants(Duel duel, String eventName, Object data) {
        if (duel.getCreator() != null) {
            notifyUser(duel.getCreator().getId(), eventName, data);
        }
        if (duel.getOpponent() != null) {
            notifyUser(duel.getOpponent().getId(), eventName, data);
        }
    }

    /**
     * Периодический heartbeat ping каждые 25 секунд для поддержания
     * соединения и предотвращения закрытия со стороны Render / Nginx proxy.
     */
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        emitters.forEach((userId, list) -> {
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (Exception e) {
                    removeEmitter(userId, emitter);
                }
            }
        });
    }

    private void removeEmitter(UUID userId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(userId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emitters.remove(userId);
            }
        }
    }
}
