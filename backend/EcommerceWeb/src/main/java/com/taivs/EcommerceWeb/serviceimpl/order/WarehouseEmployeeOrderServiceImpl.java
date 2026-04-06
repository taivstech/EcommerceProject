package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.services.order.WarehouseEmployeeOrderService;
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
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseRepository;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class WarehouseEmployeeOrderServiceImpl implements WarehouseEmployeeOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    public List<OrderResponse> getMyWarehouseOrders() {
        List<String> warehouseIds = getMyWarehouseIds();
        if (warehouseIds.isEmpty()) return Collections.emptyList();

        List<Order> orders = orderRepository.findByWarehouseIdsWithDetails(warehouseIds);
        loadOrderItemsIntoOrders(orders);

        return orders.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public OrderResponse getWarehouseOrderById(String orderId) {
        List<String> warehouseIds = getMyWarehouseIds();
        if (warehouseIds.isEmpty()) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        Order order = orderRepository.findByIdAndWarehouseIds(orderId, warehouseIds)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        loadOrderItemsIntoOrders(List.of(order));
        return mapToResponse(order);
    }

    @Override
    @Transactional
    public void confirmPacking(String orderId) {
        Order order = getEmployeeOrder(orderId);
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            order.changeStatus(OrderStatus.SHIPPING);
        } else {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }
    }

    @Override
    @Transactional
    public void markShipped(String orderId) {
        Order order = getEmployeeOrder(orderId);
        order.changeStatus(OrderStatus.DELIVERED);
    }


    private List<String> getMyWarehouseIds() {
        String userId = currentUserId();
        return warehouseRepository.findByEmployeeUserId(userId)
                .stream()
                .map(Warehouse::getId)
                .collect(Collectors.toList());
    }

    private Order getEmployeeOrder(String orderId) {
        List<String> warehouseIds = getMyWarehouseIds();
        if (warehouseIds.isEmpty()) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        return orderRepository.findByIdAndWarehouseIds(orderId, warehouseIds)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
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
}
