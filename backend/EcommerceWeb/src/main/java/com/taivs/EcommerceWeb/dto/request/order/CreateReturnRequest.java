package com.taivs.EcommerceWeb.dto.request.order;

import com.taivs.EcommerceWeb.models.order.Order;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateReturnRequest {

    @NotBlank(message = "Order ID is required")
    String orderId;

    @NotBlank(message = "Order item ID is required")
    String orderItemId;

    @NotNull(message = "Reason is required")
    String reason;

    String description;

    String evidenceImages;
}
