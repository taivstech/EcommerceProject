package com.taivs.EcommerceWeb.dto.request.product;

import com.taivs.EcommerceWeb.enums.product.BehaviorEventType;
import lombok.Data;

/**
 * Payload sent by the frontend to track a user behavior event.
 *
 * Frontend fires this asynchronously (non-blocking, best-effort).
 * The server discards the event gracefully if the payload is invalid.
 */
@Data
public class BehaviorEventRequest {

    /** Target product ID. Required for VIEW, CLICK, WISHLIST, CART_ADD. */
    private String productId;

    /** Event type */
    private BehaviorEventType eventType;

    /**
     * Optional context describing where the event originated.
     * E.g. "home_feed", "search_results", "product_page", "similar_products"
     */
    private String pageContext;
}
