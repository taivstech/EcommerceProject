package com.taivs.EcommerceWeb.controllers.product;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.dto.request.product.ProductCreateRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.product.ProductResponse;
import com.taivs.EcommerceWeb.services.product.ProductService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/seller/products")
@RequiredArgsConstructor
public class SellerProductController {
    private final ProductService productService;

    @GetMapping
    @PreAuthorize("hasAuthority('product:view_own') or hasAuthority('product:create') or hasRole('SELLER')")
    public ApiResponse<Page<ProductResponse>> myProducts(@RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "10") int size ) {
        return ApiResponse.<Page<ProductResponse> >builder()
                .result(productService.getMyProducts(page, size))
                .build();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('product:create') or hasRole('SELLER')")
    public ApiResponse<ProductResponse> create(
            @RequestPart("product") @Valid ProductCreateRequest request,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {
        return ApiResponse.<ProductResponse>builder()
                .result(productService.createBySeller(request, files))
                .build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('product:create') or hasRole('SELLER')")
    public ApiResponse<ProductResponse> update(
            @PathVariable("id") String id,
            @RequestPart("product") @Valid ProductUpdateRequest request,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {
        return ApiResponse.<ProductResponse>builder()
                .result(productService.updateBySeller(id, request, files))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('product:create') or hasRole('SELLER')")
    public ApiResponse<Void> softDelete(@PathVariable("id") String id) {
        productService.softDeleteBySeller(id);
        return ApiResponse.<Void>builder().build();
    }
}
