package com.taivs.EcommerceWeb.repositories.shop;

import com.taivs.EcommerceWeb.mappers.shop.ShopMapper;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.shop.ShopAddress;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.shop.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShopRepository extends JpaRepository<Shop, String> {
    Optional<Shop> findByUser_Id(String userId);

    @Query("""
            select s from Shop s
            left join fetch s.user u
            left join fetch s.approvedBy ab
            left join fetch s.shopAddress sa
            where u.id = :userId
            """)
    Optional<Shop> findByUserIdWithRelations(@Param("userId") String userId);

    @Query("""
            select s from Shop s
            left join fetch s.user u
            left join fetch s.approvedBy ab
            left join fetch s.shopAddress sa
            where s.id = :id
            """)
    Optional<Shop> findByIdWithRelations(@Param("id") String id);

    @Query("""
            select distinct s from Shop s
            left join fetch s.user u
            left join fetch s.approvedBy ab
            left join fetch s.shopAddress sa
            """)
    List<Shop> findAllWithRelations();

    List<Shop> findByIdIn(List<String> ids);

    List<Shop> findByShopAddress_ProvinceId(String provinceId);

    @Query("""
            SELECT s FROM Shop s
            LEFT JOIN FETCH s.shopAddress sa
            WHERE UPPER(s.status) = 'APPROVED'
              AND LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            ORDER BY s.name
            """)
    List<Shop> searchByName(@Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);

    @Query("""
            SELECT DISTINCT sa.province FROM Shop s
            JOIN s.shopAddress sa
            WHERE UPPER(s.status) = 'APPROVED'
              AND sa.province IS NOT NULL
            ORDER BY sa.province
            """)
    List<String> findDistinctProvinces();

    /**
     * Count shops by status for admin dashboard
     */
    @Query("SELECT COUNT(s) FROM Shop s WHERE UPPER(s.status) = UPPER(:status)")
    long countByStatus(@Param("status") String status);

    /**
     * Find all shops with pagination and eager loading
     */
    @Query(value = "SELECT s.id FROM Shop s ORDER BY s.createdAt DESC",
           countQuery = "SELECT COUNT(s) FROM Shop s")
    org.springframework.data.domain.Page<String> findAllShopIds(org.springframework.data.domain.Pageable pageable);

    /**
     * Find shops by status with pagination
     */
    @Query(value = "SELECT s.id FROM Shop s WHERE UPPER(s.status) = UPPER(:status) ORDER BY s.createdAt DESC",
           countQuery = "SELECT COUNT(s) FROM Shop s WHERE UPPER(s.status) = UPPER(:status)")
    org.springframework.data.domain.Page<String> findShopIdsByStatus(@Param("status") String status, org.springframework.data.domain.Pageable pageable);
}

