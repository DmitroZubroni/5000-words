import re

with open("backend/src/main/java/com/vocabapp/backend/controller/UserController.java", "r") as f:
    content = f.read()

old_code = """        List<Friendship> friends = friendshipRepository.findByUserIdOrFriendIdAndStatus(
                userId, userId, Friendship.FriendshipStatus.ACCEPTED
        );
        
        List<UUID> userIds = friends.stream()
                .map(f -> f.getUserId().equals(userId) ? f.getFriendId() : f.getUserId())
                .collect(Collectors.toList());"""

new_code = """        List<Friendship> friends = friendshipRepository.findAcceptedFriendships(userId);
        
        List<UUID> userIds = friends.stream()
                .map(f -> f.getRequester().getId().equals(userId) ? f.getAddressee().getId() : f.getRequester().getId())
                .collect(Collectors.toList());"""

content = content.replace(old_code, new_code)

with open("backend/src/main/java/com/vocabapp/backend/controller/UserController.java", "w") as f:
    f.write(content)
