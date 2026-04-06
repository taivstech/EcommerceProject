package com.taivs.EcommerceWeb.serviceimpl.warehouse;

import com.taivs.EcommerceWeb.models.notification.Notification;
import com.taivs.EcommerceWeb.dto.response.user.UserResponse;
import com.taivs.EcommerceWeb.models.auth.Role;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.auth.UserRole;
import com.taivs.EcommerceWeb.models.auth.UserRoleId;
import com.taivs.EcommerceWeb.mappers.user.UserMapper;
import com.taivs.EcommerceWeb.repositories.auth.RoleRepository;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.repositories.auth.UserRoleRepository;
import com.taivs.EcommerceWeb.dto.request.warehouse.CreateWarehouseEmployeeRequest;
import com.taivs.EcommerceWeb.services.notification.NotificationService;
import com.taivs.EcommerceWeb.services.warehouse.GhnService;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import com.taivs.EcommerceWeb.dto.request.warehouse.AssignEmployeeRequest;
import com.taivs.EcommerceWeb.dto.request.warehouse.WarehouseCreateRequest;
import com.taivs.EcommerceWeb.dto.request.warehouse.WarehouseUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.warehouse.WarehouseEmployeeResponse;
import com.taivs.EcommerceWeb.dto.response.warehouse.WarehouseResponse;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.models.warehouse.WarehouseEmployee;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseEmployeeRepository;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseRepository;
import com.taivs.EcommerceWeb.services.warehouse.WarehouseService;
import com.taivs.EcommerceWeb.constants.PredefinedRole;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final WarehouseEmployeeRepository warehouseEmployeeRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final GhnService ghnService;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final NotificationService notificationService;
    private final UserMapper userMapper;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public WarehouseResponse create(WarehouseCreateRequest request) {
        String userId = currentUserId();
        Shop shop = shopRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        Warehouse warehouse = Warehouse.builder()
                .name(request.getName())
                .contactName(request.getContactName())
                .contactPhone(request.getContactPhone())
                .detailAddress(request.getDetailAddress())
                .fullAddress(request.getFullAddress())
                .ward(request.getWard())
                .wardCode(request.getWardCode())
                .district(request.getDistrict())
                .districtId(request.getDistrictId())
                .province(request.getProvince())
                .provinceId(request.getProvinceId())
                .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
                .shop(shop)
                .build();

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefaultWarehouse(shop.getId());
        }

        if (warehouseRepository.countByShopId(shop.getId()) == 0) {
            warehouse.setIsDefault(true);
        }

        Warehouse saved = warehouseRepository.save(warehouse);

        registerWithGhnAsync(saved.getId());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public WarehouseResponse update(String warehouseId, WarehouseUpdateRequest request) {
        Warehouse warehouse = getWarehouseForOwner(warehouseId);

        if (StringUtils.hasText(request.getName())) warehouse.setName(request.getName());
        if (request.getContactName() != null) warehouse.setContactName(request.getContactName());
        if (request.getContactPhone() != null) warehouse.setContactPhone(request.getContactPhone());
        if (request.getDetailAddress() != null) warehouse.setDetailAddress(request.getDetailAddress());
        if (request.getFullAddress() != null) warehouse.setFullAddress(request.getFullAddress());
        if (request.getWard() != null) warehouse.setWard(request.getWard());
        if (request.getWardCode() != null) warehouse.setWardCode(request.getWardCode());
        if (request.getDistrict() != null) warehouse.setDistrict(request.getDistrict());
        if (request.getDistrictId() != null) warehouse.setDistrictId(request.getDistrictId());
        if (request.getProvince() != null) warehouse.setProvince(request.getProvince());
        if (request.getProvinceId() != null) warehouse.setProvinceId(request.getProvinceId());
        if (request.getStatus() != null) warehouse.setStatus(request.getStatus());

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            clearDefaultWarehouse(warehouse.getShop().getId());
            warehouse.setIsDefault(true);
        }

        Warehouse saved = warehouseRepository.save(warehouse);

        if (request.getDistrictId() != null || request.getWardCode() != null) {
            registerWithGhnAsync(saved.getId());
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(String warehouseId) {
        Warehouse warehouse = getWarehouseForOwner(warehouseId);
        warehouse.setDeletedAt(LocalDateTime.now());
        warehouseRepository.save(warehouse);
    }

    @Override
    public WarehouseResponse getById(String warehouseId) {
        Warehouse warehouse = warehouseRepository.findByIdWithEmployees(warehouseId)
                .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND));
        return mapToResponse(warehouse);
    }

    @Override
    @Transactional
    public List<WarehouseResponse> getMyWarehouses() {
        String userId = currentUserId();
        Shop shop = shopRepository.findByUser_Id(userId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_FOUND));

        List<Warehouse> warehouses = warehouseRepository.findByShopIdWithEmployees(shop.getId());

        if (warehouses.isEmpty() && "APPROVED".equalsIgnoreCase(shop.getStatus())) {
            log.info("Shop {} is approved but has no warehouses, creating default warehouse", shop.getId());
            Warehouse defaultWarehouse = createDefaultWarehouseForShop(shop);
            warehouses = Collections.singletonList(defaultWarehouse);
        }

        return warehouses.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Warehouse createDefaultWarehouseForShop(Shop shop) {
        var addr = shop.getShopAddress();

        Warehouse warehouse = Warehouse.builder()
                .name(shop.getName() + " - Main warehouse")
                .contactName(shop.getUser().getFullName())
                .contactPhone(addr != null ? addr.getPhoneNumber() : null)
                .detailAddress(addr != null ? addr.getDetailAddress() : null)
                .fullAddress(addr != null ? addr.getFullAddress() : shop.getAddress())
                .ward(addr != null ? addr.getWard() : null)
                .wardCode(addr != null ? addr.getWardCode() : null)
                .district(addr != null ? addr.getDistrict() : null)
                .districtId(addr != null ? addr.getDistrictId() : null)
                .province(addr != null ? addr.getProvince() : null)
                .provinceId(addr != null ? addr.getProvinceId() : null)
                .isDefault(true)
                .shop(shop)
                .build();

        Warehouse saved = warehouseRepository.save(warehouse);
        log.info("Auto-created default warehouse {} for shop {}", saved.getId(), shop.getId());

        registerWithGhnAsync(saved.getId());

        return saved;
    }

    @Override
    @Transactional
    public void assignEmployee(String warehouseId, AssignEmployeeRequest request) {
        Warehouse warehouse = getWarehouseForOwner(warehouseId);

        User user = userRepository.findByUsername(request.getUsernameOrEmail())
                .or(() -> userRepository.findByEmail(request.getUsernameOrEmail()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (warehouseEmployeeRepository.existsByWarehouse_IdAndUser_Id(warehouseId, user.getId())) {
            throw new AppException(ErrorCode.ALREADY_EXISTS);
        }

        String role = StringUtils.hasText(request.getRole()) ? request.getRole() : "EMPLOYEE";

        WarehouseEmployee employee = WarehouseEmployee.builder()
                .warehouse(warehouse)
                .user(user)
                .role(role)
                .build();

        warehouseEmployeeRepository.save(employee);
        log.info("Assigned user {} to warehouse {} with role {}", user.getId(), warehouseId, role);

        ensureWarehouseEmployeeRole(user);

        notificationService.createAndPush(
                user.getId(),
                "WAREHOUSE_ASSIGNED",
                "Ban da duoc them vao kho hang",
                "Ban da duoc gan vao kho \"" + warehouse.getName() + "\" voi vai tro " + role,
                warehouseId,
                "WAREHOUSE"
        );
    }

    @Override
    @Transactional
    public UserResponse createWarehouseEmployee(String warehouseId, CreateWarehouseEmployeeRequest request) {

        Warehouse warehouse = getWarehouseForOwner(warehouseId);

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        if (request.getEmail() != null && !request.getEmail().isBlank() 
                && userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Created warehouse employee account: userId={}, username={}", savedUser.getId(), savedUser.getUsername());

        ensureWarehouseEmployeeRole(savedUser);


        WarehouseEmployee employee = WarehouseEmployee.builder()
                .warehouse(warehouse)
                .user(savedUser)
                .role("EMPLOYEE")
                .build();

        warehouseEmployeeRepository.save(employee);
        log.info("Assigned warehouse employee {} to warehouse {}", savedUser.getId(), warehouseId);


        notificationService.createAndPush(
                savedUser.getId(),
                "WAREHOUSE_ASSIGNED",
                "Bạn đã được tạo tài khoản quản lý kho",
                String.format("Tài khoản của bạn đã được tạo và gán vào kho \"%s\". Bạn có thể đăng nhập ngay bây giờ.", warehouse.getName()),
                warehouseId,
                "WAREHOUSE"
        );

        return userMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional
    public void removeEmployee(String warehouseId, String userId) {
        getWarehouseForOwner(warehouseId);

        WarehouseEmployee employee = warehouseEmployeeRepository
                .findByWarehouse_IdAndUser_Id(warehouseId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND));

        warehouseEmployeeRepository.delete(employee);
        log.info("Removed user {} from warehouse {}", userId, warehouseId);
    }

    @Override
    public List<WarehouseResponse> getMyAssignedWarehouses() {
        String userId = currentUserId();
        return warehouseRepository.findByEmployeeUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }


    @Async
    @Transactional
    public void registerWithGhnAsync(String warehouseId) {
        try {
            Warehouse warehouse = warehouseRepository.findById(warehouseId).orElse(null);
            if (warehouse == null) return;

            if (warehouse.getDistrictId() == null) {
                log.warn("Cannot register warehouse {} with GHN: no districtId", warehouseId);
                return;
            }

            Map<String, Object> result = ghnService.registerShop(
                    warehouse.getName(),
                    warehouse.getContactPhone() != null ? warehouse.getContactPhone() : "",
                    warehouse.getFullAddress() != null ? warehouse.getFullAddress() : "",
                    warehouse.getDistrictId(),
                    warehouse.getWardCode() != null ? warehouse.getWardCode() : ""
            );

            if (result != null && result.containsKey("data")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) result.get("data");
                Object shopIdObj = data.get("shop_id");
                if (shopIdObj instanceof Number) {
                    int ghnShopId = ((Number) shopIdObj).intValue();
                    warehouse.setGhnShopId(ghnShopId);
                    warehouseRepository.save(warehouse);
                    log.info("Registered warehouse {} as GHN shop {}", warehouseId, ghnShopId);
                }
            }
        } catch (Exception e) {
            log.error("Failed to register warehouse {} with GHN: {}", warehouseId, e.getMessage());
        }
    }

    private Warehouse getWarehouseForOwner(String warehouseId) {
        String userId = currentUserId();
        Warehouse warehouse = warehouseRepository.findByIdWithEmployees(warehouseId)
                .orElseThrow(() -> new AppException(ErrorCode.ENTITY_NOT_FOUND));

        if (!warehouse.getShop().getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return warehouse;
    }

    private void clearDefaultWarehouse(String shopId) {
        List<Warehouse> warehouses = warehouseRepository.findActiveByShopId(shopId);
        for (Warehouse w : warehouses) {
            if (Boolean.TRUE.equals(w.getIsDefault())) {
                w.setIsDefault(false);
                warehouseRepository.save(w);
            }
        }
    }

    private WarehouseResponse mapToResponse(Warehouse w) {
        List<WarehouseEmployeeResponse> employeeResponses = w.getEmployees() == null
                ? Collections.emptyList()
                : w.getEmployees().stream().map(e -> WarehouseEmployeeResponse.builder()
                .id(e.getId())
                .userId(e.getUser().getId())
                .username(e.getUser().getUsername())
                .fullName(e.getUser().getFullName())
                .email(e.getUser().getEmail())
                .role(e.getRole())
                .build()
        ).collect(Collectors.toList());

        return WarehouseResponse.builder()
                .id(w.getId())
                .name(w.getName())
                .contactName(w.getContactName())
                .contactPhone(w.getContactPhone())
                .detailAddress(w.getDetailAddress())
                .fullAddress(w.getFullAddress())
                .ward(w.getWard())
                .wardCode(w.getWardCode())
                .district(w.getDistrict())
                .districtId(w.getDistrictId())
                .province(w.getProvince())
                .provinceId(w.getProvinceId())
                .ghnShopId(w.getGhnShopId())
                .status(w.getStatus())
                .isDefault(w.getIsDefault())
                .shopId(w.getShop().getId())
                .shopName(w.getShop().getName())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .employees(employeeResponses)
                .build();
    }

    private void ensureWarehouseEmployeeRole(User user) {
        Role whRole = roleRepository.findByName(PredefinedRole.WAREHOUSE_EMPLOYEE).orElse(null);
        if (whRole == null) {
            log.warn("WAREHOUSE_EMPLOYEE role not found in database");
            return;
        }

        boolean alreadyHas = user.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole().getId().equals(whRole.getId()));

        if (!alreadyHas) {
            UserRoleId urId = new UserRoleId(user.getId(), whRole.getId());
            UserRole userRole = UserRole.builder()
                    .id(urId)
                    .user(user)
                    .role(whRole)
                    .build();
            userRoleRepository.save(userRole);
            log.info("Auto-assigned WAREHOUSE_EMPLOYEE role to user {}", user.getId());
        }
    }

    @Override
    public List<WarehouseResponse> getShopWarehouses(String shopId) {
        List<Warehouse> warehouses = warehouseRepository.findActiveByShopId(shopId);
        return warehouses.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String currentUserId() {
        return SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }
}
