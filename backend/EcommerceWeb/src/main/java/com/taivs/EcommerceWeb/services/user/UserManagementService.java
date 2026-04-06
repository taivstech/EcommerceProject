package com.taivs.EcommerceWeb.services.user;

import com.taivs.EcommerceWeb.dto.request.user.ActiveUserRequest;
import com.taivs.EcommerceWeb.dto.request.user.DeactivateUser;
import com.taivs.EcommerceWeb.dto.request.user.UpdateOwnProfile;
import com.taivs.EcommerceWeb.dto.request.user.UpgradeSellerRequest;
import com.taivs.EcommerceWeb.dto.request.user.UserCreationRequest;
import com.taivs.EcommerceWeb.dto.request.user.UserUpdateRequest;
import com.taivs.EcommerceWeb.dto.response.user.UserResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserManagementService {

    UserResponse createUser(UserCreationRequest request);

    UserResponse getMyInfo();

    UserResponse updateMyInfo(UpdateOwnProfile request, MultipartFile avatarFile);

    org.springframework.data.domain.Page<UserResponse> getUsers(org.springframework.data.domain.Pageable pageable);

    UserResponse getUserById(String id);

    void activeUser(ActiveUserRequest activeUserRequest);

    void deactivateUser(DeactivateUser deactivateUser);

    UserResponse updateUser(UserUpdateRequest request);

    UserResponse getUser(String id);

    UserResponse getActivatedUser(String id);

    UserResponse getActivatedUserByUsername(String username);

    boolean existById(String id);

    String getUserIdByUsername(String username);

    String upgradeSellerRequest(UpgradeSellerRequest request);
}
