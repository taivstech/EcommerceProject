package com.taivs.EcommerceWeb.controllers.product;

import com.taivs.EcommerceWeb.dto.request.product.CategoryRequest;
import com.taivs.EcommerceWeb.dto.response.product.CategoryResponse;
import com.taivs.EcommerceWeb.services.product.CategoryService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryResponse>> getAll() {
        return ApiResponse.<List<CategoryResponse>>builder()
                .result(categoryService.getAll())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CategoryResponse> getById(@PathVariable String id) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.getById(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('category:manage') or hasRole('ADMIN')")
    public ApiResponse<CategoryResponse> create(@RequestBody @Valid CategoryRequest request) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('category:manage') or hasRole('ADMIN')")
    public ApiResponse<CategoryResponse> update(@PathVariable String id, @RequestBody @Valid CategoryRequest request) {
        return ApiResponse.<CategoryResponse>builder()
                .result(categoryService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('category:manage') or hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable String id) {
        categoryService.delete(id);
        return ApiResponse.<Void>builder().build();
    }
}

