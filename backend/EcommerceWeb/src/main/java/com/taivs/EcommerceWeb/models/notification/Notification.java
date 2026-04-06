package com.taivs.EcommerceWeb.models.notification;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications",
        indexes = {
                @Index(name = "idx_user_id", columnList = "user_id, created_at"),
                @Index(name = "idx_status", columnList = "user_id, status"),
                @Index(name = "idx_type", columnList = "type"),
                @Index(name = "idx_created_at", columnList = "created_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 50, nullable = false)
    private String type;

    @Column(length = 200, nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 20)
    private String status;

    @Column(name = "read_at")
    private LocalDateTime readAt;


    @Column(name = "reference_id", length = 36)
    private String referenceId;

    @Column(name = "reference_type", length = 30)
    private String referenceType;
}

