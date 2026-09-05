import re

with open("backend/src/main/java/com/vocabapp/backend/controller/UserController.java", "r") as f:
    content = f.read()

# Add imports
imports = """import com.vocabapp.backend.entity.Friendship;
import com.vocabapp.backend.repository.FriendshipRepository;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Optional;
"""
content = re.sub(r'(import java\.util\.UUID;)', r'\1\n' + imports, content)

# Add friendship repository to dependencies
deps = """
    private final UserService userService;
    private final UserRepository userRepository;
    private final UserWordProgressRepository progressRepository;
    private final FriendshipRepository friendshipRepository;
"""
content = re.sub(r'    private final UserService userService;\s+private final UserRepository userRepository;\s+private final UserWordProgressRepository progressRepository;', deps, content)


# Add friends leaderboard
friends_endpoint = """
    @GetMapping("/leaderboard/friends")
    public ResponseEntity<List<LeaderboardEntry>> getFriendsLeaderboard(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        
        List<Friendship> friends = friendshipRepository.findByUserIdOrFriendIdAndStatus(
                userId, userId, Friendship.FriendshipStatus.ACCEPTED
        );
        
        List<UUID> userIds = friends.stream()
                .map(f -> f.getUserId().equals(userId) ? f.getFriendId() : f.getUserId())
                .collect(Collectors.toList());
        userIds.add(userId);

        List<User> topUsers = userRepository.findByIdInOrderByXpDesc(userIds);

        List<LeaderboardEntry> leaderboard = new ArrayList<>();
        for (int i = 0; i < topUsers.size(); i++) {
            User u = topUsers.get(i);
            leaderboard.add(new LeaderboardEntry(
                    i + 1,
                    u.getId(),
                    u.getUsername(),
                    u.getXp(),
                    u.getLevel(),
                    u.getStreakDays()
            ));
        }

        return ResponseEntity.ok(leaderboard);
    }
}"""
content = re.sub(r'\}\s*$', friends_endpoint, content)

with open("backend/src/main/java/com/vocabapp/backend/controller/UserController.java", "w") as f:
    f.write(content)
