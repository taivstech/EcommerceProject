package com.taivs.EcommerceWeb.repositories.admin;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.admin.SearchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SearchHistoryRepository extends JpaRepository<SearchHistory, String> {

    @Query("""
            SELECT sh FROM SearchHistory sh
            WHERE sh.user.id = :userId
            ORDER BY sh.createdAt DESC
            """)
    List<SearchHistory> findRecentByUserId(@Param("userId") String userId);

    @Query("""
            SELECT sh FROM SearchHistory sh
            WHERE sh.user.id = :userId AND sh.keyword = :keyword
            """)
    Optional<SearchHistory> findByUserIdAndKeyword(@Param("userId") String userId,
                                                    @Param("keyword") String keyword);

    @Modifying
    @Query("DELETE FROM SearchHistory sh WHERE sh.user.id = :userId")
    void deleteAllByUserId(@Param("userId") String userId);

    @Modifying
    @Query("DELETE FROM SearchHistory sh WHERE sh.id = :id AND sh.user.id = :userId")
    void deleteByIdAndUserId(@Param("id") String id, @Param("userId") String userId);
}
