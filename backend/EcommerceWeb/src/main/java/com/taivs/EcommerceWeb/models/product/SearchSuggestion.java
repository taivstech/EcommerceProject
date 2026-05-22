package com.taivs.EcommerceWeb.models.product;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Stores curated popular search terms (Shopee-style autocomplete).
 * Each term has a keyword, a search_count for ranking, and a category tag for filtering.
 */
@Entity
@Table(
        name = "search_suggestions",
        indexes = {
                @Index(name = "idx_ss_keyword", columnList = "keyword"),
                @Index(name = "idx_ss_count", columnList = "search_count DESC"),
                @Index(name = "idx_ss_active", columnList = "is_active")
        }
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 200, unique = true)
    private String keyword;

    @Column(name = "search_count", nullable = false)
    @Builder.Default
    private Long searchCount = 0L;

    @Column(length = 100)
    private String category;


    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
