package com.taivs.EcommerceWeb.models.admin;

import com.taivs.EcommerceWeb.models.common.BaseEntity;
import com.taivs.EcommerceWeb.models.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "search_history",
        indexes = {
                @Index(name = "idx_search_history_user", columnList = "user_id, searched_at DESC"),
                @Index(name = "idx_search_history_keyword", columnList = "keyword")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchHistory extends BaseEntity {

    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String keyword;
}
