package com.taivs.EcommerceWeb.repositories.order;

import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderShopGroupRepository extends JpaRepository<OrderShopGroup, String> {
    List<OrderShopGroup> findByOrder_Id(String orderId);
}

