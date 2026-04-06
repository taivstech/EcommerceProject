package com.taivs.EcommerceWeb.models.user;

import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_addresses",
        indexes = {
                @Index(name = "idx_user_id", columnList = "user_id"),
                @Index(name = "idx_default_address", columnList = "user_id, default_address")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAddress extends BaseEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "receiver_name", nullable = false)
    private String receiverName;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(columnDefinition = "TEXT")
    private String fullAddress;

    @Column(columnDefinition = "TEXT")
    private String detailAddress;

    private String ward;

    @Column(name = "ward_code")
    private String wardCode;

    private String district;

    @Column(name = "district_id")
    private Integer districtId;

    private String province;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "default_address")
    private Boolean defaultAddress = false;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
