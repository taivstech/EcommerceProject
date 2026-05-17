package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.enums.product.BehaviorEventType;
import com.taivs.EcommerceWeb.models.product.UserBehaviorEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface UserBehaviorEventRepository extends JpaRepository<UserBehaviorEvent, String> {

    /**
     * Count recent events to support de-duplication in service layer.
     * Prevents flooding the table when a user rapidly re-views the same product.
     */
    long countByUserIdAndProductIdAndEventTypeAndCreatedAtAfter(
            String userId,
            String productId,
            BehaviorEventType eventType,
            LocalDateTime after
    );

    /**
     * Same de-dup check for anonymous sessions.
     */
    long countBySessionIdAndProductIdAndEventTypeAndCreatedAtAfter(
            String sessionId,
            String productId,
            BehaviorEventType eventType,
            LocalDateTime after
    );

    /**
     * Total number of distinct behavior events in a time window.
     * Used by the recommendation service stats endpoint.
     */
    @Query("""
        SELECT COUNT(e) FROM UserBehaviorEvent e
        WHERE e.createdAt >= :since
    """)
    long countEventsSince(@Param("since") LocalDateTime since);
}
