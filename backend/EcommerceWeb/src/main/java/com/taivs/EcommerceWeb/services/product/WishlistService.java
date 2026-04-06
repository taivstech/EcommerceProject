package com.taivs.EcommerceWeb.services.product;

import com.taivs.EcommerceWeb.dto.response.product.WishlistResponse;

import java.util.List;

public interface WishlistService {

    List<WishlistResponse> getMyWishlist();

    void addToWishlist(String productId);

    void removeFromWishlist(String productId);

    boolean isInMyWishlist(String productId);
}
