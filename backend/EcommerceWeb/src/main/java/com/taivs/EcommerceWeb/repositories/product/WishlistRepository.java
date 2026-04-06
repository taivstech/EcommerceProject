package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.product.ProductImage;
import com.taivs.EcommerceWeb.dto.response.product.WishlistResponse;
import com.taivs.EcommerceWeb.models.product.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, String> {

    @Query("""
            select distinct w from Wishlist w
            join fetch w.product p
            left join fetch p.images img
            where w.user.id = :userId
            order by w.createdAt desc
            """)
    List<Wishlist> findByUserIdOrderByAddedAtDesc(@Param("userId") String userId);

    @Query("""
            select w from Wishlist w
            join fetch w.product p
            where w.user.id = :userId and p.id = :productId
            """)
    Optional<Wishlist> findByUserIdAndProductId(@Param("userId") String userId, @Param("productId") String productId);

    @Query("""
            select count(w) > 0 from Wishlist w
            where w.user.id = :userId and w.product.id = :productId
            """)
    boolean existsByUserIdAndProductId(@Param("userId") String userId, @Param("productId") String productId);

    @Query("""
SELECT new com.taivs.EcommerceWeb.dto.response.product.WishlistResponse(
    w.id,
    p.id,
    p.name,
    COALESCE(
        (SELECT img.url FROM ProductImage img 
         WHERE img.product.id = p.id AND img.isMain = true),
        (SELECT img2.url FROM ProductImage img2 
         WHERE img2.product.id = p.id)
    ),
    w.createdAt
)
FROM Wishlist w
JOIN w.product p
WHERE w.user.id = :userId
ORDER BY w.createdAt DESC
""")
    List<WishlistResponse> findWishlistOfUser(String userId);

}
