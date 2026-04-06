package com.taivs.EcommerceWeb.controllers.order;

import com.taivs.EcommerceWeb.dto.response.user.UserResponse;
import com.taivs.EcommerceWeb.services.order.OrderItemService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orderItems")
@RequiredArgsConstructor
public class OrderItemController {
    private final OrderItemService orderItemService;

    @GetMapping("/exists")
    public ApiResponse<Boolean> existsOrderByProductId(@RequestParam List<String> variantIds) {
        return ApiResponse.<Boolean>builder()
                .result(orderItemService.existsOrderForProduct(variantIds))
                .build();
    }

    @GetMapping("/count")
    public ApiResponse<Long> getNumberOfOrder(@RequestParam List<String> variantIds) {
        return ApiResponse.<Long>builder()
                .result(orderItemService.getNumberOfOrder(variantIds))
                .build();
    }

    @GetMapping("/owner")
    public ApiResponse<UserResponse> getOwnerOfReview(@RequestParam String orderItemId) {
        return ApiResponse.<UserResponse>builder()
                .result(orderItemService.getOwnerOfOrder(orderItemId))
                .build();
    }
}
