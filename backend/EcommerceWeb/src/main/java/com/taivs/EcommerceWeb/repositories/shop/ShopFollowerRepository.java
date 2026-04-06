package com.taivs.EcommerceWeb.repositories.shop;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.shop.ShopFollower;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShopFollowerRepository extends JpaRepository<ShopFollower, String> {

    @Query("""
            select sf from ShopFollower sf
            join fetch sf.shop s
            where sf.user.id = :userId
            order by sf.createdAt desc
            """)
    List<ShopFollower> findByUserIdOrderByFollowedAtDesc(@Param("userId") String userId);

    @Query("""
            select sf from ShopFollower sf
            where sf.user.id = :userId and sf.shop.id = :shopId
            """)
    Optional<ShopFollower> findByUserIdAndShopId(@Param("userId") String userId, @Param("shopId") String shopId);

    @Query("""
            select count(sf) from ShopFollower sf
            where sf.shop.id = :shopId
            """)
    long countByShopId(@Param("shopId") String shopId);

    @Query("""
            select count(sf) > 0 from ShopFollower sf
            where sf.user.id = :userId and sf.shop.id = :shopId
            """)
    boolean existsByUserIdAndShopId(@Param("userId") String userId, @Param("shopId") String shopId);
}
