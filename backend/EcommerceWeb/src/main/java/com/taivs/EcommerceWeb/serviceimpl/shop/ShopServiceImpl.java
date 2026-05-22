package com.taivs.EcommerceWeb.serviceimpl.shop;

import com.taivs.EcommerceWeb.services.warehouse.WarehouseService;
import com.taivs.EcommerceWeb.models.auth.Role;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.auth.UserRole;
import com.taivs.EcommerceWeb.models.auth.UserRoleId;
import com.taivs.EcommerceWeb.repositories.auth.RoleRepository;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.repositories.auth.UserRoleRepository;
import com.taivs.EcommerceWeb.dto.request.shop.ShopCreateRequest;
import com.taivs.EcommerceWeb.dto.request.shop.ShopUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.shop.ShopFollowerResponse;
import com.taivs.EcommerceWeb.dto.response.shop.ShopResponse;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.shop.ShopAddress;
import com.taivs.EcommerceWeb.models.shop.ShopFollower;
import com.taivs.EcommerceWeb.mappers.shop.ShopAddressMapper;
import com.taivs.EcommerceWeb.mappers.shop.ShopMapper;
import com.taivs.EcommerceWeb.repositories.shop.ShopFollowerRepository;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import com.taivs.EcommerceWeb.services.shop.ShopService;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseRepository;
import com.taivs.EcommerceWeb.serviceimpl.warehouse.WarehouseServiceImpl;
import com.taivs.EcommerceWeb.constants.PredefinedRole;
import com.taivs.EcommerceWeb.services.media.FileStorageService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import com.taivs.EcommerceWeb.utils.RedisCacheHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShopServiceImpl implements ShopService {

    private static final String CACHE_SHOP_ID_BY_USER_PREFIX = "shop:id_by_user:";
    private static final String CACHE_USER_ID_BY_SHOP_PREFIX = "shop:user_by_id:";
    private static final String CACHE_SHOP_DETAIL_PREFIX = "shop:detail:";
    private static final int CACHE_TTL_SECONDS = 10 * 60;  // 10 minutes

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ShopMapper shopMapper;
    private final ShopAddressMapper shopAddressMapper;
    private final RedisCacheHelper cacheHelper;
    private final ShopFollowerRepository shopFollowerRepository;
    private final UserRoleRepository userRoleRepository;
    private final FileStorageService fileStorageService;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseServiceImpl warehouseService;
    private final com.taivs.EcommerceWeb.repositories.product.ProductRepository productRepository;
    private final com.taivs.EcommerceWeb.repositories.order.OrderRepository orderRepository;

    @Override
    @Transactional
    public void create(ShopCreateRequest request, MultipartFile logoFile) {
        User user = getCurrentUserOrThrow();

        if (shopRepository.findByUser_Id(user.getId()).isPresent()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        ensureSellerRole(user);

        Shop shop = shopMapper.toEntity(request);
        shop.setUser(user);
        shop.setStatus("PENDING");
        shop.setAddress(request.getFullAddress());

        if (logoFile != null && !logoFile.isEmpty()) {
            String logoUrl = fileStorageService.uploadAndGetUrl(logoFile, "/shops");
            shop.setLogo(logoUrl);
        }

        ShopAddress address = shopAddressMapper.toShopAddress(request);
        shop.setShopAddress(address);

        Shop saved = shopRepository.save(shop);

        cacheHelper.saveToCache(CACHE_SHOP_ID_BY_USER_PREFIX + user.getId(), saved.getId(), CACHE_TTL_SECONDS);
        cacheHelper.saveToCache(CACHE_USER_ID_BY_SHOP_PREFIX + saved.getId(), user.getId(), CACHE_TTL_SECONDS);
    }

    @Override
    public ShopResponse getMyShopInfo() {
        User user = getCurrentUserOrThrow();
        Shop shop = shopRepository.findByUserIdWithRelations(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));
        return shopMapper.toResponse(shop);
    }

    @Override
    @Transactional
    public void updateMyShop(ShopUpdateRequest request, MultipartFile logoFile) {
        User user = getCurrentUserOrThrow();
        Shop shop = shopRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));

        shopMapper.update(shop, request);
        if (request.getFullAddress() != null) {
            shop.setAddress(request.getFullAddress());
        }

        if (logoFile != null && !logoFile.isEmpty()) {
            String logoUrl = fileStorageService.uploadAndGetUrl(logoFile, "/shops");
            shop.setLogo(logoUrl);
        }

        if (shop.getShopAddress() == null) {
            shop.setShopAddress(new ShopAddress());
        }
        shopAddressMapper.update(shop.getShopAddress(), request);

        shopRepository.save(shop);

        cacheHelper.deleteCache(CACHE_SHOP_DETAIL_PREFIX + shop.getId());

        if (request.getProvince() != null || request.getDistrict() != null || request.getWard() != null) {
            warehouseRepository.findDefaultByShopId(shop.getId()).ifPresent(defaultWarehouse -> {
                if (request.getProvince() != null) defaultWarehouse.setProvince(request.getProvince());
                if (request.getProvinceId() != null) defaultWarehouse.setProvinceId(request.getProvinceId());
                if (request.getDistrict() != null) defaultWarehouse.setDistrict(request.getDistrict());
                if (request.getDistrictId() != null) defaultWarehouse.setDistrictId(request.getDistrictId());
                if (request.getWard() != null) defaultWarehouse.setWard(request.getWard());
                if (request.getWardCode() != null) defaultWarehouse.setWardCode(request.getWardCode());
                if (request.getDetailAddress() != null) defaultWarehouse.setDetailAddress(request.getDetailAddress());
                if (request.getFullAddress() != null) defaultWarehouse.setFullAddress(request.getFullAddress());
                warehouseRepository.save(defaultWarehouse);
                log.info("Synced shop address to default warehouse {} for shop {}", defaultWarehouse.getId(), shop.getId());
            });
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ShopResponse getInfoById(String id) {

        String cacheKey = CACHE_SHOP_DETAIL_PREFIX + id;
        ShopResponse cached = cacheHelper.getFromCache(cacheKey, ShopResponse.class);
        if (cached != null) {
            return cached;
        }

        Shop shop = shopRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));
        ShopResponse response = shopMapper.toResponse(shop);

        cacheHelper.saveToCache(cacheKey, response, CACHE_TTL_SECONDS);
        return response;
    }

    @Override
    public String getUserIdByShopId(String shopId) {
        String cacheKey = CACHE_USER_ID_BY_SHOP_PREFIX + shopId;
        String cached = cacheHelper.getFromCache(cacheKey, String.class);
        if (cached != null) return cached;

        Shop shop = shopRepository.findByIdWithRelations(shopId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));
        String userId = shop.getUser().getId();
        cacheHelper.saveToCache(cacheKey, userId, CACHE_TTL_SECONDS);
        return userId;
    }

    @Override
    public String getShopIdByUserId(String userId) {
        String cacheKey = CACHE_SHOP_ID_BY_USER_PREFIX + userId;
        String cached = cacheHelper.getFromCache(cacheKey, String.class);
        if (cached != null) return cached;

        Shop shop = shopRepository.findByUserIdWithRelations(userId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));
        cacheHelper.saveToCache(cacheKey, shop.getId(), CACHE_TTL_SECONDS);
        return shop.getId();
    }

    @Override
    public List<String> getShopIdByProvinceId(String provinceId) {
        return shopRepository.findByShopAddress_ProvinceId(provinceId)
                .stream()
                .map(Shop::getId)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShopResponse> getAll(String status, Pageable pageable) {
        Page<String> shopIds;
        
        if (status == null || status.isBlank()) {
            shopIds = shopRepository.findAllShopIds(pageable);
        } else {
            shopIds = shopRepository.findShopIdsByStatus(status, pageable);
        }
        
        if (shopIds.isEmpty()) {
            return Page.empty(pageable);
        }
        
        List<Shop> shops = shopRepository.findAllWithRelations().stream()
                .filter(s -> shopIds.getContent().contains(s.getId()))
                .toList();
        
        List<ShopResponse> responses = shops.stream()
                .map(shopMapper::toResponse)
                .toList();
        
        return new PageImpl<>(responses, pageable, shopIds.getTotalElements());
    }

    @Override
    @Transactional
    public void approve(String shopId) {

        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));

        log.info(shop.getStatus());

        if (!"PENDING".equalsIgnoreCase(shop.getStatus()) && !"SUSPENDED".equalsIgnoreCase(shop.getStatus()) ) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        User admin = getCurrentUserOrThrow();
        shop.setStatus("APPROVED");
        shop.setApprovedAt(LocalDateTime.now());
        shop.setApprovedBy(admin);

        User user = shop.getUser();

        Role sellerRole = roleRepository.findByName(PredefinedRole.SELLER)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTS));

        boolean hasSeller = user.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole().getId().equals(sellerRole.getId()));

        if (!hasSeller) {
            UserRoleId id = new UserRoleId(user.getId(), sellerRole.getId());

            UserRole userRole = UserRole.builder()
                    .id(id)
                    .user(user)
                    .role(sellerRole)
                    .build();

            userRoleRepository.save(userRole);
        }

        shopRepository.save(shop);

        createDefaultWarehouse(shop);
    }

    private void createDefaultWarehouse(Shop shop) {
        // Skip if shop already has warehouses
        if (warehouseRepository.countByShopId(shop.getId()) > 0) {
            log.info("Shop {} already has warehouses, skipping auto-create", shop.getId());
            return;
        }

        ShopAddress addr = shop.getShopAddress();

        Warehouse warehouse = Warehouse.builder()
                .name(shop.getName() + " - Kho chính")
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

        warehouseService.registerWithGhnAsync(saved.getId());
    }

    @Override
    @Transactional
    public void reject(String shopId, String reason) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));
        if (!"PENDING".equalsIgnoreCase(shop.getStatus())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        User admin = getCurrentUserOrThrow();
        shop.setStatus("REJECTED");
        shop.setRejectionReason(reason);
        shop.setApprovedAt(LocalDateTime.now());
        shop.setApprovedBy(admin);
        shopRepository.save(shop);

        cacheHelper.deleteCache(CACHE_SHOP_DETAIL_PREFIX + shopId);
    }

    @Override
    @Transactional
    public void suspend(String shopId, String reason) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));

        User admin = getCurrentUserOrThrow();
        shop.setStatus("SUSPENDED");
        shop.setRejectionReason(reason);
        shop.setApprovedAt(LocalDateTime.now());
        shop.setApprovedBy(admin);
        shopRepository.save(shop);

        cacheHelper.deleteCache(CACHE_SHOP_DETAIL_PREFIX + shopId);
    }

    @Override
    @Transactional
    public void followShop(String shopId) {
        String userId = getCurrentUserOrThrow().getId();
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new AppException(ErrorCode.SHOP_NOT_EXISTS));

        if (shopFollowerRepository.existsByUserIdAndShopId(userId, shopId)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        ShopFollower follower = ShopFollower.builder()
                .user(getCurrentUserOrThrow())
                .shop(shop)
                .build();
        shopFollowerRepository.save(follower);
    }

    @Override
    @Transactional
    public void unfollowShop(String shopId) {
        String userId = getCurrentUserOrThrow().getId();
        ShopFollower follower = shopFollowerRepository.findByUserIdAndShopId(userId, shopId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));
        shopFollowerRepository.delete(follower);
    }

    @Override
    public long getFollowerCount(String shopId) {
        return shopFollowerRepository.countByShopId(shopId);
    }

    @Override
    public boolean isFollowing(String shopId) {
        String userId = getCurrentUserOrThrow().getId();
        return shopFollowerRepository.existsByUserIdAndShopId(userId, shopId);
    }

    @Override
    public List<ShopFollowerResponse> getMyFollowedShops() {
        String userId = getCurrentUserOrThrow().getId();
        return shopFollowerRepository.findByUserIdOrderByFollowedAtDesc(userId)
                .stream()
                .map(sf -> ShopFollowerResponse.builder()
                        .id(sf.getId())
                        .shopId(sf.getShop().getId())
                        .shopName(sf.getShop().getName())
                        .followedAt(sf.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private User getCurrentUserOrThrow() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
    }

    private void ensureSellerRole(User user) {
        Role seller = roleRepository.findByName(PredefinedRole.SELLER)
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTS));

        boolean alreadyHasSeller = user.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole().getId().equals(seller.getId()));

        if (!alreadyHasSeller) {
            UserRoleId id = new UserRoleId(user.getId(), seller.getId());

            UserRole userRole = UserRole.builder()
                    .id(id)
                    .user(user)
                    .role(seller)
                    .assignedAt(Instant.now())
                    .build();

            userRoleRepository.save(userRole);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public com.taivs.EcommerceWeb.dto.response.shop.SellerDashboardStats getDashboardStatsByUserId(String userId) {
        String shopId = getShopIdByUserId(userId);

        long totalProducts = productRepository.countByShop_Id(shopId);
        long totalFollowers = getFollowerCount(shopId);

        List<com.taivs.EcommerceWeb.models.order.Order> orders = orderRepository.findBySellerUserIdOrderByCreatedAtDesc(userId);
        long totalOrders = orders.size();

        java.math.BigDecimal totalEarnings = java.math.BigDecimal.ZERO;
        for (com.taivs.EcommerceWeb.models.order.Order o : orders) {
            if (!"CANCELLED".equals(o.getStatus().name())) {
                totalEarnings = totalEarnings.add(o.getTotal() != null ? o.getTotal() : java.math.BigDecimal.ZERO);
            }
        }

        java.math.BigDecimal totalCommission = totalEarnings.multiply(new java.math.BigDecimal("0.05"));
        java.math.BigDecimal netEarnings = totalEarnings.subtract(totalCommission);

        return com.taivs.EcommerceWeb.dto.response.shop.SellerDashboardStats.builder()
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalFollowers(totalFollowers)
                .totalGmv(totalEarnings)
                .totalEarnings(netEarnings)
                .totalCommission(totalCommission)
                .build();
    }
}
