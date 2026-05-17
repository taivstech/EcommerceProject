package com.taivs.EcommerceWeb.dto.response.admin;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CommissionRateResponse {
    private String id;
    private String categoryId;
    private String categoryName;
    /** null categoryId means this is the global default */
    private boolean isDefault;
    private BigDecimal rate;
    /** Formatted as percentage string, e.g. "5.00%" */
    private String rateDisplay;
    private String description;
    private Boolean isActive;
    private LocalDateTime effectiveFrom;
    private LocalDateTime createdAt;
}
