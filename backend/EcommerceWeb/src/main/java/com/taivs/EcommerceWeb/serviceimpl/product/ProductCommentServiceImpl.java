package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.dto.request.product.CreateCommentRequest;
import com.taivs.EcommerceWeb.dto.response.product.ProductCommentResponse;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductComment;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.repositories.product.ProductCommentRepository;
import com.taivs.EcommerceWeb.repositories.product.ProductRepository;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.services.product.ProductCommentService;
import com.taivs.EcommerceWeb.utils.AuthUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductCommentServiceImpl implements ProductCommentService {

    private final ProductCommentRepository commentRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ProductCommentResponse createComment(CreateCommentRequest request) {
        String userId = AuthUtils.currentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductComment comment = ProductComment.builder()
                .product(product)
                .user(user)
                .content(request.getContent().trim())
                .parentId(request.getParentId())
                .build();

        int rightValue;
        if (request.getParentId() != null && !request.getParentId().isBlank()) {
            ProductComment parentComment = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND));

            rightValue = parentComment.getRightValue();

            // Shift existing left/right values
            commentRepository.shiftRightValuesForInsert(product.getId(), rightValue);
            commentRepository.shiftLeftValuesForInsert(product.getId(), rightValue);
        } else {
            Integer maxRight = commentRepository.findMaxRightValueByProductId(product.getId());
            if (maxRight != null) {
                rightValue = maxRight + 1;
            } else {
                rightValue = 1;
            }
        }

        comment.setLeftValue(rightValue);
        comment.setRightValue(rightValue + 1);

        ProductComment saved = commentRepository.save(comment);
        log.info("Created comment ID: {}, left: {}, right: {} for product: {}", saved.getId(), saved.getLeftValue(), saved.getRightValue(), product.getId());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductCommentResponse> getComments(String productId, String parentId) {
        if (!productRepository.existsById(productId)) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        List<ProductComment> comments;
        if (parentId != null && !parentId.isBlank()) {
            ProductComment parentComment = commentRepository.findById(parentId)
                    .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND));

            comments = commentRepository.findReplies(productId, parentComment.getLeftValue(), parentComment.getRightValue());
        } else {
            comments = commentRepository.findByProductIdAndParentIdIsNullOrderByLeftValueAsc(productId);
        }

        return comments.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void deleteComment(String commentId) {
        ProductComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND));

        String currentUserId = AuthUtils.currentUserId();
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!comment.getUser().getId().equals(currentUserId) && !isAdmin) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        String productId = comment.getProduct().getId();
        int left = comment.getLeftValue();
        int right = comment.getRightValue();
        int width = right - left + 1;

        // Delete all comment children and the comment itself
        commentRepository.deleteCommentsInRange(productId, left, right);

        // Shift left/right values of remaining comments
        commentRepository.shiftRightValuesForDelete(productId, right, width);
        commentRepository.shiftLeftValuesForDelete(productId, right, width);

        log.info("Deleted comment ID: {} and its subtree for product: {}", commentId, productId);
    }

    private ProductCommentResponse toResponse(ProductComment pc) {
        return ProductCommentResponse.builder()
                .id(pc.getId())
                .content(pc.getContent())
                .productId(pc.getProduct().getId())
                .userId(pc.getUser().getId())
                .userName(pc.getUser().getFullName())
                .userAvatar(pc.getUser().getProfilePicture())
                .leftValue(pc.getLeftValue())
                .rightValue(pc.getRightValue())
                .parentId(pc.getParentId())
                .createdAt(pc.getCreatedAt())
                .build();
    }
}
