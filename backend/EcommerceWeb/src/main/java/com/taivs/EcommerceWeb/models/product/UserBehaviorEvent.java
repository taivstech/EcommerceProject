package com.taivs.EcommerceWeb.models.product;

import com.taivs.EcommerceWeb.enums.product.BehaviorEventType;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Tracks fine-grained user behavior signals for hybrid recommendation training.
 *
 * Every view, click, wishlist add, and cart add is persisted here.
 * The Python recommendation service reads this table periodically to enrich
 * the collaborative filtering user-item interaction matrix with implicit signals
 * beyond just purchase history.
 *
 * Signal weights in collaborative filtering:
 *   VIEW      = 0.3
 *   CLICK     = 0.5
 *   SEARCH    = 0.4  (keyword stored separately, productId = null)
 *   WISHLIST  = 1.5
 *   CART_ADD  = 2.0
 *   PURCHASE  = 3.0  (from orders table — not stored here)
 *   REVIEW    = 2.5 × (rating/5)  (from customer_reviews — not stored here)
 */
@Entity
@Table(
    name = "user_behavior_events",
    indexes = {
        @Index(name = "idx_ube_user_product", columnList = "user_id, product_id"),
        @Index(name = "idx_ube_user_event",   columnList = "user_id, event_type"),
        @Index(name = "idx_ube_product_event", columnList = "product_id, event_type"),
        @Index(name = "idx_ube_created_at",    columnList = "created_at"),
        @Index(name = "idx_ube_session",       columnList = "session_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBehaviorEvent extends BaseEntity {

    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Authenticated user ID. Null for anonymous visitors. */
    @Column(name = "user_id", length = 36)
    private String userId;

    /**
     * Target product ID. Null for SEARCH events.
     */
    @Column(name = "product_id", length = 36)
    private String productId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", length = 20, nullable = false)
    private BehaviorEventType eventType;

    /**
     * Browser/device session identifier (UUID generated on frontend).
     * Used for anonymous → authenticated stitching and de-duplication.
     */
    @Column(name = "session_id", length = 64)
    private String sessionId;

    /**
     * Raw page/referrer context — useful for future funnel analysis.
     * E.g. "home_feed", "search_results", "similar_products"
     */
    @Column(name = "page_context", length = 100)
    private String pageContext;

}
