package com.taivs.EcommerceWeb.controllers.shop;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.dto.response.shop.ShopAddressResponse;
import com.taivs.EcommerceWeb.services.shop.ShopAddressService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/shop-addresses")
@RequiredArgsConstructor
public class ShopAddressController {
    private final ShopAddressService shopAddressService;

    @GetMapping
    public ApiResponse<List<ShopAddressResponse>> getShopAddresses(@RequestParam List<String> ids) {
        return ApiResponse.<List<ShopAddressResponse>>builder()
                .result(shopAddressService.getAll(ids))
                .build();
    }
}
