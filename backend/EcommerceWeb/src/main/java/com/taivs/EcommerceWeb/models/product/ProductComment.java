package com.taivs.EcommerceWeb.models.product;

import com.taivs.EcommerceWeb.models.common.BaseEntity;
import com.taivs.EcommerceWeb.models.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_comments",
        indexes = {
                @Index(name = "idx_comments_product_id", columnList = "product_id"),
                @Index(name = "idx_comments_left_right", columnList = "comment_left, comment_right")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductComment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "comment_left", nullable = false)
    private Integer leftValue;

    @Column(name = "comment_right", nullable = false)
    private Integer rightValue;

    @Column(name = "parent_id", length = 36)
    private String parentId;
}
