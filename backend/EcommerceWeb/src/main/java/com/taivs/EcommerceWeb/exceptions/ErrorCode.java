package com.taivs.EcommerceWeb.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.Getter;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User already exists", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least 6 characters and include uppercase, lowercase, and a digit", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not found", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.BAD_REQUEST),
    PASSWORD_NOT_MATCH(1009, "Password and confirm password do not match", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_FOUND(1010, "Product not exists", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_FOUND(1011, "Category not exists", HttpStatus.BAD_REQUEST),
    VARIANT_NOT_FOUND(1013, "Variant not found", HttpStatus.BAD_REQUEST),
    USER_ADDRESS_NOT_EXISTS(1016, "User address not exists", HttpStatus.NOT_FOUND),
    COUPON_NOT_EXISTS(1017, "Coupon not exists", HttpStatus.NOT_FOUND),
    ORDER_NOT_EXISTS(1018, "Order not exists", HttpStatus.NOT_FOUND),
    SHOP_NOT_EXISTS(1019, "Shop not exists", HttpStatus.NOT_FOUND),
    WRONG_PASSWORD(1020, "Wrong password", HttpStatus.BAD_REQUEST),
    ROLE_NOT_EXISTS(1022, "Role not exists", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1023, "Email already exists", HttpStatus.BAD_REQUEST),
    USER_NOT_ACTIVE(1024, "User not active", HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN(1025,"Invalid token",HttpStatus.FORBIDDEN),
    OAUTH2_AUTHENTICATION_FAILED(1026,"OAUTH2 authentication fail",HttpStatus.FORBIDDEN ),
    INVALID_REQUEST(1027, "Invalid request" , HttpStatus.BAD_REQUEST ),
    ALREADY_SELLER(1028,"Already seller",HttpStatus.BAD_REQUEST),
    INSUFFICIENT_STOCK(1029, "Insufficient stock", HttpStatus.BAD_REQUEST),
    ROOM_NOT_FOUND(1030, "Chat room not found", HttpStatus.NOT_FOUND),
    CHAT_NOT_ALLOWED(1031, "Chat not allowed", HttpStatus.FORBIDDEN),
    NOTIFICATION_NOT_FOUND(1032, "Notification not found", HttpStatus.NOT_FOUND),
    ORDER_NOT_FOUND(1033,"Order not found", HttpStatus.NOT_FOUND),
    INVALID_ORDER_STATUS(1034, "Order status not found", HttpStatus.BAD_REQUEST),
    PAYMENT_METHOD_NOT_SUPPORTED(1035, "Payment method not supported", HttpStatus.BAD_REQUEST),
    PAYMENT_GATEWAY_ERROR(1036, "Payment gateway error", HttpStatus.INTERNAL_SERVER_ERROR),
    SHOP_NOT_FOUND(1037, "Shop not found", HttpStatus.NOT_FOUND),
    USER_NOT_FOUND(1038, "User not found", HttpStatus.NOT_FOUND),
    ENTITY_NOT_FOUND(1039, "Entity not found", HttpStatus.NOT_FOUND),
    ALREADY_EXISTS(1040, "Already exists", HttpStatus.BAD_REQUEST),
    WAREHOUSE_NOT_FOUND(1041, "Warehouse not found", HttpStatus.NOT_FOUND),
    
    // Coupon-specific error codes (1050-1059)
    COUPON_USAGE_EXCEEDED(1050, "Coupon usage limit exceeded", HttpStatus.BAD_REQUEST),
    COUPON_TYPE_MISMATCH(1051, "Coupon type does not match order", HttpStatus.BAD_REQUEST),
    COUPON_EXPIRED(1052, "Coupon has expired", HttpStatus.BAD_REQUEST),
    COUPON_INACTIVE(1053, "Coupon is not yet active", HttpStatus.BAD_REQUEST),
    COUPON_MIN_ORDER_NOT_MET(1054, "Order subtotal does not meet coupon minimum", HttpStatus.BAD_REQUEST),
    COUPON_STACKING_NOT_ALLOWED(1055, "Cannot stack these coupon types", HttpStatus.BAD_REQUEST),
    COUPON_ALREADY_APPLIED(1056, "Coupon already applied to this order", HttpStatus.BAD_REQUEST),
    COUPON_INVALID_FOR_SCOPE(1057, "Coupon is not applicable in this scope", HttpStatus.BAD_REQUEST),
    RETURN_WINDOW_EXPIRED(1058, "Return window has expired (30 days after delivery)", HttpStatus.BAD_REQUEST),

    INTERNAL_SERVER_ERROR(500, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
