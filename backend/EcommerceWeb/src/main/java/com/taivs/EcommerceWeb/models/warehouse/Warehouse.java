package com.taivs.EcommerceWeb.models.warehouse;

import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "warehouses",
        indexes = {
                @Index(name = "idx_warehouses_shop_id", columnList = "shop_id"),
                @Index(name = "idx_warehouses_status", columnList = "status"),
                @Index(name = "idx_warehouses_ghn_shop_id", columnList = "ghn_shop_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Warehouse extends BaseEntity {

    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "contact_name", length = 100)
    private String contactName;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "detail_address", columnDefinition = "TEXT")
    private String detailAddress;

    @Column(name = "full_address", columnDefinition = "TEXT")
    private String fullAddress;

    @Column(length = 100)
    private String ward;

    @Column(name = "ward_code", length = 20)
    private String wardCode;

    @Column(length = 100)
    private String district;

    @Column(name = "district_id")
    private Integer districtId;

    @Column(length = 100)
    private String province;

    @Column(name = "province_id", length = 10)
    private String provinceId;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    /**
     * GHN Shop ID — Each warehouse registers as a separate GHN "shop" (pickup point).
     * This is returned by GHN's register-shop API and used as the ShopId header
     * when creating shipping orders from this warehouse.
     */
    @Column(name = "ghn_shop_id")
    private Integer ghnShopId;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Builder.Default
    @OneToMany(mappedBy = "warehouse", cascade = CascadeType.ALL, orphanRemoval = true)
        private Set<WarehouseEmployee> employees = new HashSet<>();
}
