package com.taivs.EcommerceWeb.repositories.product;

import com.taivs.EcommerceWeb.models.product.SearchSuggestion;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SearchSuggestionRepository extends JpaRepository<SearchSuggestion, String> {

    /**
     * Find active suggestions whose keyword starts with the given prefix (case-insensitive).
     * Ordered by search_count DESC so most popular terms appear first.
     */
    @Query("""
            SELECT s FROM SearchSuggestion s
            WHERE s.isActive = true
              AND LOWER(s.keyword) LIKE LOWER(CONCAT(:prefix, '%'))
            ORDER BY s.searchCount DESC
            """)
    List<SearchSuggestion> findByPrefixOrderByPopularity(@Param("prefix") String prefix, Pageable pageable);

    /**
     * Find active suggestions containing the query anywhere (broader fallback).
     * Used when prefix search returns fewer than the limit.
     */
    @Query("""
            SELECT s FROM SearchSuggestion s
            WHERE s.isActive = true
              AND LOWER(s.keyword) LIKE LOWER(CONCAT('%', :query, '%'))
              AND LOWER(s.keyword) NOT LIKE LOWER(CONCAT(:query, '%'))
            ORDER BY s.searchCount DESC
            """)
    List<SearchSuggestion> findByContainsOrderByPopularity(@Param("query") String query, Pageable pageable);

    /** Increment the search count by 1 when a term is actually clicked/searched. */
    @Modifying
    @Query("UPDATE SearchSuggestion s SET s.searchCount = s.searchCount + 1 WHERE s.id = :id")
    void incrementCount(@Param("id") String id);

    /** Check if a keyword already exists (for deduplication on import). */
    Optional<SearchSuggestion> findByKeywordIgnoreCase(String keyword);

    /** Top-N globally popular terms (for empty-input trending display). */
    @Query("SELECT s FROM SearchSuggestion s WHERE s.isActive = true ORDER BY s.searchCount DESC")
    List<SearchSuggestion> findTopPopular(Pageable pageable);
}
