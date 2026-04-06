package com.taivs.EcommerceWeb.repositories.promotion;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.promotion.Coupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Coupon c where c.code = :code")
    Optional<Coupon> findByCodeForUpdate(@Param("code") String code);


    @Query("""
            select c from Coupon c
            where c.isActive = true
            and c.validFrom <= :now
            and c.validTo >= :now
            and (c.maxUsage is null or c.currentUsage < c.maxUsage)
            and c.shop is null
            """)
    List<Coupon> findActivePlatformCoupons(@Param("now") LocalDateTime now);

    @Query("""
            select c from Coupon c
            where c.isActive = true
            and c.validFrom <= :now
            and c.validTo >= :now
            and (c.maxUsage is null or c.currentUsage < c.maxUsage)
            and c.shop.id = :shopId
            """)
    List<Coupon> findActiveShopCoupons(@Param("shopId") String shopId, @Param("now") LocalDateTime now);

    @Query("select c from Coupon c where c.shop.id = :shopId order by c.createdAt desc")
    List<Coupon> findByShopId(@Param("shopId") String shopId);

    Optional<Coupon> findByCode(String code);

    @Modifying
    @Query("""
       update Coupon c
       set c.currentUsage = c.currentUsage + 1
       where c.id = :id
       """)
    void incrementUsage(@Param("id") String id);

    @Modifying
    @Query("""
       update Coupon c
       set c.isActive = false
       where c.id = :id
         and c.maxUsage is not null
         and c.currentUsage >= c.maxUsage
       """)
    void deactivateIfMaxUsageReached(@Param("id") String id);

}
