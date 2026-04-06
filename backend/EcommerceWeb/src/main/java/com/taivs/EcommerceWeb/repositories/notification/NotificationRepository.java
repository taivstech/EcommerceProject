package com.taivs.EcommerceWeb.repositories.notification;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, String> {

    @Query("""
            select n
            from Notification n
            join fetch n.user u
            where n.user.id = :userId
            order by n.createdAt desc
            """)
    List<Notification> findAllByUserIdOrderByCreatedAtDesc(@Param("userId") String userId);

    @Query("""
            select count(n)
            from Notification n
            where n.user.id = :userId and n.status = 'UNREAD'
            """)
    long countUnreadByUserId(@Param("userId") String userId);

    @Query("""
            select count(n)
            from Notification n
            where n.user.id = :userId
              and n.status = 'UNREAD'
              and upper(n.type) not like '%MESSAGE%'
              and upper(n.type) not like '%CHAT%'
            """)
    long countUnreadOrderNotificationsByUserId(@Param("userId") String userId);
}

