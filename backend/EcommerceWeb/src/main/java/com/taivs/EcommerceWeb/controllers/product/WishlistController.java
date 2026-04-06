package com.taivs.EcommerceWeb.controllers.product;

import com.taivs.EcommerceWeb.dto.response.product.WishlistResponse;
import com.taivs.EcommerceWeb.services.product.WishlistService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/wishlist")
@RequiredArgsConstructor
public class WishlistController {
    private final WishlistService wishlistService;

    @GetMapping
    @PreAuthorize("hasAuthority('wishlist:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<List<WishlistResponse>> getMyWishlist() {
        return ApiResponse.<List<WishlistResponse>>builder()
                .result(wishlistService.getMyWishlist())
                .build();
    }

    @PostMapping("/products/{productId}")
    @PreAuthorize("hasAuthority('wishlist:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> addToWishlist(@PathVariable("productId") String productId) {
        wishlistService.addToWishlist(productId);
        return ApiResponse.<Void>builder().build();
    }

    @DeleteMapping("/products/{productId}")
    @PreAuthorize("hasAuthority('wishlist:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Void> removeFromWishlist(@PathVariable("productId") String productId) {
        wishlistService.removeFromWishlist(productId);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/check/{productId}")
    @PreAuthorize("hasAuthority('wishlist:manage') or hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ApiResponse<Boolean> checkInWishlist(@PathVariable("productId") String productId) {
        return ApiResponse.<Boolean>builder()
                .result(wishlistService.isInMyWishlist(productId))
                .build();
    }
}
