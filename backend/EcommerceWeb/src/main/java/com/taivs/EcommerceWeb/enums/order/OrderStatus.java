package com.taivs.EcommerceWeb.enums.order;

import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;

import java.util.Arrays;

public enum OrderStatus {
    AWAITING_PAYMENT,
    PENDING,
    CONFIRMED,
    SHIPPING,
    DELIVERED,
    COMPLETED,
    CANCELLED;

    public static OrderStatus from(String value) {
        if (value == null || value.isBlank()) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        return Arrays.stream(OrderStatus.values())
                .filter(status -> status.name().equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_ORDER_STATUS));
    }
}
