package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.dto.request.product.BehaviorEventRequest;
import com.taivs.EcommerceWeb.enums.product.BehaviorEventType;
import com.taivs.EcommerceWeb.models.product.UserBehaviorEvent;
import com.taivs.EcommerceWeb.repositories.product.UserBehaviorEventRepository;
import com.taivs.EcommerceWeb.services.product.BehaviorTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class BehaviorTrackingServiceImpl implements BehaviorTrackingService {

    private final UserBehaviorEventRepository behaviorRepository;

    // De-dup windows (in minutes)
    private static final int DEDUP_VIEW_MINUTES   = 30;
    private static final int DEDUP_CLICK_MINUTES  = 5;

    @Override
    @Async("behaviorTrackingExecutor")
    @Transactional
    public void track(String userId, String sessionId, BehaviorEventRequest request) {
        try {
            if (request == null || request.getEventType() == null) return;

            // Require productId for non-SEARCH events
            if (request.getEventType() != BehaviorEventType.SEARCH
                    && (request.getProductId() == null || request.getProductId().isBlank())) {
                return;
            }

            // De-duplication check for VIEW and CLICK
            if (isDuplicate(userId, sessionId, request)) {
                log.debug("Behavior event de-duped: type={} product={} user={}",
                        request.getEventType(), request.getProductId(), userId);
                return;
            }

            UserBehaviorEvent event = UserBehaviorEvent.builder()
                    .userId(userId)
                    .productId(request.getProductId())
                    .eventType(request.getEventType())
                    .sessionId(sessionId)
                    .pageContext(request.getPageContext())
                    .build();

            behaviorRepository.save(event);
            log.debug("Tracked behavior: type={} product={} user={}", 
                    request.getEventType(), request.getProductId(), userId);

        } catch (Exception e) {
            // Fire-and-forget: never let tracking errors affect the main request
            log.warn("Behavior tracking failed silently: {}", e.getMessage());
        }
    }

    private boolean isDuplicate(String userId, String sessionId, BehaviorEventRequest req) {
        BehaviorEventType type = req.getEventType();

        // WISHLIST and CART_ADD are always intentional — no de-dup
        if (type == BehaviorEventType.WISHLIST || type == BehaviorEventType.CART_ADD) {
            return false;
        }

        int windowMinutes = (type == BehaviorEventType.VIEW) ? DEDUP_VIEW_MINUTES : DEDUP_CLICK_MINUTES;
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(windowMinutes);

        if (userId != null && !userId.isBlank()) {
            return behaviorRepository.countByUserIdAndProductIdAndEventTypeAndCreatedAtAfter(
                    userId, req.getProductId(), type, windowStart) > 0;
        }

        if (sessionId != null && !sessionId.isBlank()) {
            return behaviorRepository.countBySessionIdAndProductIdAndEventTypeAndCreatedAtAfter(
                    sessionId, req.getProductId(), type, windowStart) > 0;
        }

        return false;
    }
}
