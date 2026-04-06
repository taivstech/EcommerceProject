package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.services.product.ProductSearchService;
import com.taivs.EcommerceWeb.models.product.Category;
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
import com.taivs.EcommerceWeb.utils.RedisCacheHelper;
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

        Page<String> idPage =
                productRepository.findProductIdsByShop(
                        shop.getId(),
                        pageable
                );

        return mapIdPage(idPage, pageable);
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

        Product product = productMapper.toEntity(request);
        product.setShop(shop);

        attachCategory(product, request.getCategoryId());
        attachImages(product, files);
        attachAttributes(product, request.getAttributes());
        attachVariants(product, request.getVariants(), request.getAttributes());

        product.setMinPrice(BigDecimal.ZERO);
        product.setMaxPrice(BigDecimal.ZERO);
        product.setTotalSold(0L);

        Product saved = productRepository.save(product);

        recalculateProductStats(saved.getId());
        saved = productRepository.findById(saved.getId()).orElse(saved);
        productSearchService.indexProduct(saved.getId());

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

        if (hasNewAttributes) {
            attachAttributes(product, request.getAttributes());
        }

        if (hasNewVariants) {
            List<ProductAttributeRequest> attributesForVariants = request.getAttributes();
            attachVariants(product, request.getVariants(), attributesForVariants);
        }

        Product saved = productRepository.saveAndFlush(product);

        recalculateProductStats(saved.getId());
        saved = productRepository.findByIdWithAllRelations(productId).orElse(saved);

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
                                p -> p
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

    private String resolveSortField(String sortBy) {

        if (sortBy == null) return "createdAt";

        return switch (sortBy.toLowerCase()) {
            case "price" -> "minPrice";
            case "name" -> "name";
            case "sold" -> "totalSold";
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

    private void attachAttributes(Product product, List<ProductAttributeRequest> attributeRequests) {

        if (attributeRequests == null || attributeRequests.isEmpty()) return;

        for (int attrIndex = 0; attrIndex < attributeRequests.size(); attrIndex++) {
            ProductAttributeRequest attrReq = attributeRequests.get(attrIndex);
            if (attrReq == null || attrReq.getName() == null || attrReq.getName().trim().isEmpty()) {
                continue;
            }

            ProductAttribute productAttribute = ProductAttribute.builder()
                    .name(attrReq.getName().trim())
                    .status("ACTIVE")
                    .sortOrder(attrIndex)
                    .product(product)
                    .build();

            if (attrReq.getOptions() != null && !attrReq.getOptions().isEmpty()) {
                for (int optIndex = 0; optIndex < attrReq.getOptions().size(); optIndex++) {
                    DetailAttributeOptionRequest optReq = attrReq.getOptions().get(optIndex);
                    if (optReq == null || optReq.getName() == null || optReq.getName().trim().isEmpty()) {
                        continue;
                    }

                    DetailAttribute detailAttribute = DetailAttribute.builder()
                            .name(optReq.getName().trim())
                            .imageUrl(optReq.getImageUrl())
                            .status("ACTIVE")
                            .sortOrder(optIndex)
                            .productAttribute(productAttribute)
                            .build();

                    productAttribute.getDetailAttributes().add(detailAttribute);
                }
            }

            product.getAttributes().add(productAttribute);
        }
    }


    private void attachVariants(Product product, List<ProductVariantRequest> variantRequests, 
                                 List<ProductAttributeRequest> attributeRequests) {

        if (variantRequests == null || variantRequests.isEmpty()) {
            return;
        }
        Map<Integer, Map<String, DetailAttribute>> attributeOptionMap = new HashMap<>();

        List<ProductAttribute> sortedAttributes = product.getAttributes().stream()
                .sorted(Comparator.comparingInt(a -> a.getSortOrder() != null ? a.getSortOrder() : 0))
                .toList();

        if (!sortedAttributes.isEmpty()) {
            for (int attrIndex = 0; attrIndex < sortedAttributes.size(); attrIndex++) {
                ProductAttribute attr = sortedAttributes.get(attrIndex);
                Map<String, DetailAttribute> optionMap = new HashMap<>();
                if (attr.getDetailAttributes() != null) {
                    for (DetailAttribute da : attr.getDetailAttributes()) {
                        optionMap.put(da.getName().trim().toLowerCase(), da);
                    }
                }
                attributeOptionMap.put(attrIndex, optionMap);
            }
        } else if (attributeRequests != null) {
            for (int attrIndex = 0; attrIndex < attributeRequests.size(); attrIndex++) {
                ProductAttributeRequest attrReq = attributeRequests.get(attrIndex);
                if (attrReq == null || attrReq.getName() == null) continue;

                final String reqName = attrReq.getName().trim();
                ProductAttribute attr = product.getAttributes().stream()
                        .filter(a -> reqName.equalsIgnoreCase(a.getName()))
                        .findFirst().orElse(null);

                if (attr != null && attr.getDetailAttributes() != null) {
                    Map<String, DetailAttribute> optionMap = new HashMap<>();
                    for (DetailAttribute da : attr.getDetailAttributes()) {
                        optionMap.put(da.getName().trim().toLowerCase(), da);
                    }
                    attributeOptionMap.put(attrIndex, optionMap);
                }
            }
        }

        for (ProductVariantRequest variantReq : variantRequests) {
            if (variantReq == null) continue;

            BigDecimal price = variantReq.getPrice() != null 
                    ? BigDecimal.valueOf(variantReq.getPrice()) 
                    : BigDecimal.ZERO;

            ProductVariant variant = ProductVariant.builder()
                    .name(variantReq.getName())
                    .sku(variantReq.getSku())
                    .price(price)
                    .stock(variantReq.getStock() != null ? variantReq.getStock() : 0L)
                    .soldCount(0L)
                    .status(variantReq.getStatus() != null ? variantReq.getStatus() : "ACTIVE")
                    .imageUrl(resolveMainImageUrl(variantReq))
                    .product(product)
                    .build();

            // Persist variant images (cascade from variant)
            List<String> urls = variantReq.getImageUrls() != null && !variantReq.getImageUrls().isEmpty()
                    ? variantReq.getImageUrls()
                    : (variantReq.getImageUrl() != null ? List.of(variantReq.getImageUrl()) : List.of());
            for (int imgIdx = 0; imgIdx < urls.size(); imgIdx++) {
                String url = urls.get(imgIdx);
                if (url == null || url.isBlank()) continue;
                variant.getImages().add(ProductVariantImage.builder()
                        .url(url)
                        .isMain(imgIdx == 0)
                        .variant(variant)
                        .build());
            }

            if (variantReq.getOptionNames() != null && !variantReq.getOptionNames().isEmpty() 
                    && attributeRequests != null) {
                List<String> optionNames = variantReq.getOptionNames();
                
                for (int i = 0; i < optionNames.size() && i < attributeRequests.size(); i++) {
                    String optionName = optionNames.get(i);
                    if (optionName == null || optionName.trim().isEmpty()) continue;
                    
                    ProductAttributeRequest attrReq = attributeRequests.get(i);
                    if (attrReq == null) continue;
                    
                    String attrName = attrReq.getName();
                    if (attrName == null) continue;

                    String attrNameLower = attrName.trim().toLowerCase();
                    try {
                        BigDecimal value = new BigDecimal(optionName.trim());
                        
                        if (attrNameLower.contains("weight") || attrNameLower.contains("khối lượng")) {
                            variant.setWeight(value);
                        } else if (attrNameLower.contains("length") || attrNameLower.contains("chiều dài") 
                                || attrNameLower.contains("dài")) {
                            variant.setLength(value);
                        } else if (attrNameLower.contains("width") || attrNameLower.contains("chiều rộng") 
                                || attrNameLower.contains("rộng")) {
                            variant.setWidth(value);
                        } else if (attrNameLower.contains("height") || attrNameLower.contains("chiều cao") 
                                || attrNameLower.contains("cao")) {
                            variant.setHeight(value);
                        }
                    } catch (NumberFormatException e) {
                    }
                }
            }

            if (variantReq.getOptionNames() != null && !variantReq.getOptionNames().isEmpty()) {
                List<String> optionNames = variantReq.getOptionNames();
                
                for (int i = 0; i < optionNames.size() && i < attributeOptionMap.size(); i++) {
                    String optionName = optionNames.get(i);
                    if (optionName == null || optionName.trim().isEmpty()) continue;

                    Map<String, DetailAttribute> optionMap = attributeOptionMap.get(i);
                    if (optionMap != null) {
                        DetailAttribute detailAttr = optionMap.get(optionName.trim().toLowerCase());
                        if (detailAttr != null) {
                            variant.getDetailAttributes().add(detailAttr);
                        }
                    }
                }
            }

            product.getVariants().add(variant);
        }
    }

    private String resolveMainImageUrl(ProductVariantRequest req) {
        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            return req.getImageUrls().get(0);
        }
        return req.getImageUrl();
    }

    private void validateOwnership(Product product, Shop shop) {

        if (!product.getShop().getId().equals(shop.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private Shop requireShop() {

        return shopRepository.findByUser_Id(getCurrentUserId())
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

    private String getCurrentUserId() {

        return SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
    }
    @Override
    public Page<ProductResponse> getTopSellingProducts(int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        Page<String> idPage =
                productRepository.findTopSellingProductIds(pageable);

        return mapIdPage(idPage, pageable);
    }
    @Override
    public Page<ProductResponse> getTopSellingProductsByShop(
            String shopId,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size);

        Page<String> idPage =
                productRepository.findTopSellingProductIdsByShop(
                        shopId,
                        pageable
                );

        return mapIdPage(idPage, pageable);
    }
    @Override
    public Page<ProductResponse> getTopSellingProductsByCategory(
            String categoryId,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size);

        Page<String> idPage =
                productRepository.findTopSellingProductIdsByCategory(
                        categoryId,
                        pageable
                );

        return mapIdPage(idPage, pageable);
    }
    @Override
    public List<ProductResponse> getNewestProducts(int limit) {

        Pageable pageable = PageRequest.of(0, limit);

        Page<String> idPage =
                productRepository.findNewestProductIds(pageable);

        return mapIdPage(idPage, pageable).getContent();
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

        Page<String> idPage =
                productRepository.findProductIdsByShop(
                        shopId,
                        pageable
                );

        return mapIdPage(idPage, pageable);
    }

    @Override
    public List<ProductResponse> getTrendingProducts(int days, int limit) {

        Pageable pageable = PageRequest.of(0, limit);

        Page<String> idPage =
                productRepository.findTrendingProductIds(
                        LocalDateTime.now().minusDays(days),
                        pageable
                );

        return mapIdPage(idPage, pageable).getContent();
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

}
