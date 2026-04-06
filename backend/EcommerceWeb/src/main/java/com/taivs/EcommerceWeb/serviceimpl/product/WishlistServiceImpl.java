package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.dto.response.product.WishlistResponse;
import com.taivs.EcommerceWeb.models.product.Wishlist;
import com.taivs.EcommerceWeb.repositories.product.ProductRepository;
import com.taivs.EcommerceWeb.repositories.product.WishlistRepository;
import com.taivs.EcommerceWeb.services.product.WishlistService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public List<WishlistResponse> getMyWishlist() {
        return wishlistRepository.findWishlistOfUser(currentUserId());
    }

    @Override
    public boolean isInMyWishlist(String productId) {
        return wishlistRepository.existsByUserIdAndProductId(
                currentUserId(),
                productId
        );
    }
    @Override
    @Transactional
    public void addToWishlist(String productId) {

        String userId = currentUserId();

        if (!productRepository.existsById(productId)) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Wishlist wishlist = Wishlist.builder()
                        .user(userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)))
                                .product(productRepository.findById(productId).orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND)))
                                        .build();
        wishlistRepository.save(wishlist);
    }

    @Override
    @Transactional
    public void removeFromWishlist(String productId) {

        String userId = currentUserId();

        Wishlist wishlist = wishlistRepository
                .findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));

        wishlistRepository.delete(wishlist);
    }

    private String currentUserId() {
        return SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
    }
}
