package com.taivs.EcommerceWeb.controllers.product;

import com.taivs.EcommerceWeb.dto.ApiResponse;
import com.taivs.EcommerceWeb.repositories.product.CategoryRepository;
import com.taivs.EcommerceWeb.utils.CategoryTagMapping;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products/tags")
@RequiredArgsConstructor
public class ProductTagController {

    private final CategoryRepository categoryRepository;

    @GetMapping("/suggest")
    public ApiResponse<List<String>> suggestTags(
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String categoryName) {

        List<String> tags;
        if (categoryId != null && !categoryId.isBlank()) {
            tags = CategoryTagMapping.getTagsForCategory(categoryId, categoryRepository);
        } else if (categoryName != null && !categoryName.isBlank()) {
            tags = CategoryTagMapping.getTagsByCategoryName(categoryName);
        } else {
            tags = CategoryTagMapping.getAllMappings().values().stream()
                    .flatMap(List::stream)
                    .distinct()
                    .sorted()
                    .limit(100)
                    .toList();
        }

        return ApiResponse.<List<String>>builder().result(tags).build();
    }

    @GetMapping("/all")
    public ApiResponse<Map<String, List<String>>> allMappings() {
        return ApiResponse.<Map<String, List<String>>>builder()
                .result(CategoryTagMapping.getAllMappings())
                .build();
    }
}
