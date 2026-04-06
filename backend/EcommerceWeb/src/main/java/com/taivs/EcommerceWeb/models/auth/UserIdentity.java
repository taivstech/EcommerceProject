package com.taivs.EcommerceWeb.models.auth;

import com.taivs.EcommerceWeb.enums.auth.AuthProviderType;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import com.taivs.EcommerceWeb.models.user.User;

@Entity
@Table(
        name = "user_identity",
        uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_user_id"})
)
@Getter
@Setter
public class UserIdentity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private AuthProviderType provider;

    @Column(name = "provider_user_id")
    private String providerUserId;

    @Column(name = "provider_email")
    private String providerEmail;

    @Column(name = "linked_at")
    private Instant linkedAt;

}

