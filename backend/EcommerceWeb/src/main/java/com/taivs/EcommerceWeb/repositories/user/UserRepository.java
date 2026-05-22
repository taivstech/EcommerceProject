package com.taivs.EcommerceWeb.repositories.user;

import com.taivs.EcommerceWeb.models.auth.Permission;
import com.taivs.EcommerceWeb.models.auth.Role;
import com.taivs.EcommerceWeb.models.user.User;
import jakarta.validation.constraints.Size;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User,String> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByUsername(@Size(min = 4, message = "USERNAME_INVALID") String username);

    boolean existsByEmail(String email);

    Optional<User> findByUsernameAndActive(String name, boolean b);

    Optional<User> findByIdAndActive(String id, boolean b);

    long countByActive(Boolean active);

    @Query("""
    SELECT u FROM User u
    LEFT JOIN FETCH u.userRoles ur
    LEFT JOIN FETCH ur.role r
    WHERE u.username = :username
""")
    Optional<User> findByUsernameWithRoles(@Param("username") String username);

    @Query("""
    SELECT u FROM User u
    LEFT JOIN FETCH u.userRoles ur
    LEFT JOIN FETCH ur.role r
    LEFT JOIN FETCH r.rolePermissions rp
    LEFT JOIN FETCH rp.permission p
    WHERE u.id = :id
""")
    Optional<User> findByIdWithRoles(@Param("id") String id);

    @Query("""
    SELECT u FROM User u
    LEFT JOIN FETCH u.userRoles ur
    LEFT JOIN FETCH ur.role r
    LEFT JOIN FETCH r.rolePermissions rp
    LEFT JOIN FETCH rp.permission p
    WHERE LOWER(u.email) = LOWER(:email)
""")
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    @Query("""
    SELECT u FROM User u
    LEFT JOIN FETCH u.userRoles ur
    LEFT JOIN FETCH ur.role r
    WHERE LOWER(u.email) = LOWER(:emailOrPhone) OR u.phone = :emailOrPhone
""")
    Optional<User> findByEmailOrPhoneWithRoles(@Param("emailOrPhone") String emailOrPhone);

    /** Daily new user registrations for growth chart */
    @Query("""
        SELECT FUNCTION('DATE', u.createdAt), COUNT(u)
        FROM User u
        WHERE u.createdAt >= :since
        GROUP BY FUNCTION('DATE', u.createdAt)
        ORDER BY FUNCTION('DATE', u.createdAt) ASC
    """)
    List<Object[]> findDailyUserRegistrations(@Param("since") LocalDateTime since);

    @Query("""
        SELECT u FROM User u
        WHERE u.active = true
          AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY u.fullName
    """)
    org.springframework.data.domain.Page<User> searchUsers(@Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);
}
