package com.taivs.EcommerceWeb.services.product.strategy;

import com.taivs.EcommerceWeb.dto.request.product.DetailAttributeOptionRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductAttributeRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductCreateRequest;
import com.taivs.EcommerceWeb.dto.request.product.ProductVariantRequest;
import com.taivs.EcommerceWeb.models.product.DetailAttribute;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductAttribute;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.models.product.ProductVariantImage;
import com.taivs.EcommerceWeb.repositories.product.CategoryRepository;
import com.taivs.EcommerceWeb.utils.CategoryTagMapping;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@RequiredArgsConstructor
public abstract class AbstractProductStrategy implements ProductCategoryStrategy {

    protected final CategoryRepository categoryRepository;

    @Override
    public void validate(ProductCreateRequest request) {
        // Base validation logic if needed
    }

    @Override
    public void enrichProductData(Product product, ProductCreateRequest request) {
        attachAttributes(product, request.getAttributes());
    }

    @Override
    public void processVariants(Product product, ProductCreateRequest request) {
        attachVariants(product, request.getVariants(), request.getAttributes());
    }

    @Override
    public void processTags(Product product, List<String> tags, String categoryId) {
        attachTags(product, tags, categoryId);
    }

    protected void attachAttributes(Product product, List<ProductAttributeRequest> attributeRequests) {
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

    protected void attachVariants(Product product, List<ProductVariantRequest> variantRequests,
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
                        // ignore
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

    protected void attachTags(Product product, List<String> sellerTags, String categoryId) {
        Set<String> merged = new java.util.LinkedHashSet<>();

        if (categoryId != null) {
            CategoryTagMapping.getTagsForCategory(categoryId, categoryRepository)
                    .forEach(t -> merged.add(t.toLowerCase().trim()));
        }

        if (sellerTags != null) {
            sellerTags.stream()
                    .filter(t -> t != null && !t.isBlank())
                    .map(t -> t.toLowerCase().trim())
                    .filter(t -> t.length() <= 100)
                    .forEach(merged::add);
        }

        List<String> final_tags = merged.stream().limit(15).toList();
        product.getTags().clear();
        product.getTags().addAll(final_tags);
    }

    protected String resolveMainImageUrl(ProductVariantRequest req) {
        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            return req.getImageUrls().get(0);
        }
        return req.getImageUrl();
    }
}
