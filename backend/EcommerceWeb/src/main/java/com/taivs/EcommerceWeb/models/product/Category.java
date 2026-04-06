package com.taivs.EcommerceWeb.models.product;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.common.BaseEntity;
import jakarta.persistence.*;
        import lombok.*;
        import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "categories",
        indexes = {
                @Index(name = "idx_categories_name", columnList = "name")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category extends BaseEntity {
    @Id
    @Column(length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String imageUrl;

    @Builder.Default
    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
        private Set<Product> products = new HashSet<>();
}

