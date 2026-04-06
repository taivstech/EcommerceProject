package com.taivs.EcommerceWeb.services.cart;

import com.taivs.EcommerceWeb.dto.request.cart.AddToCartRequest;
import com.taivs.EcommerceWeb.dto.request.cart.UpdateCartItemRequest;
import com.taivs.EcommerceWeb.dto.response.cart.CartItemResponse;

import java.util.List;

public interface CartService {

    List<CartItemResponse> getMyCart();

    void addToCart(AddToCartRequest request);

    void updateQuantity(String cartItemId, UpdateCartItemRequest request);

    void removeItem(String cartItemId);

    void clearMyCart();
}
