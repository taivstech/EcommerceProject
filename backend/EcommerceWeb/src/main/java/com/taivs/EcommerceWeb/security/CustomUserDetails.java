package com.taivs.EcommerceWeb.security;

import com.taivs.EcommerceWeb.models.auth.Permission;
import com.taivs.EcommerceWeb.models.auth.Role;
import com.taivs.EcommerceWeb.models.user.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class CustomUserDetails implements UserDetails {

    private final String userId;
    private final String username;
    private final String passwordHash;
    private final Set<GrantedAuthority> authorities;
    private final boolean enabled;

    public CustomUserDetails(User user) {
        this.userId = user.getId().toString();
        this.username = user.getUsername();
        this.passwordHash = user.getPassword() != null ? user.getPassword() : "";
        this.enabled = user.getActive() != null ? user.getActive() : true;
        this.authorities = mapAuthorities(user);
    }

    private Set<GrantedAuthority> mapAuthorities(User user) {
        Set<GrantedAuthority> auths = new HashSet<>();
        if (user.getRoles() != null) {
            user.getRoles().forEach(role -> {
                auths.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
                if (role.getPermissions() != null) {
                    role.getPermissions().forEach(permission ->
                            auths.add(new SimpleGrantedAuthority(permission.getName()))
                    );
                }
            });
        }
        return auths;
    }

    public String getUserId() {
        return userId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}

