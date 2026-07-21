package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.services.order.BuyerOrderService;
import com.taivs.EcommerceWeb.services.order.OrderNotificationService;
import com.taivs.EcommerceWeb.services.order.CommissionService;
import com.taivs.EcommerceWeb.services.order.RedisLockService;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.models.cart.CartItem;
import com.taivs.EcommerceWeb.repositories.cart.CartItemRepository;

import com.taivs.EcommerceWeb.dto.request.order.CheckoutRequest;
import com.taivs.EcommerceWeb.dto.response.order.OrderItemResponse;
import com.taivs.EcommerceWeb.dto.response.order.OrderResponse;
import com.taivs.EcommerceWeb.dto.response.order.OrderShopGroupResponse;
import com.taivs.EcommerceWeb.dto.response.order.ShippingAddressResponse;
import com.taivs.EcommerceWeb.enums.promotion.CouponType;
import com.taivs.EcommerceWeb.models.promotion.Coupon;
import com.taivs.EcommerceWeb.models.promotion.CouponUsage;
import com.taivs.EcommerceWeb.models.product.CustomerReview;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.models.order.ShippingAddress;
import com.taivs.EcommerceWeb.enums.promotion.DiscountType;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.repositories.promotion.CouponRepository;
import com.taivs.EcommerceWeb.repositories.promotion.CouponUsageRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderItemRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.services.promotion.CouponService;
import com.taivs.EcommerceWeb.services.warehouse.ShippingService;
import com.taivs.EcommerceWeb.models.product.ProductImage;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.repositories.product.ProductVariantRepository;
import com.taivs.EcommerceWeb.services.product.ProductService;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseStockService;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseSelectionService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.utils.AuthUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class BuyerOrderServiceImpl implements BuyerOrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository variantRepository;
    private final CouponService couponService;
    private final ShippingService shippingService;
    private final ProductService productService;
    private final OrderItemRepository orderItemRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final WarehouseSelectionService warehouseSelectionService;
    private final WarehouseStockService warehouseStockService;
    private final OrderNotificationService orderNotificationService;
    private final CommissionService commissionService;
    private final RedisLockService redisLockService;

    @Override
    public List<OrderResponse> getMyOrders() {
        String userId = AuthUtils.currentUserId();

        List<Order> orders = orderRepository.findByUserIdWithShippingAndGroupsOrderByCreatedAtDesc(userId);

        loadOrderItemsIntoOrders(orders);

        return orders.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public OrderResponse getMyOrderById(String orderId) {
        String userId = AuthUtils.currentUserId();

        Order order = orderRepository.findByIdWithShippingAndGroups(orderId)
                .filter(o -> o.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        loadOrderItemsIntoOrders(List.of(order));

        return mapToResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse checkout(CheckoutRequest request) {
        String userId = AuthUtils.currentUserId();
        List<CartItem> allCartItems = cartItemRepository.findByUserIdWithRelationsOrderByCreatedAtDesc(userId);
        if (allCartItems.isEmpty()) {
            log.error("[CHECKOUT] Cart is empty for userId: {}", userId);
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        List<CartItem> cartItems = allCartItems;
        if (request.getShopId() != null && !request.getShopId().isBlank()) {
            cartItems = allCartItems.stream()
                    .filter(ci -> {
                        String shopId = ci.getProductVariant().getProduct().getShop().getId();
                        return request.getShopId().equals(shopId);
                    })
                    .collect(Collectors.toList());
        }

        List<String> lockedKeys = new ArrayList<>();
        try {
            for (CartItem ci : cartItems) {
                String variantId = ci.getProductVariant().getId();
                String lockKey = "lock:variant:" + variantId;
                if (!lockedKeys.contains(lockKey)) {
                    boolean locked = redisLockService.acquireLock(lockKey, 3000, 10, 50);
                    if (!locked) {
                        throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "Could not acquire stock lock, please try again.");
                    }
                    lockedKeys.add(lockKey);
                }
            }
            return checkoutInternal(request);
        } finally {
            for (String lockKey : lockedKeys) {
                redisLockService.releaseLock(lockKey);
            }
        }
    }

    @Transactional
    public OrderResponse checkoutInternal(CheckoutRequest request) {

        String userId = AuthUtils.currentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        List<CartItem> allCartItems = cartItemRepository.findByUserIdWithRelationsOrderByCreatedAtDesc(userId);

        if (allCartItems.isEmpty()) {
            log.error("[CHECKOUT] Cart is empty for userId: {}", userId);
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        List<CartItem> cartItems = allCartItems;
        if (request.getShopId() != null && !request.getShopId().isBlank()) {
            cartItems = allCartItems.stream()
                    .filter(ci -> {
                        String shopId = ci.getProductVariant().getProduct().getShop().getId();
                        return request.getShopId().equals(shopId);
                    })
                    .collect(Collectors.toList());

            if (cartItems.isEmpty()) {
                log.error("[CHECKOUT] No cart items found for shopId: {}. UserId: {}, Total cart items: {}",
                        request.getShopId(), userId, allCartItems.size());
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }

            log.info("[CHECKOUT] Processing {} items for shopId: {}", cartItems.size(), request.getShopId());
        }

        List<String> checkedOutCartItemIds = cartItems.stream()
                .map(CartItem::getId)
                .filter(Objects::nonNull)
                .toList();

        Map<String, Integer> qtyByVariant = new HashMap<>();
        for (CartItem ci : cartItems) {
            qtyByVariant.merge(
                    ci.getProductVariant().getId(),
                    ci.getQuantity(),
                    Integer::sum);
        }

        List<ProductVariant> variants = variantRepository.findByIdsForUpdateWithProduct(qtyByVariant.keySet());

        validateStock(variants, qtyByVariant);

        for (ProductVariant v : variants) {
            long currentSold = v.getSoldCount() != null ? v.getSoldCount() : 0L;
            int qty = qtyByVariant.getOrDefault(v.getId(), 0);
            v.setSoldCount(currentSold + qty);
        }

        Map<String, ProductVariant> lockedVariantMap = variants.stream()
                .collect(Collectors.toMap(ProductVariant::getId, v -> v));

        Order order = buildOrder(user, request);

        ShippingAddress shipping = ShippingAddress.builder()
                .receiverName(request.getReceiverName())
                .phoneNumber(request.getPhoneNumber())
                .fullAddress(request.getFullAddress())
                .detailAddress(request.getDetailAddress())
                .ward(request.getWard())
                .wardCode(request.getWardCode())
                .district(request.getDistrict())
                .districtId(request.getDistrictId())
                .province(request.getProvince())
                .provinceId(request.getProvinceId())
                .order(order)
                .build();
        order.setShippingAddress(shipping);

        Map<String, List<CartItem>> itemsByShop = new HashMap<>();

        for (CartItem ci : cartItems) {
            ProductVariant lockedVariant = lockedVariantMap.get(ci.getProductVariant().getId());
            String shopId = lockedVariant.getProduct().getShop().getId();

            itemsByShop
                    .computeIfAbsent(shopId, k -> new ArrayList<>())
                    .add(ci);
        }

        BigDecimal orderSubtotal = BigDecimal.ZERO;
        BigDecimal orderShippingFee = BigDecimal.ZERO;
        Map<String, BigDecimal> subtotalByShop = new HashMap<>();

        for (List<CartItem> shopItems : itemsByShop.values()) {

            ProductVariant firstLockedVariant = lockedVariantMap.get(
                    shopItems.get(0).getProductVariant().getId());
            Shop shop = firstLockedVariant.getProduct().getShop();

            Map<String, Long> itemsMap = new HashMap<>();
            Map<String, ProductVariant> variantMap = new HashMap<>();
            Map<String, Integer> groupQtyMap = new HashMap<>();
            List<ProductVariant> groupVariants = new ArrayList<>();

            for (CartItem ci : shopItems) {
                ProductVariant variant = lockedVariantMap.get(ci.getProductVariant().getId());
                String variantId = variant.getId();
                int qty = ci.getQuantity();

                itemsMap.put(variantId, (long) qty);
                variantMap.put(variantId, variant);
                groupQtyMap.put(variantId, qty);
                groupVariants.add(variant);
            }

            BigDecimal totalWeight = shippingService.calculateTotalWeight(groupVariants, groupQtyMap);

            List<WarehouseSelectionService.WarehouseSelectionResult> warehouseSelections = warehouseSelectionService
                    .selectWarehouses(shop.getId(), itemsMap, request, totalWeight);

            if (warehouseSelections.isEmpty()) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK, "No warehouses available for this order");
            }

            for (WarehouseSelectionService.WarehouseSelectionResult selection : warehouseSelections) {
                OrderShopGroup group = OrderShopGroup.builder()
                        .order(order)
                        .shop(shop)
                        .warehouse(selection.warehouse())
                        .subtotal(BigDecimal.ZERO)
                        .shippingFee(selection.shippingFee())
                        .total(BigDecimal.ZERO)
                        .build();

                BigDecimal groupSubtotal = BigDecimal.ZERO;

                for (Map.Entry<String, Long> entry : selection.itemQuantities().entrySet()) {
                    String variantId = entry.getKey();
                    Long qty = entry.getValue();
                    ProductVariant variant = variantMap.get(variantId);

                    if (variant == null)
                        continue;

                    BigDecimal price = Optional.ofNullable(variant.getPrice())
                            .orElse(BigDecimal.ZERO);
                    BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(qty));

                    if (!warehouseStockService.hasSufficientStock(selection.warehouse().getId(), variantId, qty)) {
                        throw new AppException(ErrorCode.INSUFFICIENT_STOCK,
                                String.format("Insufficient stock for %s in warehouse %s", variant.getName(),
                                        selection.warehouse().getName()));
                    }

                    warehouseStockService.reserveStock(selection.warehouse().getId(), variantId, qty);

                    String productImage = variant.getProduct().getImages().stream()
                            .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                            .findFirst()
                            .or(() -> variant.getProduct().getImages().stream().findFirst())
                            .map(ProductImage::getUrl)
                            .orElse(null);

                    OrderItem item = OrderItem.builder()
                            .orderShopGroup(group)
                            .productVariant(variant)
                            .quantity(qty.intValue())
                            .price(price)
                            .productId(variant.getProduct().getId())
                            .productName(variant.getProduct().getName())
                            .productImage(productImage)
                            .variantName(variant.getName())
                            .variantSku(variant.getSku())
                            .build();

                    group.getOrderItems().add(item);
                    groupSubtotal = groupSubtotal.add(lineTotal);
                }

                group.setSubtotal(groupSubtotal);
                group.setTotal(groupSubtotal.add(selection.shippingFee()));

                order.getOrderShopGroups().add(group);

                orderSubtotal = orderSubtotal.add(groupSubtotal);
                orderShippingFee = orderShippingFee.add(selection.shippingFee());
                subtotalByShop.merge(shop.getId(), groupSubtotal, BigDecimal::add);

                log.info("Created OrderShopGroup for shop {} from warehouse {} (split: {})",
                        shop.getId(), selection.warehouse().getName(), selection.isSplit());
            }
        }
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal shippingDiscountAmount = BigDecimal.ZERO;
        BigDecimal shopDiscountAmount = BigDecimal.ZERO;
        BigDecimal shopShippingDiscountAmount = BigDecimal.ZERO;
        BigDecimal appliedPlatformDiscountAmount = BigDecimal.ZERO;
        BigDecimal appliedShopDiscountAmount = BigDecimal.ZERO;
        Coupon appliedCoupon = null;
        Coupon appliedShopCoupon = null;

        if (request.getCouponCode() != null &&
                !request.getCouponCode().isBlank()) {

            appliedCoupon = couponService
                    .validateAndLock(request.getCouponCode(), userId, CouponType.PLATFORM);

            if (appliedCoupon.getDiscountType() == DiscountType.FREE_SHIPPING) {
                shippingDiscountAmount = calculateCouponDiscount(
                        appliedCoupon, orderSubtotal, orderShippingFee);
                appliedPlatformDiscountAmount = shippingDiscountAmount;
            } else {
                discountAmount = calculateCouponDiscount(
                        appliedCoupon, orderSubtotal, orderShippingFee);
                appliedPlatformDiscountAmount = discountAmount;
            }

            order.setCouponId(appliedCoupon.getId());
            order.setCouponCode(appliedCoupon.getCode());

            couponService.incrementUsage(appliedCoupon.getId());
        }

        if (request.getShopCouponCode() != null &&
                !request.getShopCouponCode().isBlank()) {

            if (itemsByShop.size() != 1) {
                throw new AppException(ErrorCode.COUPON_INVALID_FOR_SCOPE);
            }

            appliedShopCoupon = couponService
                    .validateAndLock(request.getShopCouponCode(), userId, CouponType.SHOP);

            String checkedOutShopId = itemsByShop.keySet().iterator().next();
            if (appliedShopCoupon.getShop() != null
                    && !checkedOutShopId.equals(appliedShopCoupon.getShop().getId())) {
                throw new AppException(ErrorCode.COUPON_INVALID_FOR_SCOPE);
            }

            BigDecimal checkedOutShopSubtotal = subtotalByShop.getOrDefault(checkedOutShopId, BigDecimal.ZERO);

            if (appliedShopCoupon.getDiscountType() == DiscountType.FREE_SHIPPING) {
                if (appliedCoupon != null && appliedCoupon.getDiscountType() == DiscountType.FREE_SHIPPING) {
                    throw new AppException(ErrorCode.COUPON_STACKING_NOT_ALLOWED);
                }
                BigDecimal remainingShipping = orderShippingFee.subtract(shippingDiscountAmount).max(BigDecimal.ZERO);
                shopShippingDiscountAmount = calculateCouponDiscount(
                        appliedShopCoupon, checkedOutShopSubtotal, remainingShipping);
                appliedShopDiscountAmount = shopShippingDiscountAmount;
            } else {
                shopDiscountAmount = calculateCouponDiscount(
                        appliedShopCoupon, checkedOutShopSubtotal, orderShippingFee);
                appliedShopDiscountAmount = shopDiscountAmount;
            }

            order.setShopCouponId(appliedShopCoupon.getId());
            order.setShopCouponCode(appliedShopCoupon.getCode());

            couponService.incrementUsage(appliedShopCoupon.getId());
        }

        BigDecimal totalShippingDiscount = shippingDiscountAmount.add(shopShippingDiscountAmount).min(orderShippingFee);
        BigDecimal grossAmount = orderSubtotal.add(orderShippingFee);
        BigDecimal totalDiscount = discountAmount.add(shopDiscountAmount).add(totalShippingDiscount);
        if (totalDiscount.compareTo(grossAmount) > 0) {
            totalDiscount = grossAmount;
        }

        order.setSubtotal(orderSubtotal);
        order.setShippingFee(orderShippingFee);
        order.setDiscountAmount(discountAmount);
        order.setShopDiscountAmount(shopDiscountAmount);
        order.setShippingDiscountAmount(shippingDiscountAmount.add(shopShippingDiscountAmount));
        order.setTotalDiscount(totalDiscount);
        order.setTotal(orderSubtotal.add(orderShippingFee).subtract(totalDiscount));

        Order savedOrder = orderRepository.save(order);

        Set<String> affectedProductIds = variants.stream()
                .map(v -> v.getProduct().getId())
                .collect(Collectors.toSet());
        for (String pid : affectedProductIds) {
            productService.recalculateProductStats(pid);
        }

        if (!checkedOutCartItemIds.isEmpty()) {
            cartItemRepository.deleteByUser_IdAndIdIn(userId, checkedOutCartItemIds);
            log.info("[CHECKOUT] {} checked-out cart items deleted for userId: {}",
                    checkedOutCartItemIds.size(), userId);
        }

        orderNotificationService.notifyOrderCreated(savedOrder.getId());

        if (appliedCoupon != null) {
            CouponUsage usage = CouponUsage.builder()
                    .id(UUID.randomUUID().toString())
                    .coupon(appliedCoupon)
                    .user(user)
                    .order(savedOrder)
                    .discountAmount(appliedPlatformDiscountAmount)
                    .build();
            couponUsageRepository.save(usage);
        }

        if (appliedShopCoupon != null) {
            CouponUsage shopUsage = CouponUsage.builder()
                    .id(UUID.randomUUID().toString())
                    .coupon(appliedShopCoupon)
                    .user(user)
                    .order(savedOrder)
                    .discountAmount(appliedShopDiscountAmount)
                    .build();
            couponUsageRepository.save(shopUsage);
        }

        return mapToResponse(savedOrder);
    }

    @Override
    @Transactional
    public void cancelMyOrder(String orderId, String reason) {

        String userId = AuthUtils.currentUserId();

        Order order = orderRepository.findById(orderId)
                .filter(o -> o.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getStatus() != OrderStatus.PENDING &&
                order.getStatus() != OrderStatus.AWAITING_PAYMENT)
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);

        List<String> variantIds = collectVariantIds(order);

        List<ProductVariant> variants = variantRepository.findByIdsForUpdateWithProduct(new HashSet<>(variantIds));

        Map<String, ProductVariant> variantMap = variants.stream()
                .collect(Collectors.toMap(ProductVariant::getId, v -> v));

        restoreStock(order, variantMap);

        for (OrderShopGroup group : order.getOrderShopGroups()) {
            for (OrderItem item : group.getOrderItems()) {
                if (item.getProductVariant() != null) {
                    ProductVariant v = variantMap.get(item.getProductVariant().getId());
                    if (v != null) {
                        long currentSold = v.getSoldCount() != null ? v.getSoldCount() : 0L;
                        long qty = item.getQuantity();
                        v.setSoldCount(Math.max(0, currentSold - qty));
                    }
                }
            }
        }

        Set<String> affectedProductIds = variants.stream()
                .map(v -> v.getProduct().getId())
                .collect(Collectors.toSet());
        for (String pid : affectedProductIds) {
            productService.recalculateProductStats(pid);
        }

        decrementCouponUsageIfApplied(order.getCouponId());
        decrementCouponUsageIfApplied(order.getShopCouponId());

        couponUsageRepository.deleteByOrder_Id(order.getId());

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelReason(reason);

        orderRepository.save(order);

        orderNotificationService.notifyOrderStatusChanged(
                order.getId(), order.getUser().getId(),
                OrderStatus.PENDING.name(), OrderStatus.CANCELLED.name(),
                order.getCancelReason());
    }

    @Override
    @Transactional
    public void confirmReceipt(String orderId) {

        String userId = AuthUtils.currentUserId();

        Order order = orderRepository.findById(orderId)
                .filter(o -> o.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        order.confirmReceipt();

        // Settle platform commission now that the order is COMPLETED
        commissionService.settleOrderCommission(order.getId());

        orderNotificationService.notifyOrderStatusChanged(
                order.getId(), order.getUser().getId(),
                OrderStatus.DELIVERED.name(), OrderStatus.COMPLETED.name(), null);
    }

    private void validateStock(List<ProductVariant> variants,
            Map<String, Integer> qtyMap) {

        for (ProductVariant v : variants) {
            long stock = Optional.ofNullable(v.getStock()).orElse(0L);
            int qty = qtyMap.getOrDefault(v.getId(), 0);

            if (stock < qty)
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK);
        }
    }

    private void restoreStock(Order order,
            Map<String, ProductVariant> variantMap) {

        for (OrderShopGroup group : order.getOrderShopGroups()) {
            if (group.getWarehouse() == null) {
                log.warn("OrderShopGroup {} has no warehouse, skipping stock release", group.getId());
                continue;
            }

            String warehouseId = group.getWarehouse().getId();
            for (OrderItem item : group.getOrderItems()) {
                if (item.getProductVariant() != null) {
                    String variantId = item.getProductVariant().getId();
                    Long quantity = (long) item.getQuantity();

                    warehouseStockService.releaseReservation(warehouseId, variantId, quantity);
                    log.info("Released reservation of {} units of variant {} from warehouse {}",
                            quantity, variantId, warehouseId);
                }
            }
        }
    }

    private Order buildOrder(User user, CheckoutRequest request) {
        String paymentMethod = request.getPayment() == null ? "COD" : request.getPayment().toUpperCase();

        OrderStatus initialStatus = "COD".equals(paymentMethod)
                ? OrderStatus.PENDING
                : OrderStatus.AWAITING_PAYMENT;

        Boolean isPaid = false;

        return Order.builder()
                .status(initialStatus)
                .payment(paymentMethod)
                .isPaid(isPaid)
                .note(request.getNote())
                .subtotal(BigDecimal.ZERO)
                .shippingFee(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .user(user)
                .build();
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
                                    .productVariantId(i.getProductVariantIdSafely())
                                    .quantity(i.getQuantity())
                                    .price(i.getPrice())
                                    .productId(i.getProductId())
                                    .productName(i.getProductName())
                                    .productImage(i.getProductImage())
                                    .variantName(i.getVariantName())
                                    .variantSku(i.getVariantSku())
                                    .hasReview(i.getCustomerReview() != null)
                                    .build()).toList();

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

    private List<String> collectVariantIds(Order order) {
        List<String> ids = new ArrayList<>();

        for (OrderShopGroup group : order.getOrderShopGroups()) {
            for (OrderItem item : group.getOrderItems()) {
                ids.add(item.getProductVariant().getId());
            }
        }

        return ids;
    }

    private BigDecimal calculateCouponDiscount(Coupon coupon,
            BigDecimal subtotalScope,
            BigDecimal shippingFeeScope) {
        if (coupon == null || coupon.getDiscountType() == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal subtotal = Optional.ofNullable(subtotalScope).orElse(BigDecimal.ZERO);
        if (coupon.getMinOrderAmount() != null && subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            return BigDecimal.ZERO;
        }

        if (coupon.getDiscountType() == DiscountType.FREE_SHIPPING) {
            BigDecimal shipping = Optional.ofNullable(shippingFeeScope).orElse(BigDecimal.ZERO);
            if (shipping.compareTo(BigDecimal.ZERO) <= 0) {
                return BigDecimal.ZERO;
            }

            BigDecimal freeShipDiscount = shipping;
            if (coupon.getDiscountValue() != null
                    && coupon.getDiscountValue().compareTo(BigDecimal.ZERO) > 0) {
                freeShipDiscount = freeShipDiscount.min(coupon.getDiscountValue());
            }
            if (coupon.getMaxDiscount() != null
                    && coupon.getMaxDiscount().compareTo(BigDecimal.ZERO) > 0) {
                freeShipDiscount = freeShipDiscount.min(coupon.getMaxDiscount());
            }

            return freeShipDiscount;
        }

        return coupon.calculateDiscount(subtotalScope);
    }

    private void decrementCouponUsageIfApplied(String couponId) {
        if (couponId == null || couponId.isBlank()) {
            return;
        }

        Coupon coupon = couponRepository.findById(couponId).orElse(null);
        if (coupon == null) {
            return;
        }

        int current = Optional.ofNullable(coupon.getCurrentUsage()).orElse(0);
        if (current > 0) {
            coupon.setCurrentUsage(current - 1);
        }

        if (coupon.getMaxUsage() != null && coupon.getCurrentUsage() < coupon.getMaxUsage()) {
            coupon.setIsActive(true);
        }
    }

    private void loadOrderItemsIntoOrders(List<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return;
        }

        List<String> groupIds = orders.stream()
                .flatMap(o -> o.getOrderShopGroups() == null ? Stream.empty() : o.getOrderShopGroups().stream())
                .map(OrderShopGroup::getId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (groupIds.isEmpty()) {
            return;
        }

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

}
