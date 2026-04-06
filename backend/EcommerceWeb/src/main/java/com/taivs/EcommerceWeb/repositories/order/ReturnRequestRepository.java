package com.taivs.EcommerceWeb.repositories.order;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.order.ReturnRequest;
import com.taivs.EcommerceWeb.enums.order.ReturnStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, String> {

    @Query("""
            SELECT r FROM ReturnRequest r
            JOIN FETCH r.order o
            JOIN FETCH r.orderItem oi
            WHERE r.user.id = :userId
            ORDER BY r.createdAt DESC
            """)
    Set<ReturnRequest> findByUserId(@Param("userId") String userId);

    @Query("""
            SELECT r FROM ReturnRequest r
            JOIN FETCH r.order o
            JOIN FETCH r.orderItem oi
            JOIN FETCH r.user u
            JOIN o.orderShopGroups g
            JOIN g.shop s
            WHERE s.user.id = :sellerUserId
            ORDER BY r.createdAt DESC
            """)
    List<ReturnRequest> findBySellerUserId(@Param("sellerUserId") String sellerUserId);

    @Query("""
            SELECT r FROM ReturnRequest r
            JOIN FETCH r.order o
            JOIN FETCH r.orderItem oi
            JOIN FETCH r.user u
            WHERE r.id = :id
            """)
    Optional<ReturnRequest> findByIdWithDetails(@Param("id") String id);

    boolean existsByOrderItem_IdAndStatusNot(String orderItemId, ReturnStatus status);
}
