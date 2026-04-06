package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.product.DetailAttribute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetailAttributeRepository extends JpaRepository<DetailAttribute, String> {
    List<DetailAttribute> findByProductAttribute_Id(String productAttributeId);
}

