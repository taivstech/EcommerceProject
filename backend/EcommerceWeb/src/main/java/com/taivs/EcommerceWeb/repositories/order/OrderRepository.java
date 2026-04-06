package com.taivs.EcommerceWeb.repositories.order;

import com.taivs.EcommerceWeb.models.notification.Notification;
import com.taivs.EcommerceWeb.models.order.ShippingAddress;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.models.product.Product;

public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByUser_IdOrderByCreatedAtDesc(String userId);

    @Query("""
            select distinct o from Order o
            left join fetch o.shippingAddress sa
            left join fetch o.orderShopGroups g
            left join fetch g.shop s
            left join fetch g.warehouse w
            where o.user.id = :userId
            order by o.createdAt desc
            """)
    List<Order> findByUserIdWithShippingAndGroupsOrderByCreatedAtDesc(@Param("userId") String userId);

    @Query("""
            select distinct o from Order o
            left join fetch o.shippingAddress sa
            left join fetch o.orderShopGroups g
            left join fetch g.shop s
            left join fetch g.warehouse w
            where o.id = :orderId
            """)
    Optional<Order> findByIdWithShippingAndGroups(@Param("orderId") String orderId);

    @Query("""
            select distinct o from Order o
            left join fetch o.shippingAddress sa
            left join fetch o.orderShopGroups g
            left join fetch g.shop s
            left join fetch g.warehouse w
            order by o.createdAt desc
            """)
    List<Order> findAllWithShippingAndGroupsOrderByCreatedAtDesc();

    @Query("""
            select distinct o from Order o
            left join fetch o.shippingAddress sa
            left join fetch o.orderShopGroups g
            left join fetch g.shop s
            left join fetch g.warehouse w
            where o.status = :status
            order by o.createdAt desc
            """)
    List<Order> findAllWithShippingAndGroupsByStatusOrderByCreatedAtDesc(@Param("status") OrderStatus status);

    @Query("""
            select distinct o from Order o
            left join fetch o.shippingAddress sa
            join fetch o.orderShopGroups g
            join fetch g.shop s
            left join fetch g.warehouse w
            join fetch s.user su
            where su.id = :sellerUserId
            order by o.createdAt desc
            """)
    List<Order> findBySellerUserIdWithShippingAndGroupsOrderByCreatedAtDesc(@Param("sellerUserId") String sellerUserId);

    @Query("""
    select distinct o
    from Order o
    join fetch o.user u
    join o.orderShopGroups g
    join g.shop s
    join s.user su
    where o.id = :orderId
      and su.id = :sellerUserId
""")
    Optional<Order> findByIdAndSellerUserId(
            @Param("orderId") String orderId,
            @Param("sellerUserId") String sellerUserId
    );

    @Query("""
    SELECT DISTINCT o
    FROM Order o
    JOIN o.orderShopGroups g
    JOIN g.shop s
    WHERE s.user.id = :sellerUserId
    ORDER BY o.createdAt DESC
""")
    List<Order> findBySellerUserIdOrderByCreatedAtDesc(String sellerUserId);

    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, LocalDateTime createdAt);

    List<Order> findByStatusAndUpdatedAtBefore(OrderStatus status, LocalDateTime updatedAt);

    long countByStatus(OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o WHERE o.status IN ('DELIVERED', 'COMPLETED')")
    java.math.BigDecimal calculateTotalRevenue();

    @Query("""
        SELECT DISTINCT o FROM Order o
        LEFT JOIN FETCH o.shippingAddress sa
        JOIN FETCH o.orderShopGroups g
        LEFT JOIN FETCH g.shop s
        LEFT JOIN FETCH g.warehouse w
        WHERE g.warehouse.id IN :warehouseIds
        ORDER BY o.createdAt DESC
    """)
    List<Order> findByWarehouseIdsWithDetails(@Param("warehouseIds") List<String> warehouseIds);

    @Query("""
        SELECT DISTINCT o FROM Order o
        LEFT JOIN FETCH o.shippingAddress
        JOIN o.orderShopGroups g
        WHERE o.id = :orderId
        AND g.warehouse.id IN :warehouseIds
    """)
    Optional<Order> findByIdAndWarehouseIds(@Param("orderId") String orderId,
                                             @Param("warehouseIds") List<String> warehouseIds);

    @Query("""
        select distinct o from Order o
        join fetch o.user u
        left join fetch o.orderShopGroups g
        left join fetch g.shop s
        left join fetch s.user su
        left join fetch g.warehouse w
        where o.id = :orderId
    """)
    Optional<Order> findByIdForNotification(@Param("orderId") String orderId);

    @Query("""
        SELECT FUNCTION('DATE', o.createdAt), COALESCE(SUM(o.total), 0), COUNT(o)
        FROM Order o
        WHERE o.status IN (com.taivs.EcommerceWeb.enums.order.OrderStatus.DELIVERED,
                           com.taivs.EcommerceWeb.enums.order.OrderStatus.COMPLETED)
          AND o.createdAt >= :since
        GROUP BY FUNCTION('DATE', o.createdAt)
        ORDER BY FUNCTION('DATE', o.createdAt) ASC
    """)
    List<Object[]> findDailyRevenue(@Param("since") LocalDateTime since);

    @Query("""
        SELECT FUNCTION('YEAR', o.createdAt), FUNCTION('MONTH', o.createdAt),
               COALESCE(SUM(o.total), 0), COUNT(o)
        FROM Order o
        WHERE o.status IN (com.taivs.EcommerceWeb.enums.order.OrderStatus.DELIVERED,
                           com.taivs.EcommerceWeb.enums.order.OrderStatus.COMPLETED)
          AND o.createdAt >= :since
        GROUP BY FUNCTION('YEAR', o.createdAt), FUNCTION('MONTH', o.createdAt)
        ORDER BY FUNCTION('YEAR', o.createdAt) ASC, FUNCTION('MONTH', o.createdAt) ASC
    """)
    List<Object[]> findMonthlyRevenue(@Param("since") LocalDateTime since);

    @Query("""
        SELECT o.status, COUNT(o)
        FROM Order o
        GROUP BY o.status
    """)
    List<Object[]> countGroupedByStatus();

    @Query("""
        SELECT oi.productId, oi.productName, oi.productImage,
               SUM(oi.quantity), SUM(oi.price * oi.quantity)
        FROM OrderItem oi
        JOIN oi.orderShopGroup g
        JOIN g.order o
        WHERE o.status IN (com.taivs.EcommerceWeb.enums.order.OrderStatus.DELIVERED,
                           com.taivs.EcommerceWeb.enums.order.OrderStatus.COMPLETED)
          AND o.createdAt >= :since
        GROUP BY oi.productId, oi.productName, oi.productImage
        ORDER BY SUM(oi.price * oi.quantity) DESC
    """)
    List<Object[]> findTopProductsByRevenue(@Param("since") LocalDateTime since,
                                            org.springframework.data.domain.Pageable pageable);

    @Query("""
        SELECT p.category.id, c.name,
               COUNT(DISTINCT o.id), SUM(oi.price * oi.quantity)
        FROM OrderItem oi
        JOIN oi.orderShopGroup g
        JOIN g.order o
        JOIN com.taivs.EcommerceWeb.models.product.Product p ON p.id = oi.productId
        JOIN p.category c
        WHERE o.status IN (com.taivs.EcommerceWeb.enums.order.OrderStatus.DELIVERED,
                           com.taivs.EcommerceWeb.enums.order.OrderStatus.COMPLETED)
          AND o.createdAt >= :since
        GROUP BY p.category.id, c.name
        ORDER BY SUM(oi.price * oi.quantity) DESC
    """)
    List<Object[]> findCategoryRevenue(@Param("since") LocalDateTime since);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :orderId")
    Optional<Order> findByIdForUpdate(@Param("orderId") String orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT DISTINCT o FROM Order o
        JOIN FETCH o.user u
        JOIN o.orderShopGroups g
        JOIN g.shop s
        JOIN s.user su
        WHERE o.id = :orderId AND su.id = :sellerUserId
    """)
    Optional<Order> findByIdAndSellerUserIdForUpdate(
            @Param("orderId") String orderId,
            @Param("sellerUserId") String sellerUserId
    );
}

