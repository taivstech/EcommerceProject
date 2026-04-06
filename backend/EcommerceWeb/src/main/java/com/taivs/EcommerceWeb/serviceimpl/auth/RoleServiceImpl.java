package com.taivs.EcommerceWeb.serviceimpl.auth;

import com.taivs.EcommerceWeb.dto.request.auth.RoleRequest;
import com.taivs.EcommerceWeb.dto.response.auth.RoleResponse;
import com.taivs.EcommerceWeb.models.auth.Role;
import com.taivs.EcommerceWeb.mappers.auth.RoleMapper;
import com.taivs.EcommerceWeb.repositories.auth.RoleRepository;
import com.taivs.EcommerceWeb.services.auth.RoleService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {
    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;

    @Override
    @Transactional
    public RoleResponse create(RoleRequest request) {
        if (request == null || request.getId() == null || request.getId().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        String roleName = request.getId().trim();
        if (roleRepository.findByName(roleName).isPresent()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        Role role = new Role();
        role.setName(roleName);
        role.setDescription(request.getDescription());
        Role saved = roleRepository.save(role);
        return roleMapper.toRoleResponse(saved);
    }

    @Override
    public List<RoleResponse> getAll() {
        return roleRepository.findAll().stream().map(roleMapper::toRoleResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteByName(String roleName) {
        if (roleName == null || roleName.isBlank()) return;
        Role role = roleRepository.findByName(roleName.trim())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTS));
        roleRepository.delete(role);
    }
}
