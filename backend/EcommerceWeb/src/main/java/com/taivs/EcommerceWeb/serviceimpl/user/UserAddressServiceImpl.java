package com.taivs.EcommerceWeb.serviceimpl.user;

import com.taivs.EcommerceWeb.dto.request.user.UserAddressRequest;
import com.taivs.EcommerceWeb.dto.response.user.UserAddressResponse;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.user.UserAddress;
import com.taivs.EcommerceWeb.mappers.user.UserAddressMapper;
import com.taivs.EcommerceWeb.repositories.user.UserAddressRepository;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.services.user.UserAddressService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserAddressServiceImpl implements UserAddressService {
    private final UserAddressRepository userAddressRepository;
    private final UserRepository userRepository;
    private final UserAddressMapper userAddressMapper;

    @Override
    public List<UserAddressResponse> getAllMyAddresses() {
        User user = getCurrentUserOrThrow();
        return userAddressRepository.findAllByUser_Id(user.getId()).stream()
                .map(userAddressMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public UserAddressResponse getMyAddressById(String id) {
        User user = getCurrentUserOrThrow();
        UserAddress address = userAddressRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_ADDRESS_NOT_EXISTS));
        if (!address.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return userAddressMapper.toResponse(address);
    }

    @Override
    @Transactional
    public void createMyAddress(UserAddressRequest request) {
        User user = getCurrentUserOrThrow();
        UserAddress address = userAddressMapper.toEntity(request);
        address.setId(UUID.randomUUID().toString());
        address.setUser(user);
        if (request.isDefaultAddress()) {
            unsetAllDefaultAddresses(user.getId());
            address.setDefaultAddress(true);
        }
        userAddressRepository.save(address);
    }

    @Override
    @Transactional
    public void updateMyAddress(String id, UserAddressRequest request) {
        User user = getCurrentUserOrThrow();
        UserAddress address = userAddressRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_ADDRESS_NOT_EXISTS));
        if (!address.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        userAddressMapper.update(address, request);
        if (request.isDefaultAddress()) {
            unsetAllDefaultAddresses(user.getId());
            address.setDefaultAddress(true);
        }
        userAddressRepository.save(address);
    }

    @Override
    @Transactional
    public void deleteMyAddress(String id) {
        User user = getCurrentUserOrThrow();
        UserAddress address = userAddressRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_ADDRESS_NOT_EXISTS));
        if (!address.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        if (Boolean.TRUE.equals(address.getDefaultAddress())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        userAddressRepository.delete(address);
    }

    @Override
    @Transactional
    public void setMyDefaultAddress(String id) {
        User user = getCurrentUserOrThrow();
        UserAddress address = userAddressRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_ADDRESS_NOT_EXISTS));
        if (!address.getUser().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        unsetAllDefaultAddresses(user.getId());
        address.setDefaultAddress(true);
        userAddressRepository.save(address);
    }

    private User getCurrentUserOrThrow() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));
    }

    private void unsetAllDefaultAddresses(String userId) {
        List<UserAddress> existing = userAddressRepository.findAllByUser_Id(userId);
        for (UserAddress a : existing) {
            if (Boolean.TRUE.equals(a.getDefaultAddress())) {
                a.setDefaultAddress(false);
                userAddressRepository.save(a);
            }
        }
    }
}
