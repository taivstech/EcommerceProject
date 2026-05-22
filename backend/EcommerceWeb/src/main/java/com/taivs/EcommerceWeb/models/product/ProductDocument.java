package com.taivs.EcommerceWeb.models.product;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(indexName = "products")
@Setting(settingPath = "/elasticsearch/product-settings.json")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDocument {

    @Id
    private String id;

    @MultiField(
            mainField = @Field(type = FieldType.Text, analyzer = "product_index_analyzer", searchAnalyzer = "product_search_analyzer"),
            otherFields = {
                    @InnerField(suffix = "keyword", type = FieldType.Keyword),
                    @InnerField(suffix = "suggest", type = FieldType.Text, analyzer = "suggest_index_analyzer", searchAnalyzer = "suggest_search_analyzer"),
                    @InnerField(suffix = "raw", type = FieldType.Text, analyzer = "keyword_lowercase")
            }
    )
    private String name;

    @Field(type = FieldType.Text, analyzer = "product_index_analyzer", searchAnalyzer = "product_search_analyzer")
    private String description;

    @Field(type = FieldType.Double)
    private BigDecimal minPrice;

    @Field(type = FieldType.Double)
    private BigDecimal maxPrice;

    @Field(type = FieldType.Keyword)
    private String brand;

    @Field(type = FieldType.Keyword)
    private String shopId;

    @Field(type = FieldType.Text, analyzer = "product_index_analyzer", searchAnalyzer = "product_search_analyzer")
    private String shopName;

    @Field(type = FieldType.Keyword)
    private String categoryId;

    @Field(type = FieldType.Keyword)
    private String categoryName;

    @Field(type = FieldType.Keyword)
    private String shopProvince;

    @Field(type = FieldType.Long)
    private Long totalSold;

    @Field(type = FieldType.Date, format = DateFormat.date_hour_minute_second_millis)
    private LocalDateTime createdAt;

    @Field(type = FieldType.Keyword)
    private String mainImageUrl;

    @Field(type = FieldType.Keyword, index = false)
    @Builder.Default
    private List<String> imageUrls = new ArrayList<>();

    @Field(type = FieldType.Double)
    private BigDecimal weight;

    @Field(type = FieldType.Keyword)
    @Builder.Default
    private List<String> attributeOptions = new ArrayList<>();

    @Field(type = FieldType.Text, analyzer = "product_index_analyzer", searchAnalyzer = "product_search_analyzer")
    @Builder.Default
    private List<String> variantNames = new ArrayList<>();

    @Field(type = FieldType.Integer)
    private Integer variantCount;

    @Field(type = FieldType.Long)
    private Long totalStock;

    @Field(type = FieldType.Double)
    private BigDecimal avgRating;     // avg of customer_reviews.rating — used for rating filter

    @Field(type = FieldType.Long)
    private Long ratingCount;     // number of ratings — used for scoring confidence

    @Field(type = FieldType.Text, analyzer = "product_index_analyzer", searchAnalyzer = "product_search_analyzer")
    @Builder.Default
    private List<String> tags = new ArrayList<>();
}
