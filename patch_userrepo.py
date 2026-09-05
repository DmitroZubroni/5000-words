import re

with open("backend/src/main/java/com/vocabapp/backend/repository/UserRepository.java", "r") as f:
    content = f.read()

addition = """
    @Query("SELECT u FROM User u WHERE u.id IN :userIds ORDER BY u.xp DESC")
    List<User> findByIdInOrderByXpDesc(@Param("userIds") List<UUID> userIds);

    List<User> findByXpBetweenOrderByXpDesc(int minXp, int maxXp);
}"""

content = re.sub(r'\}$', addition, content)

with open("backend/src/main/java/com/vocabapp/backend/repository/UserRepository.java", "w") as f:
    f.write(content)
