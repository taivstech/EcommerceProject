package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.product.ProductComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductCommentRepository extends JpaRepository<ProductComment, String> {

    List<ProductComment> findByProductIdAndParentIdIsNullOrderByLeftValueAsc(String productId);

    @Query("""
        SELECT pc FROM ProductComment pc 
        WHERE pc.product.id = :productId 
          AND pc.leftValue > :left 
          AND pc.rightValue < :right 
        ORDER BY pc.leftValue ASC
    """)
    List<ProductComment> findReplies(
            @Param("productId") String productId,
            @Param("left") Integer left,
            @Param("right") Integer right
    );

    @Query("SELECT MAX(pc.rightValue) FROM ProductComment pc WHERE pc.product.id = :productId")
    Integer findMaxRightValueByProductId(@Param("productId") String productId);

    @Modifying
    @Query("UPDATE ProductComment pc SET pc.rightValue = pc.rightValue + 2 WHERE pc.product.id = :productId AND pc.rightValue >= :parentRight")
    void shiftRightValuesForInsert(@Param("productId") String productId, @Param("parentRight") Integer parentRight);

    @Modifying
    @Query("UPDATE ProductComment pc SET pc.leftValue = pc.leftValue + 2 WHERE pc.product.id = :productId AND pc.leftValue > :parentRight")
    void shiftLeftValuesForInsert(@Param("productId") String productId, @Param("parentRight") Integer parentRight);

    @Modifying
    @Query("DELETE FROM ProductComment pc WHERE pc.product.id = :productId AND pc.leftValue >= :left AND pc.rightValue <= :right")
    void deleteCommentsInRange(@Param("productId") String productId, @Param("left") Integer left, @Param("right") Integer right);

    @Modifying
    @Query("UPDATE ProductComment pc SET pc.rightValue = pc.rightValue - :width WHERE pc.product.id = :productId AND pc.rightValue > :right")
    void shiftRightValuesForDelete(@Param("productId") String productId, @Param("right") Integer right, @Param("width") Integer width);

    @Modifying
    @Query("UPDATE ProductComment pc SET pc.leftValue = pc.leftValue - :width WHERE pc.product.id = :productId AND pc.leftValue > :right")
    void shiftLeftValuesForDelete(@Param("productId") String productId, @Param("right") Integer right, @Param("width") Integer width);
}
