package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, String> {
    List<ProductAttribute> findByProduct_Id(String productId);
    @Query("""
            select distinct pa from ProductAttribute pa
            join fetch pa.product p
            left join fetch pa.detailAttributes da
            where p.id in :productIds
            order by pa.sortOrder, da.sortOrder
            """)
    List<ProductAttribute> findByProductIdsWithDetailAttributes(@Param("productIds") List<String> productIds);
}
