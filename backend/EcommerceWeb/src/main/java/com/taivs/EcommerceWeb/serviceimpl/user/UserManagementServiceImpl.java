package com.taivs.EcommerceWeb.serviceimpl.user;

import com.taivs.EcommerceWeb.dto.request.user.ActiveUserRequest;
import com.taivs.EcommerceWeb.dto.request.user.DeactivateUser;
import com.taivs.EcommerceWeb.dto.request.user.UpdateOwnProfile;
import com.taivs.EcommerceWeb.dto.request.user.UpgradeSellerRequest;
import com.taivs.EcommerceWeb.dto.request.user.UserCreationRequest;
import com.taivs.EcommerceWeb.dto.request.user.UserUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.user.UserResponse;
import com.taivs.EcommerceWeb.models.auth.Role;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.auth.UserRole;
import com.taivs.EcommerceWeb.models.auth.UserRoleId;
import com.taivs.EcommerceWeb.mappers.user.UserMapper;
import com.taivs.EcommerceWeb.repositories.auth.RoleRepository;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.repositories.auth.UserRoleRepository;
import com.taivs.EcommerceWeb.services.user.UserManagementService;
import com.taivs.EcommerceWeb.services.media.FileStorageService;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import com.taivs.EcommerceWeb.constants.PredefinedRole;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.utils.RedisCacheHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final RedisCacheHelper cacheHelper;
    private final FileStorageService fileStorageService;
    private final ShopRepository shopRepository;

    private static final String UPGRADE_SELLER_SNAPSHOT_KEY_PREFIX = "upgrade_seller:snapshot:";
    private static final int UPGRADE_SELLER_SNAPSHOT_TTL_SECONDS = 10 * 60;

    private record UpgradeSellerSnapshot(String userId, Set<String> roleNames) {}

    @Override
    @Transactional
    public UserResponse createUser(UserCreationRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActive(false);

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        Role role = roleRepository.findById(PredefinedRole.USER)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTS));

        UserRole userRole = UserRole.builder().user(user).role(role).build();
        userRoleRepository.save(userRole);

        return userMapper.toUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMyInfo() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
        return userMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateMyInfo(UpdateOwnProfile request, MultipartFile avatarFile) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            if (!request.getUsername().equals(user.getUsername()) &&
                    userRepository.existsByUsername(request.getUsername())) {
                throw new AppException(ErrorCode.USER_EXISTED);
            }
            user.setUsername(request.getUsername());
        }

        user.setPhone(request.getPhone());
        user.setFullName(request.getFullName());
        user.setDob(request.getDob());

        if (avatarFile != null && !avatarFile.isEmpty()) {
            String avatarUrl = fileStorageService.uploadAndGetUrl(avatarFile, "/avatars");
            user.setProfilePicture(avatarUrl);
        }

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<UserResponse> getUsers(org.springframework.data.domain.Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(String id) {
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    @Override
    @Transactional
    public void activeUser(ActiveUserRequest activeUserRequest) {
        User user = userRepository.findById(activeUserRequest.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setActive(true);
    }

    @Override
    @Transactional
    public void deactivateUser(DeactivateUser deactivateUser) {
        User user = userRepository.findById(deactivateUser.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setActive(false);
    }

    @Override
    @Transactional
    public void updateUserRoles(String id, List<String> roleNamesOrIds) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Set<String> newRoleIdsOrNames = new HashSet<>(roleNamesOrIds);
        Set<String> resolvedRoleIds = new HashSet<>();

        for (String roleStr : newRoleIdsOrNames) {
            if (roleRepository.existsById(roleStr)) {
                resolvedRoleIds.add(roleStr);
            } else {
                roleRepository.findByName(roleStr.toUpperCase())
                        .ifPresent(r -> resolvedRoleIds.add(r.getId()));
            }
        }

        user.getUserRoles().removeIf(ur -> !resolvedRoleIds.contains(ur.getRole().getId()));
        for (String roleId : resolvedRoleIds) {
            boolean alreadyHas = user.getUserRoles().stream()
                    .anyMatch(ur -> ur.getRole().getId().equals(roleId));
            if (!alreadyHas) {
                Role role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTS));
                UserRole userRole = UserRole.builder().user(user).role(role).build();
                userRoleRepository.save(userRole);
            }
        }
    }

    @Override
    @Transactional
    public UserResponse updateUser(UserUpdateRequest request) {
        User user = userRepository.findByUsernameAndActive(
                        SecurityContextHolder.getContext().getAuthentication().getName(), true)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userMapper.updateUser(user, request);

        if (request.getPassword() != null && !request.getPassword().equals(request.getRepeatPassword())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }

        if (request.getPassword() != null) {
            if (passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
            } else {
                throw new AppException(ErrorCode.WRONG_PASSWORD);
            }
        }

        if (request.getRoles() != null) {
            Set<String> newRoleIds = new HashSet<>(request.getRoles());
            user.getUserRoles().removeIf(ur -> !newRoleIds.contains(ur.getRole().getId()));
            for (String roleId : newRoleIds) {
                boolean alreadyHas = user.getUserRoles().stream()
                        .anyMatch(ur -> ur.getRole().getId().equals(roleId));
                if (!alreadyHas) {
                    Role role = roleRepository.findById(roleId)
                            .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTS));
                    UserRole userRole = UserRole.builder().user(user).role(role).build();
                    userRoleRepository.save(userRole);
                }
            }
        }

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse getUser(String id) {
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getActivatedUser(String id) {
        return userMapper.toUserResponse(
                userRepository.findByIdAndActive(id, true).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getActivatedUserByUsername(String username) {
        return userMapper.toUserResponse(
                userRepository.findByUsernameAndActive(username, true).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    @Override
    public boolean existById(String id) {
        return userRepository.existsById(id);
    }

    @Override
    public String getUserIdByUsername(String username) {
        return userRepository.findByUsernameAndActive(username, true)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED))
                .getId();
    }

    @Override
    @Transactional
    public String upgradeSellerRequest(UpgradeSellerRequest request) {

        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if (shopRepository.findByUser_Id(userId).isPresent()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Shop shop = Shop.builder()
                .name(request.getShopName())
                .description(request.getDescription())
                .status("PENDING")
                .user(user)
                .build();

        Shop saved = shopRepository.save(shop);

        return saved.getId();
    }
}
