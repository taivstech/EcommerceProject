package com.taivs.EcommerceWeb.serviceimpl.warehouse;

import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.dto.warehouse.InventorySummaryDto;
import com.taivs.EcommerceWeb.dto.warehouse.ProductAgingDto;
import com.taivs.EcommerceWeb.dto.warehouse.RecentSaleDto;
import com.taivs.EcommerceWeb.dto.warehouse.StockAlertDto;
import com.taivs.EcommerceWeb.services.warehouse.InventoryService;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.repositories.order.OrderItemRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.product.ProductImage;
import com.taivs.EcommerceWeb.models.product.ProductVariant;
import com.taivs.EcommerceWeb.repositories.product.ProductRepository;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.utils.AuthUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryServiceImpl implements InventoryService {

    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional(readOnly = true)
    public InventorySummaryDto getInventorySummary() {
        Shop shop = getMyShop();
        List<Product> products = productRepository.findByShopIdWithVariants(shop.getId());

        long totalProducts = products.size();
        long totalVariants = 0;
        long totalStock = 0;
        long totalSold = 0;
        long critical = 0;
        long low = 0;
        long outOfStock = 0;

        for (Product product : products) {
            for (ProductVariant v : product.getVariants()) {
                totalVariants++;
                long stock = v.getStock() != null ? v.getStock() : 0;
                long sold = v.getSoldCount() != null ? v.getSoldCount() : 0;
                totalStock += stock;
                totalSold += sold;

                if (stock == 0) outOfStock++;
                else if (stock <= 5) critical++;
                else if (stock <= 20) low++;
            }
        }

        LocalDateTime ninetyDaysAgo = LocalDateTime.now().minusDays(90);
        long deadStock = products.stream()
                .filter(p -> (p.getTotalSold() == null || p.getTotalSold() == 0)
                        && p.getCreatedAt() != null
                        && p.getCreatedAt().isBefore(ninetyDaysAgo))
                .count();

        double avgTurnover = totalStock > 0 ? (double) totalSold / totalStock : 0.0;

        return InventorySummaryDto.builder()
                .totalProducts(totalProducts)
                .totalVariants(totalVariants)
                .totalStockUnits(totalStock)
                .totalSoldUnits(totalSold)
                .criticalStockItems(critical)
                .lowStockItems(low)
                .outOfStockItems(outOfStock)
                .deadStockItems(deadStock)
                .averageTurnoverRate(Math.round(avgTurnover * 100.0) / 100.0)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockAlertDto> getStockAlerts(int threshold) {
        Shop shop = getMyShop();
        List<Product> products = productRepository.findByShopIdWithVariants(shop.getId());

        List<StockAlertDto> alerts = new ArrayList<>();
        for (Product product : products) {
            String mainImage = product.getImages().stream()
                    .findFirst()
                    .map(ProductImage::getUrl)
                    .orElse(null);

            for (ProductVariant v : product.getVariants()) {
                long stock = v.getStock() != null ? v.getStock() : 0;
                if (stock <= threshold) {
                    String alertLevel;
                    if (stock == 0) alertLevel = "OUT_OF_STOCK";
                    else if (stock <= 5) alertLevel = "CRITICAL";
                    else alertLevel = "LOW";

                    alerts.add(StockAlertDto.builder()
                            .productId(product.getId())
                            .productName(product.getName())
                            .variantId(v.getId())
                            .variantName(v.getName())
                            .sku(v.getSku())
                            .currentStock(stock)
                            .soldCount(v.getSoldCount())
                            .price(v.getPrice())
                            .alertLevel(alertLevel)
                            .mainImageUrl(mainImage)
                            .build());
                }
            }
        }

        alerts.sort(Comparator.comparingInt(a -> switch (a.getAlertLevel()) {
            case "OUT_OF_STOCK" -> 0;
            case "CRITICAL" -> 1;
            default -> 2;
        }));

        return alerts;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductAgingDto> getProductAging() {
        Shop shop = getMyShop();
        List<Product> products = productRepository.findByShopIdWithVariants(shop.getId());

        LocalDateTime now = LocalDateTime.now();

        return products.stream().map(product -> {
            long totalStock = 0;
            long totalSold = 0;
            BigDecimal minPrice = null;
            BigDecimal maxPrice = null;

            for (ProductVariant v : product.getVariants()) {
                totalStock += v.getStock() != null ? v.getStock() : 0;
                totalSold += v.getSoldCount() != null ? v.getSoldCount() : 0;
                if (minPrice == null || (v.getPrice() != null && v.getPrice().compareTo(minPrice) < 0)) {
                    minPrice = v.getPrice();
                }
                if (maxPrice == null || (v.getPrice() != null && v.getPrice().compareTo(maxPrice) > 0)) {
                    maxPrice = v.getPrice();
                }
            }

            long daysInInventory = product.getCreatedAt() != null
                    ? ChronoUnit.DAYS.between(product.getCreatedAt(), now) : 0;

            double turnoverRate = totalStock > 0 ? (double) totalSold / totalStock : 0.0;

            String agingCategory;
            if (turnoverRate >= 2.0) agingCategory = "FAST_MOVING";
            else if (turnoverRate >= 0.5) agingCategory = "NORMAL";
            else if (totalSold > 0) agingCategory = "SLOW_MOVING";
            else agingCategory = "DEAD_STOCK";

            String mainImage = product.getImages().stream()
                    .findFirst()
                    .map(ProductImage::getUrl)
                    .orElse(null);

            return ProductAgingDto.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .mainImageUrl(mainImage)
                    .totalStock(totalStock)
                    .totalSold(totalSold)
                    .minPrice(minPrice)
                    .maxPrice(maxPrice)
                    .createdAt(product.getCreatedAt())
                    .daysInInventory(daysInInventory)
                    .turnoverRate(Math.round(turnoverRate * 100.0) / 100.0)
                    .agingCategory(agingCategory)
                    .build();
        }).sorted(Comparator.comparingInt((ProductAgingDto a) -> switch (a.getAgingCategory()) {
            case "DEAD_STOCK" -> 0;
            case "SLOW_MOVING" -> 1;
            case "NORMAL" -> 2;
            default -> 3;
        })).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecentSaleDto> getRecentSales(int limit) {
        String userId = AuthUtils.currentUserId();
        List<Order> orders = orderRepository.findBySellerUserIdWithShippingAndGroupsOrderByCreatedAtDesc(userId);

        List<String> orderIds = orders.stream().map(Order::getId).toList();
        if (orderIds.isEmpty()) return Collections.emptyList();

        List<OrderItem> allItems = orderItemRepository.findByOrderIdsWithGroupAndVariant(orderIds);

        List<RecentSaleDto> sales = new ArrayList<>();
        for (OrderItem item : allItems) {
            Order order = item.getOrderShopGroup().getOrder();
            sales.add(RecentSaleDto.builder()
                    .orderId(order.getId())
                    .productId(item.getProductId())
                    .productName(item.getProductName())
                    .variantName(item.getVariantName())
                    .quantity((long) item.getQuantity())
                    .unitPrice(item.getPrice())
                    .totalAmount(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .orderDate(order.getCreatedAt())
                    .orderStatus(order.getStatus().name())
                    .buyerName(order.getUser() != null ? order.getUser().getFullName() : null)
                    .build());
        }

        sales.sort(Comparator.comparing(RecentSaleDto::getOrderDate, Comparator.nullsLast(Comparator.reverseOrder())));
        if (sales.size() > limit) {
            return sales.subList(0, limit);
        }
        return sales;
    }

    private Shop getMyShop() {
        String userId = AuthUtils.currentUserId();
        return shopRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));
    }


}
