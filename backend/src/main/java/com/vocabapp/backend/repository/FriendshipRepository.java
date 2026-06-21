package com.vocabapp.backend.repository;

import com.vocabapp.backend.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Репозиторий для работы с дружескими связями.
 */
@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {

    /**
     * Найти связь между двумя пользователями в любом направлении.
     * Используется для проверки существующей дружбы или запроса
     * перед отправкой нового запроса.
     */
    @Query("""
        SELECT f FROM Friendship f
        WHERE (f.requester.id = :userId1 AND f.addressee.id = :userId2)
        OR (f.requester.id = :userId2 AND f.addressee.id = :userId1)
        """)
    Optional<Friendship> findBetweenUsers(
            @Param("userId1") UUID userId1,
            @Param("userId2") UUID userId2
    );

    /**
     * Найти всех принятых друзей пользователя.
     * Дружба двусторонняя — ищем в обоих направлениях.
     */
    @Query("""
        SELECT f FROM Friendship f
        JOIN FETCH f.requester
        JOIN FETCH f.addressee
        WHERE (f.requester.id = :userId OR f.addressee.id = :userId)
        AND f.status = 'ACCEPTED'
        """)
    List<Friendship> findAcceptedFriendships(@Param("userId") UUID userId);

    /**
     * Найти входящие запросы дружбы — те что ждут ответа от пользователя.
     */
    @Query("""
        SELECT f FROM Friendship f
        JOIN FETCH f.requester
        WHERE f.addressee.id = :userId
        AND f.status = 'PENDING'
        """)
    List<Friendship> findPendingRequests(@Param("userId") UUID userId);

    /**
     * Найти исходящие запросы дружбы — те что пользователь отправил сам.
     */
    @Query("""
        SELECT f FROM Friendship f
        JOIN FETCH f.addressee
        WHERE f.requester.id = :userId
        AND f.status = 'PENDING'
        """)
    List<Friendship> findOutgoingRequests(@Param("userId") UUID userId);
}