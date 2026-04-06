package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.dto.response.user.UserResponse;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.mappers.user.UserMapper;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.repositories.order.OrderItemRepository;
import com.taivs.EcommerceWeb.services.order.OrderItemService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderItemServiceImpl implements OrderItemService {
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    public boolean existsOrderForProduct(List<String> variantIds) {
        return orderItemRepository.existsByProductVariantIdInAndOrderShopGroupOrderStatus(
                variantIds, "DELIVERED"
        );
    }

    @Override
    public Long getNumberOfOrder(List<String> variantIds) {
        return orderItemRepository.countByProductVariantIdInAndOrderShopGroupOrderStatus(
                variantIds, "DELIVERED"
        );
    }

    @Override
    public UserResponse getOwnerOfOrder(String orderItemId) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTS));

        String userId = orderItem.getOrderShopGroup().getOrder().getUser().getId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }

    @Override
    public int getTotalQuantityOfVariantInOrders(String variantId) {
        Integer totalQuantity = orderItemRepository.sumQuantityByProductVariantIdAndOrderShopGroupOrderStatus(
                variantId, "DELIVERED"
        );
        return totalQuantity != null ? totalQuantity : 0;
    }
}
