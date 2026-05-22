package com.taivs.EcommerceWeb.controllers.product;

import com.taivs.EcommerceWeb.models.product.Category;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.dto.response.product.ProductResponse;
import com.taivs.EcommerceWeb.services.product.ProductService;
import com.taivs.EcommerceWeb.services.product.RecentlyViewedService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

        private final ProductService productService;
        private final RecentlyViewedService recentlyViewedService;

        @GetMapping("/top-selling")
        public ApiResponse<Page<ProductResponse>> topSelling(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {

                return ApiResponse.<Page<ProductResponse>>builder()
                                .result(productService.getTopSellingProducts(page, size))
                                .build();
        }

        @GetMapping("/shop/{shopId}/top-selling")
        public ApiResponse<Page<ProductResponse>> topSellingByShop(
                        @PathVariable String shopId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {

                return ApiResponse.<Page<ProductResponse>>builder()
                                .result(productService.getTopSellingProductsByShop(shopId, page, size))
                                .build();
        }

        @GetMapping("/category/{categoryId}/top-selling")
        public ApiResponse<Page<ProductResponse>> topSellingByCategory(
                        @PathVariable String categoryId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int size) {

                return ApiResponse.<Page<ProductResponse>>builder()
                                .result(productService.getTopSellingProductsByCategory(categoryId, page, size))
                                .build();
        }

        @GetMapping
        public ApiResponse<Page<ProductResponse>> listPublic(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                return ApiResponse.<Page<ProductResponse>>builder()
                                .result(productService.getPublicProducts(page, size))
                                .build();
        }

        @GetMapping("/{id}")
        public ApiResponse<ProductResponse> getById(
                        @PathVariable String id) {

                return ApiResponse.<ProductResponse>builder()
                                .result(productService.getById(id))
                                .build();
        }

        @GetMapping("/search")
        public ApiResponse<Page<ProductResponse>> search(
                        @RequestParam(required = false) String keyword,
                        @RequestParam(required = false) String categoryId,
                        @RequestParam(required = false) String shopId,
                        @RequestParam(required = false) BigDecimal minPrice,
                        @RequestParam(required = false) BigDecimal maxPrice,
                        @RequestParam(required = false) Double minRating,
                        @RequestParam(required = false) String brand,
                        @RequestParam(defaultValue = "createdAt") String sortBy,
                        @RequestParam(defaultValue = "desc") String sortDir,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                return ApiResponse.<Page<ProductResponse>>builder()
                                .result(
                                                productService.searchProducts(
                                                                keyword,
                                                                categoryId,
                                                                shopId,
                                                                minPrice,
                                                                maxPrice,
                                                                minRating,
                                                                brand,
                                                                sortBy,
                                                                sortDir,
                                                                page,
                                                                size))
                                .build();
        }

        @GetMapping("/newest")
        public ApiResponse<List<ProductResponse>> getNewest(
                        @RequestParam(defaultValue = "10") int limit) {

                return ApiResponse.<List<ProductResponse>>builder()
                                .result(productService.getNewestProducts(limit))
                                .build();
        }

        @GetMapping("/brands")
        public ApiResponse<List<String>> getBrands() {
                return ApiResponse.<List<String>>builder()
                                .result(productService.getBrands())
                                .build();
        }

        @GetMapping("/shop/{shopId}")
        public ApiResponse<Page<ProductResponse>> getByShop(
                        @PathVariable String shopId,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                return ApiResponse.<Page<ProductResponse>>builder()
                                .result(productService.getProductsByShop(shopId, page, size))
                                .build();
        }

        @PostMapping("/{id}/view")
        @PreAuthorize("isAuthenticated()")
        public ApiResponse<Void> trackView(@PathVariable String id) {
                recentlyViewedService.trackView(id);
                return ApiResponse.<Void>builder().build();
        }

        @GetMapping("/recently-viewed")
        @PreAuthorize("isAuthenticated()")
        public ApiResponse<List<String>> recentlyViewed() {
                return ApiResponse.<List<String>>builder()
                                .result(recentlyViewedService.getRecentlyViewedProductIds())
                                .build();
        }
}
