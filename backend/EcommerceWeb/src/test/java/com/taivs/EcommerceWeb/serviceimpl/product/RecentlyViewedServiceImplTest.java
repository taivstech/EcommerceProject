package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.user.User;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecentlyViewedServiceImplTest {

    @Mock RedisTemplate<String, Object> redisTemplate;
    @Mock ZSetOperations<String, Object> zSetOps;

    @InjectMocks RecentlyViewedServiceImpl service;

    private static final String USER_ID = "user-1";
    private static final String KEY = "user:viewed:" + USER_ID;

    @BeforeEach
    void setUp() {
        var ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new TestingAuthenticationToken(USER_ID, null));
        SecurityContextHolder.setContext(ctx);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("trackView adds product to sorted set and sets expiry")
    void trackView_addsToSortedSet() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
        when(zSetOps.size(KEY)).thenReturn(5L);

        service.trackView("prod-1");

        verify(zSetOps).add(eq(KEY), eq("prod-1"), anyDouble());
        verify(redisTemplate).expire(eq(KEY), eq(30L), any());
    }

    @Test
    @DisplayName("getRecentlyViewedProductIds returns product IDs in reverse order")
    void getRecently_returnsIds() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
        Set<Object> set = new LinkedHashSet<>(List.of("prod-3", "prod-2", "prod-1"));
        when(zSetOps.reverseRange(KEY, 0, 19)).thenReturn(set);

        List<String> result = service.getRecentlyViewedProductIds();

        assertThat(result).containsExactly("prod-3", "prod-2", "prod-1");
    }

    @Test
    @DisplayName("getRecentlyViewedProductIds returns empty list when no data")
    void getRecently_emptyResult() {
        when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
        when(zSetOps.reverseRange(KEY, 0, 19)).thenReturn(null);

        List<String> result = service.getRecentlyViewedProductIds();

        assertThat(result).isEmpty();
    }
}
