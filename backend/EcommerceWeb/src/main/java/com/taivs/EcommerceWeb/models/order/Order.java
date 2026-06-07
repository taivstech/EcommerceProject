package com.taivs.EcommerceWeb.models.order;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders",
        indexes = {
                @Index(name = "idx_orders_user_id", columnList = "user_id, created_at"),
                @Index(name = "idx_orders_status", columnList = "status"),
                @Index(name = "idx_orders_created_at", columnList = "created_at"),
                @Index(name = "idx_orders_payment", columnList = "payment")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private OrderStatus status;

    @Column(name = "cancel_reason", length = 255)
    private String cancelReason;

    private BigDecimal total;

    @Column(name = "shipping_fee")
    private BigDecimal shippingFee;
    private BigDecimal subtotal;

    @Column(name = "total_discount")
    private BigDecimal totalDiscount;

    @CreationTimestamp
    @Column(updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(length = 20)
    private String payment;

    @Column(name = "coupon_id")
    private String couponId;

    @Column(name = "coupon_code")
    private String couponCode;

    @Column(name = "shop_coupon_id")
    private String shopCouponId;

    @Column(name = "shop_coupon_code")
    private String shopCouponCode;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "shop_discount_amount", precision = 15, scale = 2)
    private BigDecimal shopDiscountAmount = BigDecimal.ZERO;

    @Column(name = "shipping_discount_amount", precision = 15, scale = 2)
    private BigDecimal shippingDiscountAmount = BigDecimal.ZERO;

    @Column(name = "is_paid", nullable = false)
    @Builder.Default
    private Boolean isPaid = false;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    @Column(name = "note", length = 500)
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private ShippingAddress shippingAddress;

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderShopGroup> orderShopGroups = new ArrayList<>();

    public void confirmReceipt() {
        if (status != OrderStatus.DELIVERED) {
            throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }
        this.status = OrderStatus.COMPLETED;
        this.isPaid = true;
    }

    public void changeStatus(OrderStatus target) {

        switch (this.status) {
            case AWAITING_PAYMENT -> {
                if (target != OrderStatus.PENDING &&
                        target != OrderStatus.CANCELLED)
                    throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
            }
            case PENDING -> {
                if (target != OrderStatus.CONFIRMED &&
                        target != OrderStatus.CANCELLED)
                    throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
            }
            case CONFIRMED -> {
                if (target != OrderStatus.SHIPPING &&
                        target != OrderStatus.CANCELLED)
                    throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
            }
            case SHIPPING -> {
                if (target != OrderStatus.DELIVERED)
                    throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
            }
            case DELIVERED -> {
                if (target != OrderStatus.COMPLETED)
                    throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
            }
            default -> throw new AppException(ErrorCode.INVALID_ORDER_STATUS);
        }

        if (target == OrderStatus.COMPLETED) {
            this.isPaid = true;
        }
        this.status = target;
    }

    public Boolean getIsPaid() {
        return isPaid != null && (isPaid || status == OrderStatus.COMPLETED);
    }

}


