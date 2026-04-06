package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.product.ProductVariantImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariantImageRepository extends JpaRepository<ProductVariantImage, String> {

    List<ProductVariantImage> findByVariantId(String variantId);

    @Modifying
    @Query("UPDATE ProductVariantImage i SET i.isMain = false WHERE i.variant.id = :variantId")
    void clearMainFlags(@Param("variantId") String variantId);
}
