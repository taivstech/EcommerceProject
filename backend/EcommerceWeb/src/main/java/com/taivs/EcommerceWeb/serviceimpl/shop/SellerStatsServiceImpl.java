package com.taivs.EcommerceWeb.serviceimpl.shop;

import com.taivs.EcommerceWeb.dto.response.shop.SellerTopCustomerStats;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.services.shop.SellerStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SellerStatsServiceImpl implements SellerStatsService {

    private final OrderRepository orderRepository;

    @Override
    public List<SellerTopCustomerStats> getTopCustomers(LocalDate from, LocalDate to, int limit) {
        String sellerUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        LocalDateTime start = from != null ? from.atStartOfDay() : LocalDateTime.now().minusDays(30).toLocalDate().atStartOfDay();
        LocalDateTime end = to != null ? to.atTime(LocalTime.MAX) : LocalDateTime.now();

        List<Object[]> queryResults = orderRepository.findTopCustomersBySpending(
                sellerUserId,
                start,
                end,
                PageRequest.of(0, limit)
        );

        List<SellerTopCustomerStats> statsList = new ArrayList<>();
        for (Object[] row : queryResults) {
            statsList.add(SellerTopCustomerStats.builder()
                    .customerId((String) row[0])
                    .fullName((String) row[1])
                    .username((String) row[2])
                    .email((String) row[3])
                    .profilePicture((String) row[4])
                    .totalSpending((BigDecimal) row[5])
                    .build());
        }

        return statsList;
    }
}
