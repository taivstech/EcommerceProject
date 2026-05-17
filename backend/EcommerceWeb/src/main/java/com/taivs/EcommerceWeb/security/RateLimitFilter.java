package com.taivs.EcommerceWeb.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final int DEFAULT_LIMIT = 5000;
    private static final Duration DEFAULT_WINDOW = Duration.ofMinutes(1);

    private static final int AUTH_LIMIT = 100;
    private static final Duration AUTH_WINDOW = Duration.ofMinutes(1);

    private static final String RATE_KEY_PREFIX = "rate:";

    public RateLimitFilter(RedisTemplate<String, Object> redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        boolean isAuthEndpoint = path.contains("/auth/token")
                || path.contains("/auth/registration")
                || path.contains("/users/registration")
                || path.contains("/auth/forgot-password");

        int limit = isAuthEndpoint ? AUTH_LIMIT : DEFAULT_LIMIT;
        Duration window = isAuthEndpoint ? AUTH_WINDOW : DEFAULT_WINDOW;
        String bucket = isAuthEndpoint ? "auth" : "api";

        String key = RATE_KEY_PREFIX + bucket + ":" + clientIp;

        try {
            Long currentCount = redisTemplate.opsForValue().increment(key);
            if (currentCount != null && currentCount == 1) {
                redisTemplate.expire(key, window);
            }

            if (currentCount != null && currentCount > limit) {
                log.warn("Rate limit exceeded for IP {} on {} bucket (count={})", clientIp, bucket, currentCount);

                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                        "code", 429,
                        "message", "Too many requests. Please slow down."
                )));
                return;
            }

            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - (currentCount != null ? currentCount : 0))));

        } catch (Exception e) {
            log.error("Rate limiter Redis error (fail-closed): {}", e.getMessage());
            response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                    "code", 503,
                    "message", "Service temporarily unavailable. Please try again later."
            )));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
