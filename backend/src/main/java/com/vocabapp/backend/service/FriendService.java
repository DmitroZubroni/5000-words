package com.vocabapp.backend.service;

import com.vocabapp.backend.dto.FriendDto;
import com.vocabapp.backend.dto.FriendRequestDto;
import com.vocabapp.backend.entity.Friendship;
import com.vocabapp.backend.entity.User;
import com.vocabapp.backend.exception.AuthException;
import com.vocabapp.backend.repository.FriendshipRepository;
import com.vocabapp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Сервис управления дружескими связями.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    /**
     * Отправить запрос дружбы пользователю.
     *
     * @throws IllegalArgumentException если запрос уже существует
     *         или пользователь пытается добавить себя
     */
    @Transactional
    public void sendFriendRequest(UUID requesterId, UUID addresseeId) {
        if (requesterId.equals(addresseeId)) {
            throw new IllegalArgumentException("Нельзя добавить себя в друзья");
        }

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new AuthException("Пользователь не найден"));

        User addressee = userRepository.findById(addresseeId)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));

        // Проверяем что связи ещё нет
        friendshipRepository.findBetweenUsers(requesterId, addresseeId)
                .ifPresent(f -> {
                    throw new IllegalArgumentException(
                            switch (f.getStatus()) {
                                case PENDING -> "Запрос уже отправлен";
                                case ACCEPTED -> "Вы уже друзья";
                                case DECLINED -> "Запрос был отклонён";
                                case BLOCKED -> "Невозможно отправить запрос";
                            }
                    );
                });

        Friendship friendship = Friendship.builder()
                .requester(requester)
                .addressee(addressee)
                .status(Friendship.FriendshipStatus.PENDING)
                .build();

        friendshipRepository.save(friendship);
        log.info("Запрос дружбы отправлен от {} к {}", requesterId, addresseeId);
    }

    /**
     * Принять входящий запрос дружбы.
     *
     * @throws AuthException если запрос не найден или не принадлежит пользователю
     */
    @Transactional
    public void acceptFriendRequest(UUID currentUserId, UUID requesterId) {
        Friendship friendship = friendshipRepository
                .findBetweenUsers(requesterId, currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Запрос дружбы не найден"));

        // Проверяем что именно этот пользователь является адресатом
        if (!friendship.getAddressee().getId().equals(currentUserId)) {
            throw new AuthException("Нет доступа к этому запросу");
        }

        if (friendship.getStatus() != Friendship.FriendshipStatus.PENDING) {
            throw new IllegalArgumentException("Запрос уже обработан");
        }

        friendship.setStatus(Friendship.FriendshipStatus.ACCEPTED);
        friendshipRepository.save(friendship);
        log.info("Дружба установлена между {} и {}", currentUserId, requesterId);
    }

    /**
     * Отклонить входящий запрос дружбы.
     */
    @Transactional
    public void declineFriendRequest(UUID currentUserId, UUID requesterId) {
        Friendship friendship = friendshipRepository
                .findBetweenUsers(requesterId, currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("Запрос дружбы не найден"));

        if (!friendship.getAddressee().getId().equals(currentUserId)) {
            throw new AuthException("Нет доступа к этому запросу");
        }

        friendship.setStatus(Friendship.FriendshipStatus.DECLINED);
        friendshipRepository.save(friendship);
        log.info("Запрос дружбы от {} отклонён пользователем {}", requesterId, currentUserId);
    }

    /**
     * Удалить друга — удаляем запись дружбы полностью.
     */
    @Transactional
    public void removeFriend(UUID currentUserId, UUID friendId) {
        Friendship friendship = friendshipRepository
                .findBetweenUsers(currentUserId, friendId)
                .orElseThrow(() -> new IllegalArgumentException("Дружба не найдена"));

        if (friendship.getStatus() != Friendship.FriendshipStatus.ACCEPTED) {
            throw new IllegalArgumentException("Вы не являетесь друзьями");
        }

        friendshipRepository.delete(friendship);
        log.info("Дружба между {} и {} удалена", currentUserId, friendId);
    }

    /**
     * Получить список друзей пользователя.
     */
    public List<FriendDto> getFriends(UUID userId) {
        return friendshipRepository.findAcceptedFriendships(userId)
                .stream()
                .map(f -> FriendDto.from(f, userId))
                .collect(Collectors.toList());
    }

    /**
     * Получить входящие запросы дружбы.
     */
    public List<FriendRequestDto> getPendingRequests(UUID userId) {
        return friendshipRepository.findPendingRequests(userId)
                .stream()
                .map(FriendRequestDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Поиск пользователей по username для добавления в друзья.
     * Возвращает до 10 результатов, исключает самого пользователя.
     */
    public List<UserRepository.UserSearchResult> searchUsers(UUID currentUserId, String query) {
        return userRepository.searchByUsername(currentUserId, query);
    }
}