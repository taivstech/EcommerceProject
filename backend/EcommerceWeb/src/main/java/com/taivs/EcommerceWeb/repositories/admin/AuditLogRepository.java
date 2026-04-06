package com.taivs.EcommerceWeb.repositories.admin;

import com.taivs.EcommerceWeb.models.admin.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(String userId);

    List<AuditLog> findByActionOrderByCreatedAtDesc(String action);

    List<AuditLog> findTop50ByOrderByCreatedAtDesc();
}
