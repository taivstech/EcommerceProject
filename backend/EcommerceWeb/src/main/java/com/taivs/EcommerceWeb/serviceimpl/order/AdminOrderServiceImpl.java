package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.models.product.ProductImage;
import com.taivs.EcommerceWeb.services.order.AdminOrderService;
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
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
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
public class AdminOrderServiceImpl implements AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderNotificationService orderNotificationService;

    @Override
    public List<OrderResponse> getAllOrders(String status) {
        List<Order> orders;

        if (status == null || status.isBlank()) {
            orders = orderRepository.findAllWithShippingAndGroupsOrderByCreatedAtDesc();
        } else {
            OrderStatus orderStatus = OrderStatus.from(status);
            orders = orderRepository.findAllWithShippingAndGroupsByStatusOrderByCreatedAtDesc(orderStatus);
        }

        loadOrderItemsIntoOrders(orders);
        return orders.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public void adminUpdateOrderStatus(String orderId, String newStatus) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        OrderStatus targetStatus = OrderStatus.from(newStatus);

        if (order.getStatus() == targetStatus) {
            return;
        }

        String previousStatus = order.getStatus().name();
        order.changeStatus(targetStatus);

        orderNotificationService.notifyOrderStatusChanged(
                order.getId(), order.getUser().getId(),
                previousStatus, targetStatus.name(), null);
    }

    @Override
    @Transactional
    public void deliverOrder(String orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        String previousStatus = order.getStatus().name();
        order.changeStatus(OrderStatus.DELIVERED); // SHIPPING → DELIVERED

        orderNotificationService.notifyOrderStatusChanged(
                order.getId(), order.getUser().getId(),
                previousStatus, OrderStatus.DELIVERED.name(), null);
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
