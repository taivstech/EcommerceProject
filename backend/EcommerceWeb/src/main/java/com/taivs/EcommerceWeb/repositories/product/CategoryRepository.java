package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.product.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, String> {
    Optional<Category> findByName(String name);
}

