package com.taivs.EcommerceWeb.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformCommissionResponse {
    private String id;
    private String orderId;
    private String shopId;
    private String shopName; // Bổ sung tên shop cho dễ xem trên UI
    private BigDecimal grossAmount;
    private BigDecimal commissionRate;
    private BigDecimal commissionAmount;
    private BigDecimal netAmount;
    private LocalDateTime createdAt;
}
