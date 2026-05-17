package com.taivs.EcommerceWeb.services.product;

import com.taivs.EcommerceWeb.dto.request.product.BehaviorEventRequest;

/**
 * Tracks user behavior events (views, clicks, wishlist adds, cart adds)
 * asynchronously for later use by the recommendation engine.
 */
public interface BehaviorTrackingService {

    /**
     * Record a behavior event. This method is non-blocking (fire-and-forget).
     * De-duplication logic prevents flooding the table for repeated views
     * within a short time window.
     *
     * @param userId    authenticated user ID, or null for anonymous
     * @param sessionId browser session UUID (always present)
     * @param request   event payload
     */
    void track(String userId, String sessionId, BehaviorEventRequest request);
}
