package com.taivs.EcommerceWeb.serviceimpl.promotion;

import com.taivs.EcommerceWeb.dto.response.promotion.UserCouponResponse;
import com.taivs.EcommerceWeb.models.promotion.UserCoupon;
import com.taivs.EcommerceWeb.repositories.promotion.UserCouponRepository;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.services.promotion.UserCouponService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserCouponServiceImpl implements UserCouponService {
    private final UserRepository userRepository;
    private final UserCouponRepository userCouponRepository;

    @Override
    public List<UserCouponResponse> getMyCoupons() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        List<UserCoupon> userCoupons = userCouponRepository.findByUser_Id(userId);
        return userCoupons.stream()
                .map(uc -> UserCouponResponse.builder().userId(userId).couponId(uc.getCouponId()).build())
                .collect(Collectors.toList());
    }

    @Override
    public List<UserCouponResponse> getByUsername(String username) {
        String userId = userRepository.findByUsernameAndActive(username, true)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)).getId();
        return userCouponRepository.findByUser_Id(userId).stream()
                .map(uc -> UserCouponResponse.builder().userId(userId).couponId(uc.getCouponId()).build())
                .collect(Collectors.toList());
    }
}
