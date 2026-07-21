package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.services.product.ProductSearchService;
import com.taivs.EcommerceWeb.models.product.Category;
import com.taivs.EcommerceWeb.services.product.strategy.ProductCategoryStrategyFactory;
import com.taivs.EcommerceWeb.services.product.strategy.ProductCategoryStrategy;
import com.taivs.EcommerceWeb.repositories.product.CategoryRepository;
import com.taivs.EcommerceWeb.services.media.FileStorageService;
import com.taivs.EcommerceWeb.dto.request.product.DetailAttributeOptionRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductAttributeRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductCreateRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductUpdateRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductVariantRequest;
import com.taivs.EcommerceWeb.dto.response.product.ProductResponse;
import com.taivs.EcommerceWeb.models.product.DetailAttribute;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductAttribute;
import com.taivs.EcommerceWeb.models.product.ProductImage;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.product.ProductVariantImage;
import com.taivs.EcommerceWeb.mappers.product.ProductMapper;
import com.taivs.EcommerceWeb.repositories.product.ProductRepository;
import com.taivs.EcommerceWeb.services.product.ProductService;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.utils.AuthUtils;
import com.taivs.EcommerceWeb.utils.RedisCacheHelper;
import com.taivs.EcommerceWeb.utils.CategoryTagMapping;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseRepository;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.repositories.shop.ShopFollowerRepository;
import com.taivs.EcommerceWeb.services.notification.NotificationService;
import com.taivs.EcommerceWeb.models.notification.NotificationType;
import com.taivs.EcommerceWeb.models.shop.ShopFollower;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;
    private final FileStorageService fileStorageService;
    private final ProductSearchService productSearchService;
    private final RedisCacheHelper cacheHelper;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseStockService warehouseStockService;
    private final ProductCategoryStrategyFactory categoryStrategyFactory;
    private final ShopFollowerRepository shopFollowerRepository;
    private final NotificationService notificationService;

    private static final String CACHE_PRODUCT_PREFIX = "product:detail:";
    private static final int CACHE_PRODUCT_TTL = 300;

    @Override
    public Page<ProductResponse> getMyProducts(int page, int size) {

        Shop shop = requireShop();

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Slice<String> idSlice =
                productRepository.findProductIdsByShop(
                        shop.getId(),
                        pageable
                );

        return mapSliceToPage(idSlice, pageable);
    }

    @Override
    @Transactional
    public void softDeleteBySeller(String productId) {

        Shop shop = requireShop();

        Product product =
                productRepository.findById(productId)
                        .orElseThrow(() ->
                                new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        validateOwnership(product, shop);

        product.setDeletedAt(LocalDateTime.now());

        cacheHelper.deleteCache(CACHE_PRODUCT_PREFIX + productId);

        productSearchService.removeProduct(productId);
    }


    @Override
    public Page<ProductResponse> getPublicProducts(int page, int size) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<String> idPage = productRepository.findPublicProductIds(pageable);

        return mapIdPage(idPage, pageable);
    }

    @Override
    public Page<ProductResponse> searchProducts(
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
            int size) {

        Sort.Direction direction =
                "asc".equalsIgnoreCase(sortDir)
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        String sortField = resolveSortField(sortBy);

        Pageable pageable =
                PageRequest.of(page, size, Sort.by(direction, sortField));

        Page<String> idPage =
                productRepository.searchProductIds(
                        categoryId,
                        shopId,
                        keyword,
                        minPrice,
                        maxPrice,
                        minRating,
                        brand,
                        pageable
                );

        return mapIdPage(idPage, pageable);
    }

    @Override
    public ProductResponse getById(String id) {
        String cacheKey = CACHE_PRODUCT_PREFIX + id;
        ProductResponse cached = cacheHelper.getFromCache(cacheKey, ProductResponse.class);
        if (cached != null) {
            return cached;
        }

        Product product =
                productRepository.findByIdWithAllRelations(id)
                        .orElseThrow(() ->
                                new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (!product.isPublished()) {
            try {
                Shop shop = requireShop();
                if (!product.getShop().getId().equals(shop.getId())) {
                    throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
                }
            } catch (Exception e) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }
        }

        ProductResponse response = productMapper.toResponse(product);

        cacheHelper.saveToCache(cacheKey, response, CACHE_PRODUCT_TTL);

        return response;
    }

    @Override
    @Transactional
    public ProductResponse createBySeller(
            ProductCreateRequest request,
            MultipartFile[] files) {

        Shop shop = requireApprovedShop();

        ProductCategoryStrategy strategy;
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            strategy = categoryStrategyFactory.getStrategy(category.getName());
        } else {
            strategy = categoryStrategyFactory.getStrategy(null);
        }
        
        strategy.validate(request);

        Product product = productMapper.toEntity(request);
        product.setShop(shop);
        product.setDraft(true);
        product.setPublished(false);

        attachCategory(product, request.getCategoryId());
        attachImages(product, files);
        
        strategy.enrichProductData(product, request);
        strategy.processVariants(product, request);
        strategy.processTags(product, request.getTags(), request.getCategoryId());

        product.setMinPrice(BigDecimal.ZERO);
        product.setMaxPrice(BigDecimal.ZERO);
        product.setTotalSold(0L);

        Product saved = productRepository.save(product);

        recalculateProductStats(saved.getId());
        saved = productRepository.findById(saved.getId()).orElse(saved);
        
        // Sync variant stocks to the warehouse
        syncVariantsStockToWarehouse(shop, saved.getVariants());

        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse updateBySeller(
            String productId,
            ProductUpdateRequest request,
            MultipartFile[] newFiles) {

        Shop shop = requireApprovedShop();

        Product product =
                productRepository.findById(productId)
                        .orElseThrow(() ->
                                new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        validateOwnership(product, shop);

        ProductCategoryStrategy strategy;
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            strategy = categoryStrategyFactory.getStrategy(category.getName());
        } else if (product.getCategory() != null) {
            strategy = categoryStrategyFactory.getStrategy(product.getCategory().getName());
        } else {
            strategy = categoryStrategyFactory.getStrategy(null);
        }

        strategy.validate(toCreateRequest(request));

        productMapper.updateEntity(product, request);

        attachCategory(product, request.getCategoryId());

        if (newFiles != null && newFiles.length > 0) {
            product.getImages().clear();
            attachImages(product, newFiles);
        }

        boolean hasNewAttributes = request.getAttributes() != null;
        boolean hasNewVariants = request.getVariants() != null;

        if (hasNewVariants) {
            product.getVariants().clear();
        }
        if (hasNewAttributes) {
            product.getAttributes().clear();
        }

        if (hasNewAttributes || hasNewVariants) {
            productRepository.flush();
        }
        
        ProductCreateRequest dummyReq = toCreateRequest(request);

        if (hasNewAttributes) {
            strategy.enrichProductData(product, dummyReq); // wait, this attaches tags too, so we'll handle tags separately below
        }

        if (hasNewVariants) {
            strategy.processVariants(product, dummyReq);
        }

        // Update tags if seller provided them (null = keep existing; [] = clear)
        if (request.getTags() != null) {
            product.getTags().clear();
            strategy.processTags(product, request.getTags(), request.getCategoryId());
        }

        Product saved = productRepository.saveAndFlush(product);

        recalculateProductStats(saved.getId());
        saved = productRepository.findByIdWithAllRelations(productId).orElse(saved);

        // Sync variant stocks to the warehouse
        syncVariantsStockToWarehouse(shop, saved.getVariants());

        cacheHelper.deleteCache(CACHE_PRODUCT_PREFIX + saved.getId());
        productSearchService.indexProduct(saved.getId());

        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void recalculateProductStats(String productId) {

        Object[] rawStats = productRepository.calculateStats(productId);

        Product product =
                productRepository.findById(productId)
                        .orElseThrow(() ->
                                new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        Object[] stats = rawStats;
        if (rawStats != null && rawStats.length > 0 && rawStats[0] instanceof Object[]) {
            stats = (Object[]) rawStats[0];
        }

        BigDecimal min = toBigDecimal(stats[0]);
        BigDecimal max = toBigDecimal(stats[1]);
        Long totalSold = stats[2] instanceof Number
                ? ((Number) stats[2]).longValue() : 0L;

        product.setMinPrice(min);
        product.setMaxPrice(max);
        product.setTotalSold(totalSold);

        cacheHelper.deleteCache(CACHE_PRODUCT_PREFIX + productId);
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof BigDecimal) return (BigDecimal) val;
        if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
        return BigDecimal.ZERO;
    }

    private Page<ProductResponse> mapIdPage(
            Page<String> idPage,
            Pageable pageable) {

        if (idPage.isEmpty()) {
            return Page.empty(pageable);
        }

        List<Product> products =
                productRepository.findAllByIdsWithAllRelations(idPage.getContent());

        Map<String, Product> map =
                products.stream()
                        .collect(Collectors.toMap(
                                Product::getId,
                                p -> p,
                                (existing, replacement) -> existing
                        ));

        List<ProductResponse> responses =
                idPage.getContent().stream()
                        .map(map::get)
                        .filter(Objects::nonNull)
                        .map(productMapper::toResponse)
                        .toList();

        return new PageImpl<>(
                responses,
                pageable,
                idPage.getTotalElements()
        );
    }

    /** Slice-aware variant — no COUNT query, total reported as slice size (conservative). */
    private Page<ProductResponse> mapSliceToPage(
            Slice<String> idSlice,
            Pageable pageable) {

        if (!idSlice.hasContent()) {
            return Page.empty(pageable);
        }

        List<Product> products =
                productRepository.findAllByIdsWithAllRelations(idSlice.getContent());

        Map<String, Product> map =
                products.stream()
                        .collect(Collectors.toMap(Product::getId, p -> p, (existing, replacement) -> existing));

        List<ProductResponse> responses =
                idSlice.getContent().stream()
                        .map(map::get)
                        .filter(Objects::nonNull)
                        .map(productMapper::toResponse)
                        .toList();

        // We don't know the real total without a COUNT, so we signal
        // "at least this many" so the frontend can show a next-page button
        // when hasNext() is true.
        long estimatedTotal = idSlice.hasNext()
                ? (long) pageable.getOffset() + pageable.getPageSize() + 1
                : pageable.getOffset() + responses.size();

        return new PageImpl<>(responses, pageable, estimatedTotal);
    }

    private String resolveSortField(String sortBy) {

        if (sortBy == null) return "createdAt";

        return switch (sortBy.toLowerCase()) {
            case "price" -> "minPrice";
            case "name" -> "name";
            case "sold", "best_selling" -> "totalSold";
            case "rating", "top_rated" -> "avgRating";
            case "newest" -> "createdAt";
            default -> "createdAt";
        };
    }

    private void attachCategory(Product product, String categoryId) {

        if (categoryId == null) return;

        Category category =
                categoryRepository.findById(categoryId)
                        .orElseThrow(() ->
                                new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        product.setCategory(category);
    }

    private ProductCreateRequest toCreateRequest(ProductUpdateRequest req) {
        return ProductCreateRequest.builder()
                .name(req.getName())
                .brand(req.getBrand())
                .description(req.getDescription())
                .price(req.getPrice())
                .categoryId(req.getCategoryId())
                .weight(req.getWeight())
                .length(req.getLength())
                .width(req.getWidth())
                .height(req.getHeight())
                .attributes(req.getAttributes())
                .variants(req.getVariants())
                .tags(req.getTags())
                .build();
    }



    private void attachImages(Product product, MultipartFile[] files) {

        if (files == null || files.length == 0) return;

        List<String> urls =
                fileStorageService.uploadMultiple(files, "/products");

        for (int i = 0; i < urls.size(); i++) {

            product.getImages().add(
                    ProductImage.builder()
                            .url(urls.get(i))
                            .isMain(i == 0)
                            .product(product)
                            .build()
            );
        }
    }



    private void validateOwnership(Product product, Shop shop) {

        if (!product.getShop().getId().equals(shop.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private Shop requireShop() {

        return shopRepository.findByUser_Id(AuthUtils.currentUserId())
                .orElseThrow(() ->
                        new AppException(ErrorCode.SHOP_NOT_EXISTS));
    }

    private Shop requireApprovedShop() {

        Shop shop = requireShop();

        if (!"APPROVED".equalsIgnoreCase(shop.getStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        return shop;
    }

    @Override
    public Page<ProductResponse> getTopSellingProducts(int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        Slice<String> idSlice =
                productRepository.findTopSellingProductIds(pageable);

        return mapSliceToPage(idSlice, pageable);
    }
    @Override
    public Page<ProductResponse> getTopSellingProductsByShop(
            String shopId,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size);

        Slice<String> idSlice =
                productRepository.findTopSellingProductIdsByShop(
                        shopId,
                        pageable
                );

        return mapSliceToPage(idSlice, pageable);
    }
    @Override
    public Page<ProductResponse> getTopSellingProductsByCategory(
            String categoryId,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size);

        Slice<String> idSlice =
                productRepository.findTopSellingProductIdsByCategory(
                        categoryId,
                        pageable
                );

        return mapSliceToPage(idSlice, pageable);
    }
    @Override
    public List<ProductResponse> getNewestProducts(int limit) {

        Pageable pageable = PageRequest.of(0, limit);

        Slice<String> idSlice =
                productRepository.findNewestProductIds(pageable);

        return idSlice.getContent().isEmpty() ? List.of() :
                productRepository.findAllByIdsWithAllRelations(idSlice.getContent())
                        .stream().map(productMapper::toResponse).toList();
    }
    @Override
    public Page<ProductResponse> getProductsByShop(
            String shopId,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Slice<String> idSlice =
                productRepository.findProductIdsByShop(
                        shopId,
                        pageable
                );

        return mapSliceToPage(idSlice, pageable);
    }

    @Override
    public List<ProductResponse> getTrendingProducts(int days, int limit) {

        Pageable pageable = PageRequest.of(0, limit);

        Slice<String> idSlice =
                productRepository.findTrendingProductIds(
                        LocalDateTime.now().minusDays(days),
                        pageable
                );

        return idSlice.getContent().isEmpty() ? List.of() :
                productRepository.findAllByIdsWithAllRelations(idSlice.getContent())
                        .stream().map(productMapper::toResponse).toList();
    }

    @Override
    public List<ProductResponse> getFrequentlyBoughtTogether(String productId, int limit) {

        Pageable pageable = PageRequest.of(0, limit);

        List<String> frequentIds =
                productRepository.findFrequentlyBoughtTogetherIds(productId, pageable);

        List<Product> products =
                productRepository.findAllByIdsWithAllRelations(frequentIds);

        return products.stream()
                .map(productMapper::toResponse)
                .toList();
    }

    private void syncVariantsStockToWarehouse(Shop shop, Collection<ProductVariant> variants) {
        if (variants == null || variants.isEmpty()) {
            return;
        }
        
        Warehouse defaultWarehouse = warehouseRepository.findDefaultByShopId(shop.getId())
                .or(() -> warehouseRepository.findActiveByShopId(shop.getId()).stream().findFirst())
                .orElse(null);

        if (defaultWarehouse != null) {
            log.info("Syncing {} variants stock to warehouse {} for shop {}", 
                    variants.size(), defaultWarehouse.getName(), shop.getId());
            for (ProductVariant v : variants) {
                try {
                    warehouseStockService.updateStockQuantity(
                            defaultWarehouse.getId(), 
                            v.getId(), 
                            v.getStock() != null ? v.getStock() : 0L
                    );
                } catch (Exception e) {
                    log.error("Failed to sync stock for variant {} to warehouse: {}", v.getId(), e.getMessage());
                }
            }
        } else {
            log.warn("No active or default warehouse found for shop {}, cannot sync variant stocks", shop.getId());
        }
    }

    @Override
    public List<String> getBrands() {
        return productRepository.findDistinctBrands();
    }

    @Override
    public Page<ProductResponse> getMyDraftProducts(int page, int size) {
        Shop shop = requireShop();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Slice<String> idSlice = productRepository.findDraftProductIdsByShop(shop.getId(), pageable);
        return mapSliceToPage(idSlice, pageable);
    }

    @Override
    public Page<ProductResponse> getMyPublishedProducts(int page, int size) {
        Shop shop = requireShop();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Slice<String> idSlice = productRepository.findPublishedProductIdsByShop(shop.getId(), pageable);
        return mapSliceToPage(idSlice, pageable);
    }

    @Override
    @Transactional
    public void publishProductBySeller(String productId) {
        Shop shop = requireApprovedShop();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        validateOwnership(product, shop);

        product.setDraft(false);
        product.setPublished(true);
        Product saved = productRepository.save(product);

        cacheHelper.deleteCache(CACHE_PRODUCT_PREFIX + productId);
        productSearchService.indexProduct(productId);

        try {
            List<ShopFollower> followers = shopFollowerRepository.findByShopId(shop.getId());
            for (ShopFollower follower : followers) {
                notificationService.createAndPush(
                        follower.getUser().getId(),
                        NotificationType.SHOP_ADD_PRODUCT.getCode(),
                        Map.of("shopName", shop.getName(), "productName", saved.getName()),
                        saved.getId(),
                        "PRODUCT"
                );
            }
        } catch (Exception e) {
            log.error("Failed to notify followers for published product {}: {}", saved.getId(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public void unpublishProductBySeller(String productId) {
        Shop shop = requireApprovedShop();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        validateOwnership(product, shop);

        product.setDraft(true);
        product.setPublished(false);
        productRepository.save(product);

        cacheHelper.deleteCache(CACHE_PRODUCT_PREFIX + productId);
        productSearchService.indexProduct(productId);
    }
}
