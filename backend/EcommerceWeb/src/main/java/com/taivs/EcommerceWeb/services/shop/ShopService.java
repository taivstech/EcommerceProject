package com.taivs.EcommerceWeb.services.shop;

import com.taivs.EcommerceWeb.dto.request.shop.ShopCreateRequest;
import com.taivs.EcommerceWeb.dto.request.shop.ShopUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.shop.ShopFollowerResponse;
import com.taivs.EcommerceWeb.dto.response.shop.ShopResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import com.taivs.EcommerceWeb.models.shop.Shop;

public interface ShopService {

    void create(ShopCreateRequest request, MultipartFile logoFile);

    ShopResponse getMyShopInfo();

    void updateMyShop(ShopUpdateRequest request, MultipartFile logoFile);

    ShopResponse getInfoById(String id);

    String getUserIdByShopId(String shopId);

    String getShopIdByUserId(String userId);

    List<String> getShopIdByProvinceId(String provinceId);

    org.springframework.data.domain.Page<ShopResponse> getAll(String status, org.springframework.data.domain.Pageable pageable);

    void approve(String shopId);

    void reject(String shopId, String reason);

    void suspend(String shopId, String reason);

    void followShop(String shopId);

    void unfollowShop(String shopId);

    long getFollowerCount(String shopId);

    boolean isFollowing(String shopId);

    List<ShopFollowerResponse> getMyFollowedShops();

    com.taivs.EcommerceWeb.dto.response.shop.SellerDashboardStats getDashboardStatsByUserId(String userId);
}
