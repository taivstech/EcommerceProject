package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.models.order.ShippingAddress;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExcelExportServiceImplTest {

    @Mock OrderRepository orderRepository;
    @InjectMocks ExcelExportServiceImpl service;

    private Order sampleOrder() {
        ShippingAddress sa = ShippingAddress.builder()
                .receiverName("Nguyen Van A")
                .fullAddress("123 Hanoi")
                .build();

        Order order = Order.builder()
                .id("ord-1")
                .status(OrderStatus.COMPLETED)
                .payment("VNPAY")
                .isPaid(true)
                .subtotal(new BigDecimal("200000"))
                .shippingFee(new BigDecimal("30000"))
                .totalDiscount(new BigDecimal("10000"))
                .total(new BigDecimal("220000"))
                .createdAt(LocalDateTime.of(2025, 6, 15, 10, 30))
                .orderShopGroups(new ArrayList<>())
                .build();
        // Wire the bidirectional relationship
        sa.setOrder(order);
        order.setShippingAddress(sa);
        return order;
    }

    @Test
    @DisplayName("exportOrdersExcel generates valid .xlsx with 2 sheets")
    void exportOrdersExcel_generatesValidFile() throws Exception {
        when(orderRepository.findAllWithShippingAndGroupsOrderByCreatedAtDesc())
                .thenReturn(List.of(sampleOrder()));

        byte[] data = service.exportOrdersExcel(null, null);

        assertThat(data).isNotEmpty();
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(data))) {
            assertThat(wb.getNumberOfSheets()).isEqualTo(2);
            assertThat(wb.getSheetName(0)).isEqualTo("Orders");
            assertThat(wb.getSheetName(1)).isEqualTo("Order Items");

            Sheet orders = wb.getSheetAt(0);
            // header + 1 data row
            assertThat(orders.getPhysicalNumberOfRows()).isEqualTo(2);
            Row dataRow = orders.getRow(1);
            assertThat(dataRow.getCell(0).getStringCellValue()).isEqualTo("ord-1");
            assertThat(dataRow.getCell(1).getStringCellValue()).isEqualTo("COMPLETED");
        }
    }

    @Test
    @DisplayName("exportOrdersExcel filters by date range")
    void exportOrdersExcel_withDateFilter() throws Exception {
        Order order = sampleOrder();
        // order date: 2025-06-15
        when(orderRepository.findAllWithShippingAndGroupsOrderByCreatedAtDesc())
                .thenReturn(List.of(order));

        // Filter: only July 2025 → should exclude the June order
        byte[] data = service.exportOrdersExcel(LocalDate.of(2025, 7, 1), LocalDate.of(2025, 7, 31));

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(data))) {
            Sheet orders = wb.getSheetAt(0);
            assertThat(orders.getPhysicalNumberOfRows()).isEqualTo(1); // header only
        }
    }

    @Test
    @DisplayName("exportSellerOrdersExcel uses seller's user ID")
    void exportSellerOrdersExcel_success() throws Exception {
        var ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new TestingAuthenticationToken("seller-1", null));
        SecurityContextHolder.setContext(ctx);

        when(orderRepository.findBySellerUserIdWithShippingAndGroupsOrderByCreatedAtDesc("seller-1"))
                .thenReturn(List.of(sampleOrder()));

        byte[] data = service.exportSellerOrdersExcel(null, null);

        assertThat(data).isNotEmpty();
        verify(orderRepository).findBySellerUserIdWithShippingAndGroupsOrderByCreatedAtDesc("seller-1");

        SecurityContextHolder.clearContext();
    }
}
