package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {

    List<ProductVariant> findByProduct_Id(String productId);

    @Query("""
            select distinct pv from ProductVariant pv
            join fetch pv.product p
            left join fetch pv.detailAttributes da
            where p.id in :productIds
            """)
    List<ProductVariant> findByProductIdsWithProductAndDetailAttributes(
            @Param("productIds") List<String> productIds
    );

    @Query("""
            select distinct pv from ProductVariant pv
            join fetch pv.product p
            left join fetch p.images
            where pv.id in :variantIds
            """)
    List<ProductVariant> findByIdsWithProductAndImages(
            @Param("variantIds") Collection<String> variantIds
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select pv from ProductVariant pv
            where pv.id in :ids
            """)
    List<ProductVariant> findByIdsForUpdate(
            @Param("ids") Set<String> ids
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select distinct pv from ProductVariant pv
            join fetch pv.product p
            left join fetch p.images
            where pv.id in :ids
            """)
    List<ProductVariant> findByIdsForUpdateWithProduct(
            @Param("ids") Set<String> ids
    );
}
