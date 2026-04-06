package com.taivs.EcommerceWeb.services.order;

import com.taivs.EcommerceWeb.dto.response.user.UserResponse;

import java.util.List;

public interface OrderItemService {

    boolean existsOrderForProduct(List<String> variantIds);

    Long getNumberOfOrder(List<String> variantIds);

    UserResponse getOwnerOfOrder(String orderItemId);

    int getTotalQuantityOfVariantInOrders(String variantId);
}
