import re

with open("backend/src/main/java/com/vocabapp/backend/service/StreakService.java", "r") as f:
    content = f.read()

old_logic = """        boolean increased;
        if (lastActive != null && lastActive.equals(today.minusDays(1))) {
            user.setStreakDays(user.getStreakDays() + 1);
            increased = true;
        } else {
            user.setStreakDays(1);
            increased = lastActive == null || user.getStreakDays() != 1;
            increased = true;
        }"""

new_logic = """        boolean increased = true; // по умолчанию считаем что есть прогресс
        boolean freezeUsed = false;

        if (lastActive != null && lastActive.equals(today.minusDays(1))) {
            // Идеально: зашел на следующий день
            user.setStreakDays(user.getStreakDays() + 1);
        } else if (lastActive != null && lastActive.equals(today.minusDays(2))
                && user.getSubscriptionTier() == User.SubscriptionTier.PREMIUM) {
            // Пропустил ровно 1 день. Если Premium - проверяем квоту на заморозку (1 раз в 30 дней)
            LocalDate lastFreeze = user.getLastFreezeUsed();
            if (lastFreeze == null || lastFreeze.isBefore(today.minusDays(30))) {
                user.setStreakDays(user.getStreakDays() + 1); // спасаем стрик
                user.setLastFreezeUsed(today); // фиксируем использование
                freezeUsed = true;
            } else {
                user.setStreakDays(1); // заморозка еще не откатилась
            }
        } else {
            // Сброс стрика
            user.setStreakDays(1);
        }"""

content = content.replace(old_logic, new_logic)

with open("backend/src/main/java/com/vocabapp/backend/service/StreakService.java", "w") as f:
    f.write(content)
