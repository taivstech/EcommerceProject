package com.taivs.EcommerceWeb.services.product;

import com.taivs.EcommerceWeb.dto.request.product.CategoryRequest;
import com.taivs.EcommerceWeb.dto.response.product.CategoryResponse;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> getAll();

    CategoryResponse getById(String id);

    CategoryResponse create(CategoryRequest request);

    CategoryResponse update(String id, CategoryRequest request);

    void delete(String id);
}
