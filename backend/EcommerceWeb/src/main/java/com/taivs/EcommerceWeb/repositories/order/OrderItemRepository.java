package com.taivs.EcommerceWeb.repositories.order;

import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.models.product.CustomerReview;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
    List<OrderItem> findByOrderShopGroup_Order_Id(String orderId);


    @Query("""
            select oi from OrderItem oi
            join fetch oi.orderShopGroup g
            join fetch oi.productVariant pv
            where g.order.id in :orderIds
            """)
    List<OrderItem> findByOrderIdsWithGroupAndVariant(@Param("orderIds") List<String> orderIds);

    @Query("""
            select oi from OrderItem oi
            join fetch oi.productVariant pv
            left join fetch oi.customerReview cr
            where oi.orderShopGroup.id in :groupIds
            """)
    List<OrderItem> findByOrderShopGroupIdsWithVariantAndReview(@Param("groupIds") List<String> groupIds);

    boolean existsByProductVariantIdInAndOrderShopGroupOrderStatus(
            List<String> variantIds, String orderStatus);

    @Query("""
            select count(oi) from OrderItem oi
            where oi.productVariant.id in :variantIds
            and oi.orderShopGroup.order.status = :orderStatus
            """)
    Long countByProductVariantIdInAndOrderShopGroupOrderStatus(
            @Param("variantIds") List<String> variantIds,
            @Param("orderStatus") String orderStatus);

    @Query("""
            select sum(oi.quantity) from OrderItem oi
            where oi.productVariant.id = :variantId
            and oi.orderShopGroup.order.status = :orderStatus
            """)
    Integer sumQuantityByProductVariantIdAndOrderShopGroupOrderStatus(
            @Param("variantId") String variantId,
            @Param("orderStatus") String orderStatus);

    @Query("""
            SELECT oi.productId, SUM(oi.quantity) as totalQty
            FROM OrderItem oi
            JOIN oi.orderShopGroup g
            JOIN g.order o
            WHERE o.status IN (com.taivs.EcommerceWeb.enums.order.OrderStatus.DELIVERED,
                               com.taivs.EcommerceWeb.enums.order.OrderStatus.COMPLETED)
              AND o.createdAt >= :since
            GROUP BY oi.productId
            ORDER BY totalQty DESC
            """)
    List<Object[]> findTrendingProductIds(@Param("since") LocalDateTime since, Pageable pageable);

    @Query("""
            SELECT oi2.productId, COUNT(DISTINCT oi2.orderShopGroup.order.id) as coCount
            FROM OrderItem oi1
            JOIN oi1.orderShopGroup g1
            JOIN g1.order o1
            JOIN OrderItem oi2 ON oi2.orderShopGroup.order.id = o1.id
            WHERE oi1.productId = :productId
              AND oi2.productId <> :productId
              AND o1.status IN (com.taivs.EcommerceWeb.enums.order.OrderStatus.DELIVERED,
                                com.taivs.EcommerceWeb.enums.order.OrderStatus.COMPLETED)
            GROUP BY oi2.productId
            ORDER BY coCount DESC
            """)
    List<Object[]> findFrequentlyBoughtTogether(@Param("productId") String productId, Pageable pageable);
}

