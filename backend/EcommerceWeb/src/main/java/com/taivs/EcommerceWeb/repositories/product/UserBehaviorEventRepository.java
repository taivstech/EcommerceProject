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

    long countByUserIdAndProductIdAndEventTypeAndCreatedAtAfter(
            String userId,
            String productId,
            BehaviorEventType eventType,
            LocalDateTime after
    );

    long countBySessionIdAndProductIdAndEventTypeAndCreatedAtAfter(
            String sessionId,
            String productId,
            BehaviorEventType eventType,
            LocalDateTime after
    );

    @Query("""
        SELECT COUNT(e) FROM UserBehaviorEvent e
        WHERE e.createdAt >= :since
    """)
    long countEventsSince(@Param("since") LocalDateTime since);
}
