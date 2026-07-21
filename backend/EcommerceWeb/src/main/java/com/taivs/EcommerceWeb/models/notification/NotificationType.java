package com.taivs.EcommerceWeb.models.notification;

import lombok.Getter;

@Getter
public enum NotificationType {
    SHOP_ADD_PRODUCT("SHOP-001", "Sản phẩm mới từ Shop", "{shopName} vừa mới thêm một sản phẩm: {productName}"),
    SHOP_ADD_VOUCHER("PROMOTION-001", "Voucher mới từ Shop", "{shopName} vừa mới thêm một voucher: {voucherName}"),
    ORDER_CONFIRMED("ORDER_CONFIRMED", "Đơn hàng đã xác nhận", "Đơn hàng #{orderId} đã được người bán xác nhận và đang chuẩn bị hàng"),
    ORDER_SHIPPING("ORDER_SHIPPING", "Đơn hàng đang giao", "Đơn hàng #{orderId} đang được giao đến bạn"),
    ORDER_DELIVERED("ORDER_DELIVERED", "Đơn hàng đã giao", "Đơn hàng #{orderId} đã được giao. Vui lòng xác nhận đã nhận hàng"),
    ORDER_COMPLETED("ORDER_COMPLETED", "Đơn hàng hoàn thành", "Đơn hàng #{orderId} đã hoàn thành. Cảm ơn bạn đã mua sắm!"),
    ORDER_CANCELLED("ORDER_CANCELLED", "Đơn hàng đã hủy", "Đơn hàng #{orderId} đã bị hủy{reason}"),
    RETURN_REQUEST("RETURN_REQUEST", "Yêu cầu trả hàng", "Đơn hàng #{orderId} có yêu cầu trả hàng/hoàn tiền mới"),
    RETURN_APPROVED("RETURN_APPROVED", "Yêu cầu trả hàng được chấp nhận", "Yêu cầu trả hàng của đơn hàng #{orderId} đã được chấp nhận"),
    RETURN_REJECTED("RETURN_REJECTED", "Yêu cầu trả hàng bị từ chối", "Yêu cầu trả hàng của đơn hàng #{orderId} đã bị từ chối"),
    RETURN_SHIPPED("RETURN_SHIPPED", "Đã gửi hàng trả", "Hàng trả cho đơn hàng #{orderId} đã được gửi đi"),
    REFUND_COMPLETED("REFUND_COMPLETED", "Hoàn tiền thành công", "Đã hoàn tiền thành công cho đơn hàng #{orderId}");

    private final String code;
    private final String defaultTitle;
    private final String messageTemplate;

    NotificationType(String code, String defaultTitle, String messageTemplate) {
        this.code = code;
        this.defaultTitle = defaultTitle;
        this.messageTemplate = messageTemplate;
    }

    public static NotificationType fromCode(String code) {
        for (NotificationType t : values()) {
            if (t.getCode().equalsIgnoreCase(code) || t.name().equalsIgnoreCase(code)) {
                return t;
            }
        }
        return null;
    }
}
