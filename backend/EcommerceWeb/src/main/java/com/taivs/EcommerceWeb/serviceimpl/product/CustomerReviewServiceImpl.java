package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.repositories.order.OrderItemRepository;
import com.taivs.EcommerceWeb.dto.request.product.CreateReviewRequest;
import com.taivs.EcommerceWeb.dto.request.product.CreateReplyRequest;
import com.taivs.EcommerceWeb.dto.response.product.CustomerReviewResponse;
import com.taivs.EcommerceWeb.dto.response.product.ProductRatingStats;
import com.taivs.EcommerceWeb.models.product.CustomerReview;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.repositories.product.CustomerReviewRepository;
import com.taivs.EcommerceWeb.services.product.CustomerReviewService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerReviewServiceImpl implements CustomerReviewService {
    private final CustomerReviewRepository customerReviewRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CustomerReviewResponse createReview(CreateReviewRequest request) {
        String userId = currentUserId();
        log.debug("Creating review for orderItemId: {}, userId: {}", request.getOrderItemId(), userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> {
                    log.warn("OrderItem not found: {}", request.getOrderItemId());
                    return new AppException(ErrorCode.INVALID_REQUEST);
                });

        if (!orderItem.getOrderShopGroup().getOrder().getUser().getId().equals(userId)) {
            log.warn("User {} attempted to review orderItem {} that belongs to another user", userId, request.getOrderItemId());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        String orderStatus = orderItem.getOrderShopGroup().getOrder().getStatus().toString();
        if (!"COMPLETED".equalsIgnoreCase(orderStatus)) {
            log.warn("Cannot review orderItem {} - order status is {} (must be COMPLETED)", request.getOrderItemId(), orderStatus);
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (orderItem.getCustomerReview() != null) {
            log.warn("OrderItem {} already has a review", request.getOrderItemId());
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        ProductVariant variant = orderItem.getProductVariant();
        CustomerReview review = CustomerReview.builder()
                .id(UUID.randomUUID().toString())
                .rating(request.getRating())
                .comment(request.getComment())
                .productVariant(variant)
                .user(user)
                .build();

        CustomerReview saved = customerReviewRepository.save(review);

        orderItem.setCustomerReview(saved);
        orderItemRepository.save(orderItem);

        return toResponse(saved);
    }

    @Override
    public List<CustomerReviewResponse> getProductReviews(String productId) {
        log.debug("Fetching reviews for productId: {}", productId);
        List<CustomerReview> reviews = customerReviewRepository.findByProductId(productId);
        log.debug("Found {} reviews for productId: {}", reviews.size(), productId);
        return reviews.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ProductRatingStats getProductRatingStats(String productId) {
        Double avgRating = customerReviewRepository.getAverageRatingByProductId(productId);
        long count = customerReviewRepository.countByProductId(productId);

        List<Object[]> breakdown = customerReviewRepository.getRatingBreakdownByProductId(productId);
        long fiveStar = 0, fourStar = 0, threeStar = 0, twoStar = 0, oneStar = 0;
        for (Object[] row : breakdown) {
            Integer rating = (Integer) row[0];
            Long cnt = (Long) row[1];
            if (rating == 5) fiveStar = cnt;
            else if (rating == 4) fourStar = cnt;
            else if (rating == 3) threeStar = cnt;
            else if (rating == 2) twoStar = cnt;
            else if (rating == 1) oneStar = cnt;
        }

        return ProductRatingStats.builder()
                .productId(productId)
                .averageRating(avgRating != null ? avgRating : 0.0)
                .totalReviews(count)
                .fiveStar(fiveStar)
                .fourStar(fourStar)
                .threeStar(threeStar)
                .twoStar(twoStar)
                .oneStar(oneStar)
                .build();
    }

    @Override
    @Transactional
    public CustomerReviewResponse replyToReview(String reviewId, CreateReplyRequest request) {
        String userId = currentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        CustomerReview parent = customerReviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Parent review not found"));

        CustomerReview reply = CustomerReview.builder()
                .id(UUID.randomUUID().toString())
                .rating(null)
                .comment(request.getComment())
                .productVariant(parent.getProductVariant())
                .user(user)
                .parent(parent)
                .build();

        CustomerReview saved = customerReviewRepository.save(reply);
        return toResponse(saved);
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private CustomerReviewResponse toResponse(CustomerReview review) {
        String parentId = review.getParent() != null ? review.getParent().getId() : null;
        List<CustomerReviewResponse> childReplies = null;
        if (review.getReplies() != null && !review.getReplies().isEmpty()) {
            childReplies = review.getReplies().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        return CustomerReviewResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .productVariantId(review.getProductVariant() != null ? review.getProductVariant().getId() : null)
                .variantName(review.getProductVariant() != null ? review.getProductVariant().getName() : null)
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .userName(review.getUser() != null ? review.getUser().getFullName() : null)
                .userAvatar(review.getUser() != null ? review.getUser().getProfilePicture() : null)
                .parentId(parentId)
                .replies(childReplies)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
