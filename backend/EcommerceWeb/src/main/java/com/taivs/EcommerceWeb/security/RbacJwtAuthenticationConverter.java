package com.taivs.EcommerceWeb.security;

import com.taivs.EcommerceWeb.repositories.auth.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;

@Component
public class RbacJwtAuthenticationConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {

        Collection<GrantedAuthority> authorities = new ArrayList<>();

        String scope = jwt.getClaimAsString("scope");

        if (scope == null || scope.isBlank()) {
            return authorities;
        }

        String[] items = scope.split(" ");

        for (String item : items) {
            authorities.add(new SimpleGrantedAuthority(item));
        }

        return authorities;
    }
}
