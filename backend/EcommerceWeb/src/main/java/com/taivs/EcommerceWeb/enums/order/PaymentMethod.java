package com.taivs.EcommerceWeb.enums.order;

import lombok.Getter;

@Getter
public enum PaymentMethod {
    COD("Cash on Delivery"),
    BANKING("Bank Transfer"),
    VNPAY("Pay via VNPay"),
    PAYPAL("Pay via PayPal"),
    MOMO("Pay via MoMo");

    private final String description;

    PaymentMethod(String description) {
        this.description = description;
    }
}
