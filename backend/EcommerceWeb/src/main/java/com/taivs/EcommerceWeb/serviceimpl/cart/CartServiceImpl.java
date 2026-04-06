package com.taivs.EcommerceWeb.serviceimpl.cart;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.dto.request.cart.AddToCartRequest;
import com.taivs.EcommerceWeb.dto.request.cart.UpdateCartItemRequest;
import com.taivs.EcommerceWeb.dto.response.cart.CartItemResponse;
import com.taivs.EcommerceWeb.models.cart.CartItem;
import com.taivs.EcommerceWeb.repositories.cart.CartItemRepository;
import com.taivs.EcommerceWeb.services.cart.CartService;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.repositories.product.ProductVariantRepository;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;

    @Override
    public List<CartItemResponse> getMyCart() {
        String userId = currentUserId();
        return cartItemRepository.findByUserIdWithRelationsOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addToCart(AddToCartRequest request) {
        String userId = currentUserId();
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        
        ProductVariant variant = productVariantRepository.findById(request.getProductVariantId())
                .orElseThrow(() -> new AppException(ErrorCode.VARIANT_NOT_FOUND));

        int qty = request.getQuantity() == null ? 1 : request.getQuantity();
        if (variant.getStock() != null && variant.getStock() < qty) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }
        
        CartItem item = cartItemRepository.findByUser_IdAndProductVariant_Id(userId, variant.getId())
                .orElse(null);
        if (item == null) {
            item = CartItem.builder()
                    .id(UUID.randomUUID().toString())
                    .user(user)
                    .productVariant(variant)
                    .quantity(qty)
                    .build();
        } else {
            int newQty = item.getQuantity() + qty;
            if (variant.getStock() != null && variant.getStock() < newQty) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
            }
            item.setQuantity(newQty);
        }

        cartItemRepository.save(item);
    }

    @Override
    @Transactional
    public void updateQuantity(String cartItemId, UpdateCartItemRequest request) {
        String userId = currentUserId();
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));
        if (!item.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        int qty = request.getQuantity();
        ProductVariant variant = item.getProductVariant();
        if (variant.getStock() != null && variant.getStock() < qty) {
            throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }
        item.setQuantity(qty);
        cartItemRepository.save(item);
    }

    @Override
    @Transactional
    public void removeItem(String cartItemId) {
        String userId = currentUserId();
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));
        if (!item.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        cartItemRepository.delete(item);
    }

    @Override
    @Transactional
    public void clearMyCart() {
        cartItemRepository.deleteByUser_Id(currentUserId());
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private CartItemResponse toResponse(CartItem item) {
        String productId = item.getProductVariant() != null && item.getProductVariant().getProduct() != null
                ? item.getProductVariant().getProduct().getId()
                : null;
        String shopId = item.getProductVariant() != null
                && item.getProductVariant().getProduct() != null
                && item.getProductVariant().getProduct().getShop() != null
                ? item.getProductVariant().getProduct().getShop().getId()
                : null;

        return CartItemResponse.builder()
                .id(item.getId())
                .quantity(item.getQuantity())
                .addedAt(item.getCreatedAt())
                .productVariantId(item.getProductVariant() == null ? null : item.getProductVariant().getId())
                .productId(productId)
                .shopId(shopId)
                .build();
    }
}
