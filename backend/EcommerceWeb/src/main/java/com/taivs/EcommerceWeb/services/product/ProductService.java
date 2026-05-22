package com.taivs.EcommerceWeb.services.product;

import com.taivs.EcommerceWeb.dto.request.product.ProductCreateRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.product.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    Page<ProductResponse> getPublicProducts(int page, int size);

    Page<ProductResponse> searchProducts(
            String keyword,
            String categoryId,
            String shopId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double minRating,
            String brand,
            String sortBy,
            String sortDir,
            int page,
            int size
    );

    ProductResponse getById(String id);

    Page<ProductResponse> getTopSellingProducts(int page, int size);

    Page<ProductResponse> getTopSellingProductsByShop(String shopId, int page, int size);

    Page<ProductResponse> getTopSellingProductsByCategory(String categoryId, int page, int size);

    List<ProductResponse> getNewestProducts(int limit);

    Page<ProductResponse> getProductsByShop(String shopId, int page, int size);

    List<ProductResponse> getTrendingProducts(int days, int limit);

    List<ProductResponse> getFrequentlyBoughtTogether(String productId, int limit);

    Page<ProductResponse> getMyProducts(int page, int size);

    ProductResponse createBySeller(
            ProductCreateRequest request,
            MultipartFile[] files
    );

    ProductResponse updateBySeller(
            String productId,
            ProductUpdateRequest request,
            MultipartFile[] newFiles
    );

    void softDeleteBySeller(String productId);

    void recalculateProductStats(String productId);

    List<String> getBrands();
}
