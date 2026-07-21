package com.taivs.EcommerceWeb.services.order;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisLockService {

    private final RedisTemplate<String, Object> redisTemplate;

    public boolean acquireLock(String key, long expireTimeMs, int retryTimes, long sleepTimeMs) {
        for (int i = 0; i < retryTimes; i++) {
            try {
                Boolean success = redisTemplate.opsForValue().setIfAbsent(
                        key,
                        "LOCKED",
                        Duration.ofMillis(expireTimeMs)
                );

                if (Boolean.TRUE.equals(success)) {
                    log.debug("Acquired lock for key: {}", key);
                    return true;
                }

                // If not successful, wait and retry
                Thread.sleep(sleepTimeMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Lock acquisition interrupted for key: {}", key, e);
                return false;
            } catch (Exception e) {
                log.error("Error acquiring lock for key: {}", key, e);
                return false;
            }
        }
        log.warn("Failed to acquire lock for key after {} retries: {}", retryTimes, key);
        return false;
    }

    public void releaseLock(String key) {
        try {
            redisTemplate.delete(key);
            log.debug("Released lock for key: {}", key);
        } catch (Exception e) {
            log.error("Error releasing lock for key: {}", key, e);
        }
    }
}
