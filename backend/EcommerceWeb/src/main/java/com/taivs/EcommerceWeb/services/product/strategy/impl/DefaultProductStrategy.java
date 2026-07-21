package com.taivs.EcommerceWeb.services.product.strategy.impl;

import com.taivs.EcommerceWeb.repositories.product.CategoryRepository;
import org.springframework.stereotype.Component;

@Component
public class DefaultProductStrategy extends AbstractProductStrategy {

    public DefaultProductStrategy(CategoryRepository categoryRepository) {
        super(categoryRepository);
    }
}
