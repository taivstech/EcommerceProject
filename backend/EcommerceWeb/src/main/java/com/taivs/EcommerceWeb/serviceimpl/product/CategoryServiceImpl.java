package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.dto.request.product.CategoryRequest;
import com.taivs.EcommerceWeb.dto.response.product.CategoryResponse;
import com.taivs.EcommerceWeb.models.product.Category;
import com.taivs.EcommerceWeb.mappers.product.CategoryMapper;
import com.taivs.EcommerceWeb.repositories.product.CategoryRepository;
import com.taivs.EcommerceWeb.services.product.CategoryService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.utils.RedisCacheHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final RedisCacheHelper cacheHelper;

    private static final String CACHE_ALL_CATEGORIES = "categories:all";
    private static final String CACHE_CATEGORY_PREFIX = "categories:";
    private static final int CACHE_TTL = 3600;

    @Override
    public List<CategoryResponse> getAll() {
        List<CategoryResponse> cached = cacheHelper.getListFromCache(CACHE_ALL_CATEGORIES, CategoryResponse.class);
        if (cached != null) {
            return cached;
        }

        List<CategoryResponse> result = categoryRepository.findAll().stream()
                .map(categoryMapper::toResponse)
                .collect(Collectors.toList());

        cacheHelper.saveToCache(CACHE_ALL_CATEGORIES, result, CACHE_TTL);
        return result;
    }

    @Override
    public CategoryResponse getById(String id) {
        String cacheKey = CACHE_CATEGORY_PREFIX + id;
        CategoryResponse cached = cacheHelper.getFromCache(cacheKey, CategoryResponse.class);
        if (cached != null) {
            return cached;
        }

        CategoryResponse result = categoryMapper.toResponse(categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND)));

        cacheHelper.saveToCache(cacheKey, result, CACHE_TTL);
        return result;
    }

    @Override
    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        Category category = categoryMapper.toEntity(request);
        Category saved = categoryRepository.save(category);
        invalidateCategoryCache();
        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CategoryResponse update(String id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        categoryMapper.update(category, request);
        CategoryResponse result = categoryMapper.toResponse(categoryRepository.save(category));
        invalidateCategoryCache();
        return result;
    }

    @Override
    @Transactional
    public void delete(String id) {
        if (!categoryRepository.existsById(id)) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        categoryRepository.deleteById(id);
        invalidateCategoryCache();
    }

    private void invalidateCategoryCache() {
        cacheHelper.deleteCache(CACHE_ALL_CATEGORIES);
        cacheHelper.deleteCacheByPattern(CACHE_CATEGORY_PREFIX + "*");
        log.debug("Category cache invalidated");
    }
}
