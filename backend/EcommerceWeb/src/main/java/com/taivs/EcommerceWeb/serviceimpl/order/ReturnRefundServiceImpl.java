package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.services.notification.NotificationService;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.repositories.order.OrderItemRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.dto.request.order.CreateReturnRequest;
import com.taivs.EcommerceWeb.dto.request.order.SellerReturnActionRequest;
import com.taivs.EcommerceWeb.dto.response.order.ReturnRequestResponse;
import com.taivs.EcommerceWeb.enums.order.ReturnReason;
import com.taivs.EcommerceWeb.models.order.ReturnRequest;
import com.taivs.EcommerceWeb.enums.order.ReturnStatus;
import com.taivs.EcommerceWeb.repositories.order.ReturnRequestRepository;
import com.taivs.EcommerceWeb.services.order.ReturnRefundService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReturnRefundServiceImpl implements ReturnRefundService {

    private final ReturnRequestRepository returnRequestRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final NotificationService notificationService;
    private final WarehouseStockService warehouseStockService;

    private static final int RETURN_WINDOW_DAYS = 30;

    @Override
    @Transactional
    public ReturnRequestResponse createReturnRequest(CreateReturnRequest request) {
        String userId = currentUserId();

        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.COMPLETED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        if (order.getUpdatedAt() != null &&
                order.getUpdatedAt().isBefore(LocalDateTime.now().minusDays(RETURN_WINDOW_DAYS))) {
            throw new AppException(ErrorCode.RETURN_WINDOW_EXPIRED);
        }

        if (!order.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND));

        if (returnRequestRepository.existsByOrderItem_IdAndStatusNot(orderItem.getId(), ReturnStatus.CANCELLED)) {
            throw new AppException(ErrorCode.ALREADY_EXISTS);
        }

        ReturnReason reason;
        try {
            reason = ReturnReason.valueOf(request.getReason().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        BigDecimal itemSubtotal = orderItem.getPrice().multiply(BigDecimal.valueOf(orderItem.getQuantity()));

        BigDecimal orderSubtotal = order.getSubtotal() != null ? order.getSubtotal() : BigDecimal.ZERO;
        BigDecimal productDiscount = BigDecimal.ZERO;
        if (order.getDiscountAmount() != null) productDiscount = productDiscount.add(order.getDiscountAmount());
        if (order.getShopDiscountAmount() != null) productDiscount = productDiscount.add(order.getShopDiscountAmount());

        BigDecimal refundAmount;
        if (orderSubtotal.compareTo(BigDecimal.ZERO) > 0 && productDiscount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discountRatio = productDiscount.divide(orderSubtotal, 10, RoundingMode.HALF_UP);
            refundAmount = itemSubtotal.multiply(BigDecimal.ONE.subtract(discountRatio))
                    .setScale(0, RoundingMode.HALF_UP);
        } else {
            refundAmount = itemSubtotal;
        }

        ReturnRequest returnRequest = ReturnRequest.builder()
                .order(order)
                .orderItem(orderItem)
                .user(order.getUser())
                .status(ReturnStatus.REQUESTED)
                .reason(reason)
                .description(request.getDescription())
                .evidenceImages(request.getEvidenceImages())
                .refundAmount(refundAmount)
                .build();

        returnRequestRepository.save(returnRequest);

        String shopUserId = orderItem.getOrderShopGroup().getShop().getUser().getId();
        notificationService.createAndPush(shopUserId, "RETURN_REQUEST",
                "New return request",
                "Buyer requested return for " + orderItem.getProductName(),
                returnRequest.getId(), "RETURN");

        log.info("Return request created: {} for order item {}", returnRequest.getId(), orderItem.getId());
        return toResponse(returnRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> getMyReturnRequests() {
        return returnRequestRepository.findByUserId(currentUserId())
            .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void cancelReturnRequest(String id) {
        ReturnRequest rr = getOwnedRequest(id);
        if (rr.getStatus() != ReturnStatus.REQUESTED) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        rr.setStatus(ReturnStatus.CANCELLED);
        rr.setResolvedAt(LocalDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReturnRequestResponse> getSellerReturnRequests() {
        return returnRequestRepository.findBySellerUserId(currentUserId())
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public ReturnRequestResponse sellerAction(String id, SellerReturnActionRequest request) {
        ReturnRequest rr = returnRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND));

        if (rr.getStatus() != ReturnStatus.REQUESTED) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        verifySellerOwnership(rr);

        String action = request.getAction().toUpperCase();
        if ("APPROVED".equals(action)) {
            rr.setStatus(ReturnStatus.APPROVED);
            notificationService.createAndPush(rr.getUser().getId(), "RETURN_APPROVED",
                    "Return approved",
                    "Your return request has been approved. Please ship the item back.",
                    rr.getId(), "RETURN");
        } else if ("REJECTED".equals(action)) {
            rr.setStatus(ReturnStatus.REJECTED);
            rr.setResolvedAt(LocalDateTime.now());
            notificationService.createAndPush(rr.getUser().getId(), "RETURN_REJECTED",
                    "Return rejected",
                    "Your return request has been rejected: " + request.getSellerResponse(),
                    rr.getId(), "RETURN");
        } else {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        rr.setSellerResponse(request.getSellerResponse());
        return toResponse(rr);
    }

    @Override
    @Transactional
    public ReturnRequestResponse confirmReturned(String id) {
        ReturnRequest rr = getOwnedRequest(id);
        if (rr.getStatus() != ReturnStatus.APPROVED) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        rr.setStatus(ReturnStatus.RETURNED);

        String shopUserId = rr.getOrderItem().getOrderShopGroup().getShop().getUser().getId();
        notificationService.createAndPush(shopUserId, "RETURN_SHIPPED",
                "Item returned",
                "Buyer has shipped back the item for return request",
                rr.getId(), "RETURN");

        return toResponse(rr);
    }

    @Override
    @Transactional
    public ReturnRequestResponse confirmRefund(String id) {
        ReturnRequest rr = returnRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND));

        if (rr.getStatus() != ReturnStatus.RETURNED) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        verifySellerOwnership(rr);

        rr.setStatus(ReturnStatus.REFUNDED);
        rr.setResolvedAt(LocalDateTime.now());

        OrderItem oi = rr.getOrderItem();
        if (oi.getOrderShopGroup() != null && oi.getOrderShopGroup().getWarehouse() != null
                && oi.getProductVariant() != null) {
            String warehouseId = oi.getOrderShopGroup().getWarehouse().getId();
            String variantId = oi.getProductVariant().getId();
            long qty = oi.getQuantity();
            try {
                warehouseStockService.addStock(warehouseId, variantId, qty);
                log.info("Restocked {} units of variant {} to warehouse {} after return {}", qty, variantId, warehouseId, rr.getId());
            } catch (Exception e) {
                log.error("Failed to restock variant {} after return {}: {}", variantId, rr.getId(), e.getMessage());
            }
        }

        notificationService.createAndPush(rr.getUser().getId(), "REFUND_COMPLETED",
                "Refund completed",
                "Your refund of " + rr.getRefundAmount() + " has been issued.",
                rr.getId(), "RETURN");

        log.info("Refund completed for return request: {}", rr.getId());
        return toResponse(rr);
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private ReturnRequest getOwnedRequest(String id) {
        ReturnRequest rr = returnRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND));
        if (!rr.getUser().getId().equals(currentUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return rr;
    }

    private void verifySellerOwnership(ReturnRequest rr) {
        String shopUserId = rr.getOrderItem().getOrderShopGroup().getShop().getUser().getId();
        if (!shopUserId.equals(currentUserId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }

    private ReturnRequestResponse toResponse(ReturnRequest rr) {
        OrderItem oi = rr.getOrderItem();
        return ReturnRequestResponse.builder()
                .id(rr.getId())
                .orderId(rr.getOrder().getId())
                .orderItemId(oi.getId())
                .productName(oi.getProductName())
                .productImage(oi.getProductImage())
                .variantName(oi.getVariantName())
                .quantity(oi.getQuantity())
                .price(oi.getPrice())
                .userId(rr.getUser().getId())
                .username(rr.getUser().getUsername())
                .status(rr.getStatus().name())
                .reason(rr.getReason().name())
                .description(rr.getDescription())
                .evidenceImages(rr.getEvidenceImages())
                .refundAmount(rr.getRefundAmount())
                .sellerResponse(rr.getSellerResponse())
                .createdAt(rr.getCreatedAt())
                .resolvedAt(rr.getResolvedAt())
                .build();
    }
}
