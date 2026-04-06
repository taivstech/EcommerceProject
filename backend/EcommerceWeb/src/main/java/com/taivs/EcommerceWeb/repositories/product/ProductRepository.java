package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.product.Category;
import com.taivs.EcommerceWeb.models.product.CustomerReview;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.product.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.models.order.OrderItem;

public interface ProductRepository extends JpaRepository<Product, String> {

    Optional<Product> findById(String productId);

    @Query("""
        SELECT p.id FROM Product p
        WHERE p.deletedAt IS NULL
    """)
    Page<String> findPublicProductIds(Pageable pageable);

    @Query("""
        SELECT p.id FROM Product p
        WHERE p.deletedAt IS NULL
        AND p.shop.id = :shopId
    """)
    Page<String> findProductIdsByShop(
            @Param("shopId") String shopId,
            Pageable pageable
    );

    @Query("""
SELECT p.id
FROM Product p
WHERE p.deletedAt IS NULL
AND (:categoryId IS NULL OR p.category.id = :categoryId)
AND (:shopId IS NULL OR p.shop.id = :shopId)
AND (:keyword IS NULL OR :keyword = ''
     OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
AND (:minPrice IS NULL OR p.minPrice >= :minPrice)
AND (:maxPrice IS NULL OR p.maxPrice <= :maxPrice)
""")
    Page<String> searchProductIds(
            @Param("categoryId") String categoryId,
            @Param("shopId") String shopId,
            @Param("keyword") String keyword,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable
    );

    @Query("""
        SELECT DISTINCT p FROM Product p
        LEFT JOIN FETCH p.shop
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.images
        WHERE p.id IN :ids
    """)
    List<Product> findAllBasicByIds(@Param("ids") List<String> ids);

    @Query("""
        SELECT DISTINCT p FROM Product p
        LEFT JOIN FETCH p.shop
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.images
        LEFT JOIN FETCH p.variants v
        LEFT JOIN FETCH v.detailAttributes
        LEFT JOIN FETCH p.attributes a
        LEFT JOIN FETCH a.detailAttributes
        WHERE p.id = :id
        AND p.deletedAt IS NULL
    """)
    Optional<Product> findByIdWithAllRelations(@Param("id") String id);

    @Query("""
        SELECT DISTINCT p FROM Product p
        LEFT JOIN FETCH p.shop
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.images
        LEFT JOIN FETCH p.variants v
        LEFT JOIN FETCH v.detailAttributes
        LEFT JOIN FETCH p.attributes a
        LEFT JOIN FETCH a.detailAttributes
        WHERE p.id IN :ids
        AND p.deletedAt IS NULL
    """)
    List<Product> findAllByIdsWithAllRelations(@Param("ids") List<String> ids);

    @Query("""
    SELECT p.id FROM Product p
    WHERE p.deletedAt IS NULL
    ORDER BY p.createdAt DESC
""")
    Page<String> findNewestProductIds(Pageable pageable);

    /**
     * Count active (non-deleted) products for admin dashboard
     */
    @Query("SELECT COUNT(p) FROM Product p WHERE p.deletedAt IS NULL")
    long countActiveProducts();


    @Query("""
    SELECT p.id FROM Product p
    WHERE p.deletedAt IS NULL
    AND p.shop.user.id = :userId
    ORDER BY p.createdAt DESC
""")
    List<String> findMyProductIds(@Param("userId") String userId);

    @Query("""
SELECT p.id FROM Product p
WHERE p.deletedAt IS NULL
ORDER BY p.totalSold DESC
""")
    Page<String> findTopSellingProductIds(Pageable pageable);

    @Query("""
SELECT p.id FROM Product p
WHERE p.deletedAt IS NULL
AND p.shop.id = :shopId
ORDER BY p.totalSold DESC
""")
    Page<String> findTopSellingProductIdsByShop(
            @Param("shopId") String shopId,
            Pageable pageable
    );

    @Query("""
SELECT p.id FROM Product p
WHERE p.deletedAt IS NULL
AND p.category.id = :categoryId
ORDER BY p.totalSold DESC
""")
    Page<String> findTopSellingProductIdsByCategory(
            @Param("categoryId") String categoryId,
            Pageable pageable
    );

    @Query("""
SELECT 
    COALESCE(MIN(v.price), 0),
    COALESCE(MAX(v.price), 0),
    COALESCE(SUM(v.soldCount), 0)
FROM ProductVariant v
WHERE v.product.id = :productId
""")
    Object[] calculateStats(@Param("productId") String productId);

    @Query("""
        SELECT DISTINCT p FROM Product p
        LEFT JOIN FETCH p.images
        LEFT JOIN FETCH p.variants
        WHERE p.shop.id = :shopId
        AND p.deletedAt IS NULL
    """)
    List<Product> findByShopIdWithVariants(@Param("shopId") String shopId);

    @Query("""
        SELECT p.id FROM Product p
        WHERE p.deletedAt IS NULL
        AND p.createdAt >= :createdAfter
        ORDER BY p.totalSold DESC
    """)
    Page<String> findTrendingProductIds(
            @Param("createdAfter") java.time.LocalDateTime createdAfter,
            Pageable pageable
    );

    @Query("""
        SELECT oi2.productId FROM OrderItem oi1
        JOIN OrderItem oi2 ON oi1.orderShopGroup.order.id = oi2.orderShopGroup.order.id
        WHERE oi1.productId = :productId
        AND oi2.productId != :productId
        GROUP BY oi2.productId
        ORDER BY COUNT(oi2.productId) DESC
    """)
    List<String> findFrequentlyBoughtTogetherIds(
            @Param("productId") String productId,
            Pageable pageable
    );

    @Query("SELECT p.id, p.category.id FROM Product p WHERE p.id IN :productIds AND p.deletedAt IS NULL")
    List<Object[]> findCategoryIdsByProductIds(@Param("productIds") List<String> productIds);

    @Query("""
        SELECT DISTINCT oi.productId, p.category.id, osg.shop.id
        FROM OrderItem oi
        JOIN oi.orderShopGroup osg
        JOIN osg.order o
        JOIN Product p ON p.id = oi.productId
        WHERE o.user.id = :userId
        AND o.status IN (com.taivs.EcommerceWeb.enums.order.OrderStatus.COMPLETED,
                         com.taivs.EcommerceWeb.enums.order.OrderStatus.DELIVERED)
        AND p.deletedAt IS NULL
    """)
    List<Object[]> findPurchasedProductDataByUserId(@Param("userId") String userId);

    @Query("""
        SELECT p.id FROM Product p
        WHERE p.category.id IN :categoryIds
        AND p.deletedAt IS NULL
        ORDER BY p.totalSold DESC
    """)
    List<String> findProductIdsByCategoryIds(
            @Param("categoryIds") List<String> categoryIds, Pageable pageable);

    @Query("""
        SELECT p.id FROM Product p
        JOIN ProductVariant pv ON pv.product.id = p.id
        JOIN CustomerReview cr ON cr.productVariant.id = pv.id
        WHERE p.deletedAt IS NULL
        GROUP BY p.id
        HAVING AVG(cr.rating) >= 4.0 AND COUNT(cr) >= 3
        ORDER BY AVG(cr.rating) DESC, COUNT(cr) DESC
    """)
    List<String> findTopRatedProductIds(Pageable pageable);

    @Query("SELECT p.id FROM Product p WHERE p.deletedAt IS NULL ORDER BY p.totalSold DESC")
    List<String> findTopProductIdsByTotalSold(Pageable pageable);

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.shop
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.images
        WHERE p.category.id = :categoryId
        AND p.id != :excludeId
        AND p.deletedAt IS NULL
        ORDER BY p.totalSold DESC
    """)
    List<Product> findByCategoryIdAndIdNot(
            @Param("categoryId") String categoryId,
            @Param("excludeId") String excludeId,
            Pageable pageable);

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.shop
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.images
        WHERE p.deletedAt IS NULL
        ORDER BY p.totalSold DESC
    """)
    List<Product> findTopByTotalSold(Pageable pageable);
}
