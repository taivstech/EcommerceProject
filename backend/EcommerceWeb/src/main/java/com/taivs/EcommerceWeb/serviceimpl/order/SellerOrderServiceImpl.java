package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.models.product.ProductImage;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.services.order.SellerOrderService;
import com.taivs.EcommerceWeb.services.order.OrderNotificationService;
import com.taivs.EcommerceWeb.dto.response.order.OrderItemResponse;
import com.taivs.EcommerceWeb.dto.response.order.OrderResponse;
import com.taivs.EcommerceWeb.dto.response.order.OrderShopGroupResponse;
import com.taivs.EcommerceWeb.dto.response.order.ShippingAddressResponse;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.models.order.ShippingAddress;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.repositories.order.OrderItemRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class SellerOrderServiceImpl implements SellerOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderNotificationService orderNotificationService;
    private final WarehouseStockService warehouseStockService;

    @Override
    public List<OrderResponse> getMyShopOrders() {
        String sellerId = currentUserId();

        List<Order> orders = orderRepository
                .findBySellerUserIdWithShippingAndGroupsOrderByCreatedAtDesc(sellerId);
        loadOrderItemsIntoOrders(orders);
        return orders.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public OrderResponse getShopOrderById(String orderId) {
        String sellerId = currentUserId();

        Order order = orderRepository
                .findByIdAndSellerUserId(orderId, sellerId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        loadOrderItemsIntoOrders(List.of(order));
        return mapToResponse(order);
    }

    @Override
    @Transactional
    public void confirmOrder(String orderId) {
        Order order = getSellerOrder(orderId);
        order.changeStatus(OrderStatus.CONFIRMED);
        orderNotificationService.notifyOrderStatusChanged(
                order.getId(), order.getUser().getId(),
                OrderStatus.PENDING.name(), OrderStatus.CONFIRMED.name(), null);
    }

    @Override
    @Transactional
    public void shipOrder(String orderId) {
        Order order = getSellerOrder(orderId);

        for (OrderShopGroup group : order.getOrderShopGroups()) {
            if (group.getWarehouse() == null) {
                log.warn("OrderShopGroup {} has no warehouse, skipping stock update", group.getId());
                continue;
            }
            
            String warehouseId = group.getWarehouse().getId();
            for (OrderItem item : group.getOrderItems()) {
                if (item.getProductVariant() != null) {
                    String variantId = item.getProductVariant().getId();
                    Long quantity = (long) item.getQuantity();
                    
                    warehouseStockService.shipStock(warehouseId, variantId, quantity);
                    log.info("Shipped {} units of variant {} from warehouse {}",
                            quantity, variantId, warehouseId);
                }
            }
        }
        
        order.changeStatus(OrderStatus.SHIPPING);
        orderNotificationService.notifyOrderStatusChanged(
                order.getId(), order.getUser().getId(),
                OrderStatus.CONFIRMED.name(), OrderStatus.SHIPPING.name(), null);
    }

    @Override
    @Transactional
    public void deliverOrder(String orderId) {
        Order order = getSellerOrder(orderId);
        order.changeStatus(OrderStatus.DELIVERED);
        orderNotificationService.notifyOrderStatusChanged(
                order.getId(), order.getUser().getId(),
                OrderStatus.SHIPPING.name(), OrderStatus.DELIVERED.name(), null);
    }

    @Override
    @Transactional
    public void cancelOrder(String orderId, String reason) {
        Order order = getSellerOrder(orderId);
        OrderStatus previousStatus = order.getStatus();

        order.changeStatus(OrderStatus.CANCELLED);
        order.setCancelReason(reason);

        for (OrderShopGroup group : order.getOrderShopGroups()) {
            if (group.getWarehouse() == null) continue;
            String warehouseId = group.getWarehouse().getId();
            for (OrderItem item : group.getOrderItems()) {
                if (item.getProductVariant() != null) {
                    warehouseStockService.releaseReservation(
                            warehouseId,
                            item.getProductVariant().getId(),
                            (long) item.getQuantity());
                }
            }
        }

        orderNotificationService.notifyOrderStatusChanged(
                order.getId(), order.getUser().getId(),
                previousStatus.name(), OrderStatus.CANCELLED.name(), reason);
    }

    private Order getSellerOrder(String orderId) {
        String sellerId = currentUserId();

        return orderRepository
                .findByIdAndSellerUserIdForUpdate(orderId, sellerId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
    }

    private String currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return authentication.getName();
    }

    private void loadOrderItemsIntoOrders(List<Order> orders) {
        if (orders == null || orders.isEmpty()) return;

        List<String> groupIds = orders.stream()
                .flatMap(o -> o.getOrderShopGroups() == null ? Stream.empty() : o.getOrderShopGroups().stream())
                .map(OrderShopGroup::getId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (groupIds.isEmpty()) return;

        List<OrderItem> orderItems = orderItemRepository.findByOrderShopGroupIdsWithVariantAndReview(groupIds);
        Map<String, List<OrderItem>> itemsByGroupId = orderItems.stream()
                .collect(Collectors.groupingBy(item -> item.getOrderShopGroup().getId()));

        orders.forEach(order -> {
            if (order.getOrderShopGroups() != null) {
                order.getOrderShopGroups().forEach(group -> {
                    List<OrderItem> items = itemsByGroupId.getOrDefault(group.getId(), Collections.emptyList());
                    group.getOrderItems().clear();
                    group.getOrderItems().addAll(items);
                });
            }
        });
    }

    private OrderResponse mapToResponse(Order order) {

        ShippingAddressResponse shippingResp = null;
        if (order.getShippingAddress() != null) {
            ShippingAddress sa = order.getShippingAddress();
            shippingResp = ShippingAddressResponse.builder()
                    .receiverName(sa.getReceiverName())
                    .phoneNumber(sa.getPhoneNumber())
                    .fullAddress(sa.getFullAddress())
                    .detailAddress(sa.getDetailAddress())
                    .ward(sa.getWard())
                    .wardCode(sa.getWardCode())
                    .district(sa.getDistrict())
                    .districtId(sa.getDistrictId())
                    .province(sa.getProvince())
                    .provinceId(sa.getProvinceId())
                    .build();
        }

        List<OrderShopGroupResponse> groupResponses = order.getOrderShopGroups() == null
                ? Collections.emptyList()
                : order.getOrderShopGroups().stream().map(g -> {

            List<OrderItemResponse> itemResponses = g.getOrderItems() == null
                    ? Collections.emptyList()
                    : g.getOrderItems().stream().map(i -> OrderItemResponse.builder()
                            .id(i.getId())
                            .productVariantId(i.getProductVariant() == null ? null : i.getProductVariant().getId())
                            .quantity(i.getQuantity())
                            .price(i.getPrice())
                            .productId(i.getProductId())
                            .productName(i.getProductName())
                            .productImage(i.getProductImage())
                            .variantName(i.getVariantName())
                            .variantSku(i.getVariantSku())
                            .hasReview(i.getCustomerReview() != null)
                            .build()
                    ).toList();

            return OrderShopGroupResponse.builder()
                    .id(g.getId())
                    .shopId(g.getShop() == null ? null : g.getShop().getId())
                    .subtotal(g.getSubtotal())
                    .shippingFee(g.getShippingFee())
                    .totalDiscount(g.getTotalDiscount())
                    .total(g.getTotal())
                    .shipment(g.getShipment())
                    .warehouseId(g.getWarehouse() == null ? null : g.getWarehouse().getId())
                    .warehouseName(g.getWarehouse() == null ? null : g.getWarehouse().getName())
                    .items(itemResponses)
                    .build();
        }).toList();

        return OrderResponse.builder()
                .id(order.getId())
                .status(order.getStatus())
                .payment(order.getPayment())
                .isPaid(order.getIsPaid())
                .note(order.getNote())
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .shopDiscountAmount(order.getShopDiscountAmount())
                .shippingDiscountAmount(order.getShippingDiscountAmount())
                .totalDiscount(order.getTotalDiscount())
                .total(order.getTotal())
                .createdAt(order.getCreatedAt())
                .shippingAddress(shippingResp)
                .shopGroups(groupResponses)
                .build();
    }
}
