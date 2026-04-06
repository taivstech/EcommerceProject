package com.taivs.EcommerceWeb.serviceimpl.chat;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.services.chat.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresenceServiceImpl implements PresenceService {

    private static final String ONLINE_SET_KEY = "presence:online";
    private static final long SET_TTL_HOURS = 24;

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void userConnected(UUID userId) {
        String id = userId.toString();
        redisTemplate.opsForSet().add(ONLINE_SET_KEY, id);
        redisTemplate.expire(ONLINE_SET_KEY, SET_TTL_HOURS, TimeUnit.HOURS);
        log.debug("Presence: {} connected (online set size={})",
                id, redisTemplate.opsForSet().size(ONLINE_SET_KEY));
    }

    @Override
    public void userDisconnected(UUID userId) {
        String id = userId.toString();
        redisTemplate.opsForSet().remove(ONLINE_SET_KEY, id);
        log.debug("Presence: {} disconnected", id);
    }

    @Override
    public boolean isOnline(UUID userId) {
        Boolean member = redisTemplate.opsForSet().isMember(ONLINE_SET_KEY, userId.toString());
        return Boolean.TRUE.equals(member);
    }
}
