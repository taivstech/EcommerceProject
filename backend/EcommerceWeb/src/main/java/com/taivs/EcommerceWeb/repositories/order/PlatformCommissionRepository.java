package com.taivs.EcommerceWeb.repositories.order;

import com.taivs.EcommerceWeb.models.order.PlatformCommission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PlatformCommissionRepository extends JpaRepository<PlatformCommission, String> {

    List<PlatformCommission> findByShopIdOrderByCreatedAtDesc(String shopId);

    List<PlatformCommission> findByOrderId(String orderId);

    boolean existsByOrderId(String orderId);

    /** Total platform revenue in a date range */
    @Query("""
        SELECT COALESCE(SUM(pc.commissionAmount), 0)
        FROM PlatformCommission pc
        WHERE pc.createdAt BETWEEN :from AND :to
    """)
    BigDecimal sumCommissionBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Total platform revenue per shop in a date range (for admin leaderboard) */
    @Query("""
        SELECT pc.shopId, SUM(pc.commissionAmount)
        FROM PlatformCommission pc
        WHERE pc.createdAt BETWEEN :from AND :to
        GROUP BY pc.shopId
        ORDER BY SUM(pc.commissionAmount) DESC
    """)
    List<Object[]> sumCommissionByShopBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Daily revenue aggregation for the chart */
    @Query(value = """
        SELECT DATE(created_at) as day, SUM(commission_amount) as total
        FROM platform_commissions
        WHERE created_at >= :since
        GROUP BY DATE(created_at)
        ORDER BY day ASC
    """, nativeQuery = true)
    List<Object[]> dailyRevenueSince(@Param("since") LocalDateTime since);

    boolean existsByOrderShopGroupId(String orderShopGroupId);
}
