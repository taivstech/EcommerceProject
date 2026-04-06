package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.product.CustomerReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CustomerReviewRepository extends JpaRepository<CustomerReview, String> {

    @Query("""
            select cr from CustomerReview cr
            where cr.productVariant.id = :variantId
            order by cr.createdAt desc
            """)
    List<CustomerReview> findByVariantId(@Param("variantId") String variantId);

    @Query("""
            select cr from CustomerReview cr
            join fetch cr.productVariant pv
            join fetch pv.product p
            join fetch cr.user u
            where p.id = :productId
            order by cr.createdAt desc
            """)
    List<CustomerReview> findByProductId(@Param("productId") String productId);

    @Query("""
            select avg(cr.rating)
            from CustomerReview cr
            join cr.productVariant pv
            join pv.product p
            where p.id = :productId
            """)
    Double getAverageRatingByProductId(@Param("productId") String productId);

    @Query("""
            select count(cr)
            from CustomerReview cr
            join cr.productVariant pv
            join pv.product p
            where p.id = :productId
            """)
    long countByProductId(@Param("productId") String productId);
}
