package com.taivs.EcommerceWeb.dto.response.shop;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@Builder
public class SellerTopCustomerStats {
    private String customerId;
    private String fullName;
    private String username;
    private String email;
    private String profilePicture;
    private BigDecimal totalSpending;
}
