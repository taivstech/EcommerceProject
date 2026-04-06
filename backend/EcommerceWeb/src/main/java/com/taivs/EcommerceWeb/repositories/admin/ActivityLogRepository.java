package com.taivs.EcommerceWeb.repositories.admin;

import com.taivs.EcommerceWeb.models.admin.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, String> {

    @Query("""
            select al from ActivityLog al
            where al.userId = :userId
            order by al.createdAt desc
            """)
    List<ActivityLog> findByUserIdOrderByCreatedAtDesc(@Param("userId") String userId);

    Page<ActivityLog> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    @Query("""
            select al from ActivityLog al
            where al.action = :action
            and al.createdAt >= :startDate
            order by al.createdAt desc
            """)
    List<ActivityLog> findByActionAndCreatedAtAfter(
            @Param("action") String action,
            @Param("startDate") LocalDateTime startDate
    );

    @Query("""
            select al from ActivityLog al
            where al.userId = :userId
            and al.action = :action
            order by al.createdAt desc
            """)
    List<ActivityLog> findByUserIdAndAction(
            @Param("userId") String userId,
            @Param("action") String action
    );

}
