package com.taivs.EcommerceWeb.services.user;

import com.taivs.EcommerceWeb.dto.request.user.UserAddressRequest;
import com.taivs.EcommerceWeb.dto.response.user.UserAddressResponse;

import java.util.List;

public interface UserAddressService {

    List<UserAddressResponse> getAllMyAddresses();

    UserAddressResponse getMyAddressById(String id);

    void createMyAddress(UserAddressRequest request);

    void updateMyAddress(String id, UserAddressRequest request);

    void deleteMyAddress(String id);

    void setMyDefaultAddress(String id);
}
