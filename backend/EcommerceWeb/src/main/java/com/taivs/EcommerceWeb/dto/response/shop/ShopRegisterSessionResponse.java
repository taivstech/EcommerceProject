package com.taivs.EcommerceWeb.dto.response.shop;

import com.taivs.EcommerceWeb.dto.request.shop.ShopCreateRequest;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ShopRegisterSessionResponse {
    private String sessionId;
    private String currentStep;
    private ShopCreateRequest shopData;
    private String message;
    private String phoneNumber;
}
