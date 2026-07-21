package com.taivs.EcommerceWeb.dto.request.shop;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopRegistrationSession implements Serializable {
    private static final long serialVersionUID = 1L;

    private String userId;
    private ShopCreateRequest shopData;
    private String currentStep; // email_verification, phone_verification, completed
    private String emailOtpHash;
    private int emailOtpAttempts;
    private boolean emailVerified;
    private boolean phoneVerified;
}
