package com.taivs.EcommerceWeb.models.order;

import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "shipping_addresses",
        indexes = {@Index(name = "idx_shipping_order_id", columnList = "order_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingAddress extends BaseEntity {
    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "receiver_name", nullable = false)
    private String receiverName;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(columnDefinition = "TEXT", name = "full_address")
    private String fullAddress;

    @Column(columnDefinition = "TEXT", name = "detail_address")
    private String detailAddress;

    private String ward;
    @Column(name = "ward_code")
    private String wardCode;
    private String district;
    @Column(name = "district_id")
    private Integer districtId;
    private String province;
    @Column(name = "province_id")
    private String provinceId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;
}

