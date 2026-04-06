package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.services.product.RecentlyViewedService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RecentlyViewedServiceImpl implements RecentlyViewedService {

    private static final String KEY_PREFIX = "user:viewed:";
    private static final int MAX_ITEMS = 20;
    private static final long TTL_DAYS = 30;

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void trackView(String productId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        String key = KEY_PREFIX + userId;

        ZSetOperations<String, Object> zSet = redisTemplate.opsForZSet();
        double score = System.currentTimeMillis();

        zSet.add(key, productId, score);

        long size = zSet.size(key) != null ? zSet.size(key) : 0;
        if (size > MAX_ITEMS) {
            zSet.removeRange(key, 0, size - MAX_ITEMS - 1);
        }

        redisTemplate.expire(key, TTL_DAYS, TimeUnit.DAYS);
    }

    @Override
    public List<String> getRecentlyViewedProductIds() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        String key = KEY_PREFIX + userId;

        Set<Object> result = redisTemplate.opsForZSet().reverseRange(key, 0, MAX_ITEMS - 1);
        if (result == null || result.isEmpty()) {
            return Collections.emptyList();
        }

        return result.stream().map(Object::toString).toList();
    }
}
