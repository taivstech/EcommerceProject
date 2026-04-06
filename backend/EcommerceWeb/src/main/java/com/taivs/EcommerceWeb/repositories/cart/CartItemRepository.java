package com.taivs.EcommerceWeb.repositories.cart;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.cart.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, String> {
    List<CartItem> findByUser_IdOrderByCreatedAtDesc(String userId);

    @Query("""
            select ci from CartItem ci
            join fetch ci.productVariant pv
            join fetch pv.product p
            join fetch p.shop s
            where ci.user.id = :userId
            order by ci.createdAt desc
            """)
    List<CartItem> findByUserIdWithRelationsOrderByCreatedAtDesc(@Param("userId") String userId);

    Optional<CartItem> findByUser_IdAndProductVariant_Id(String userId, String variantId);

    void deleteByUser_Id(String userId);

    void deleteByUser_IdAndIdIn(String userId, Collection<String> ids);

    @Query("""
            select ci from CartItem ci
            join fetch ci.user u
            join fetch ci.productVariant pv
            join fetch pv.product p
            where ci.createdAt < :threshold
            order by ci.user.id, ci.createdAt desc
            """)
    List<CartItem> findAbandonedCartItems(@Param("threshold") LocalDateTime threshold);
}

