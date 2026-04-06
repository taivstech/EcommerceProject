package com.taivs.EcommerceWeb.dto.request.order;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateOrderStatusRequest {
    @NotBlank
    private String status;

    private String cancelReason;
}
