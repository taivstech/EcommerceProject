package com.taivs.EcommerceWeb.utils;

import com.taivs.EcommerceWeb.dto.response.product.CategoryResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RedisCacheHelper {

    RedisTemplate<String, Object> redisTemplate;
    ObjectMapper objectMapper;

    public <T> T getFromCache(String key, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForValue().get(key);

            if (value == null) {
                return null;
            }

            if (!clazz.isInstance(value)) {
                return objectMapper.convertValue(value, clazz);
            }

            return clazz.cast(value);

        } catch (Exception e) {
            log.warn("Cache miss/error for key: {} - {}", key, e.getMessage());
            return null;
        }
    }

    public <T> List<T> getListFromCache(String key, Class<T> elementClass) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) return null;

            if (value instanceof List<?> rawList) {
                return objectMapper.convertValue(rawList,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, elementClass));
            }
            return null;
        } catch (Exception e) {
            log.warn("Cache list miss/error for key: {} - {}", key, e.getMessage());
            return null;
        }
    }

    public void saveToCache(String key, Object data, int ttlSeconds) {
        try {
            redisTemplate.opsForValue().set(key, data, ttlSeconds, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("Error saving cache for key: {} - {}", key, e.getMessage());
        }
    }

    public void deleteCache(String key) {
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Error deleting cache for key: {} - {}", key, e.getMessage());
        }
    }
    public void deleteCacheByPattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("Deleted {} cache keys matching pattern: {}", keys.size(), pattern);
            }
        } catch (Exception e) {
            log.warn("Error deleting cache by pattern: {} - {}", pattern, e.getMessage());
        }
    }

    public boolean hasKey(String key) {
        try {
            Boolean exists = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.warn("Error checking cache key: {} - {}", key, e.getMessage());
            return false;
        }
    }
}
