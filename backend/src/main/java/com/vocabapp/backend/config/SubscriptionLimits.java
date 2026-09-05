package com.vocabapp.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Лимиты бесплатного плана — читаются из application.yml
 * (secция subscription.free-tier). Вынесены в конфиг, а не
 * захардкожены в сервисах, чтобы менять баланс без пересборки
 * и повторного деплоя — просто правишь значение и перезапускаешь.
 */
@Component
@ConfigurationProperties(prefix = "subscription.free-tier")
public class SubscriptionLimits {

    private int maxFriends = 5;
    private int maxNewWordsPerDay = 100;

    public int getMaxFriends() {
        return maxFriends;
    }

    public void setMaxFriends(int maxFriends) {
        this.maxFriends = maxFriends;
    }

    public int getMaxNewWordsPerDay() {
        return maxNewWordsPerDay;
    }

    public void setMaxNewWordsPerDay(int maxNewWordsPerDay) {
        this.maxNewWordsPerDay = maxNewWordsPerDay;
    }
}
