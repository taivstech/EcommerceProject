package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, String> {
    List<ProductImage> findByProduct_Id(String productId);

    @Query("""
            select pi from ProductImage pi
            join fetch pi.product p
            where p.id in :productIds
            """)
    List<ProductImage> findByProductIdsWithProduct(@Param("productIds") List<String> productIds);
}

