package com.taivs.EcommerceWeb.models.auth;

import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "permissions",
        indexes = {
                @Index(name = "idx_permissions_module", columnList = "module")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission extends BaseEntity {

    @Id
    @Column(length = 50)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    private String module;

    private String description;


}