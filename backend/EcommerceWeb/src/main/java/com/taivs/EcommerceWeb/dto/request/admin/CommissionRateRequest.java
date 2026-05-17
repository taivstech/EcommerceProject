package com.taivs.EcommerceWeb.dto.request.admin;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CommissionRateRequest {
    /** Null = set/update global default */
    private String categoryId;
    private String categoryName;
    /** Rate as decimal, e.g. 0.05 = 5% */
    private BigDecimal rate;
    private String description;
}
