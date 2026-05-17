package com.taivs.EcommerceWeb.repositories.order;

import com.taivs.EcommerceWeb.models.order.CommissionRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface CommissionRateRepository extends JpaRepository<CommissionRate, String> {

    /**
     * Get the active commission rate for a specific category.
     * Returns empty if no category-specific rate exists (caller should fall back to default).
     */
    Optional<CommissionRate> findByCategoryIdAndIsActiveTrue(String categoryId);

    /**
     * Get the global default rate (categoryId = null, active = true).
     */
    @Query("SELECT r FROM CommissionRate r WHERE r.categoryId IS NULL AND r.isActive = true ORDER BY r.createdAt DESC")
    Optional<CommissionRate> findDefaultRate();

    /** All active rates, ordered for display */
    List<CommissionRate> findByIsActiveTrueOrderByCategoryNameAsc();

    /** All rates including inactive (admin management) */
    List<CommissionRate> findAllByOrderByCreatedAtDesc();
}
