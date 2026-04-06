package com.taivs.EcommerceWeb.models.warehouse;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "warehouse_employees",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_warehouse_employee",
                        columnNames = {"warehouse_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_wh_emp_warehouse_id", columnList = "warehouse_id"),
                @Index(name = "idx_wh_emp_user_id", columnList = "user_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseEmployee extends BaseEntity {

    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 50)
    @Builder.Default
    private String role = "EMPLOYEE";
}
