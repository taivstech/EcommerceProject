package com.taivs.EcommerceWeb.controllers.cart;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.dto.request.cart.AddToCartRequest;
import com.taivs.EcommerceWeb.dto.request.cart.UpdateCartItemRequest;
import com.taivs.EcommerceWeb.dto.response.cart.CartItemResponse;
import com.taivs.EcommerceWeb.services.cart.CartService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping
    @PreAuthorize("hasAuthority('cart:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<List<CartItemResponse>> myCart() {
        return ApiResponse.<List<CartItemResponse>>builder()
                .result(cartService.getMyCart())
                .build();
    }

    @PostMapping("/items")
    @PreAuthorize("hasAuthority('cart:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> add(@RequestBody @Valid AddToCartRequest request) {
        cartService.addToCart(request);
        return ApiResponse.<Void>builder().build();
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAuthority('cart:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> updateQty(@PathVariable("id") String id,
            @RequestBody @Valid UpdateCartItemRequest request) {
        cartService.updateQuantity(id, request);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping("/items/{id}")
    @PreAuthorize("hasAuthority('cart:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> remove(@PathVariable("id") String id) {
        cartService.removeItem(id);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping
    @PreAuthorize("hasAuthority('cart:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> clear() {
        cartService.clearMyCart();
        return ApiResponse.<Void>builder().build();
    }
}
