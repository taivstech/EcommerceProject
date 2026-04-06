package com.taivs.EcommerceWeb.serviceimpl.order;

import com.taivs.EcommerceWeb.models.product.Product;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.services.order.ExportService;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.models.order.ShippingAddress;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ExcelExportServiceImpl implements ExportService {

    private final OrderRepository orderRepository;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    @Transactional(readOnly = true)
    public byte[] exportOrdersExcel(LocalDate from, LocalDate to) {
        List<Order> orders = orderRepository.findAllWithShippingAndGroupsOrderByCreatedAtDesc();

        if (from != null || to != null) {
            LocalDateTime start = from != null ? from.atStartOfDay() : LocalDateTime.MIN;
            LocalDateTime end = to != null ? to.atTime(LocalTime.MAX) : LocalDateTime.MAX;
            orders = orders.stream()
                    .filter(o -> !o.getCreatedAt().isBefore(start) && !o.getCreatedAt().isAfter(end))
                    .toList();
        }

        return buildOrdersExcel(orders, "All Orders Report");
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportSellerOrdersExcel(LocalDate from, LocalDate to) {
        String sellerUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Order> orders = orderRepository.findBySellerUserIdWithShippingAndGroupsOrderByCreatedAtDesc(sellerUserId);

        if (from != null || to != null) {
            LocalDateTime start = from != null ? from.atStartOfDay() : LocalDateTime.MIN;
            LocalDateTime end = to != null ? to.atTime(LocalTime.MAX) : LocalDateTime.MAX;
            orders = orders.stream()
                    .filter(o -> !o.getCreatedAt().isBefore(start) && !o.getCreatedAt().isAfter(end))
                    .toList();
        }

        return buildOrdersExcel(orders, "My Shop Orders Report");
    }


    private byte[] buildOrdersExcel(List<Order> orders, String title) {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet summarySheet = wb.createSheet("Orders");
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dateStyle = createDateStyle(wb);
            CellStyle moneyStyle = createMoneyStyle(wb);

            String[] summaryHeaders = {
                    "Order ID", "Status", "Payment", "Paid",
                    "Subtotal", "Shipping Fee", "Discount", "Total",
                    "Customer", "Shipping Address", "Created At"
            };
            createHeaderRow(summarySheet, summaryHeaders, headerStyle);

            int rowIdx = 1;
            for (Order order : orders) {
                Row row = summarySheet.createRow(rowIdx++);
                int col = 0;
                row.createCell(col++).setCellValue(order.getId());
                row.createCell(col++).setCellValue(order.getStatus().name());
                row.createCell(col++).setCellValue(order.getPayment());
                row.createCell(col++).setCellValue(Boolean.TRUE.equals(order.getIsPaid()) ? "Yes" : "No");

                setCellMoney(row.createCell(col++), order.getSubtotal(), moneyStyle);
                setCellMoney(row.createCell(col++), order.getShippingFee(), moneyStyle);
                setCellMoney(row.createCell(col++), order.getTotalDiscount(), moneyStyle);
                setCellMoney(row.createCell(col++), order.getTotal(), moneyStyle);

                ShippingAddress sa = order.getShippingAddress();
                row.createCell(col++).setCellValue(sa != null ? sa.getReceiverName() : "");
                row.createCell(col++).setCellValue(sa != null ? sa.getFullAddress() : "");

                Cell dateCell = row.createCell(col);
                if (order.getCreatedAt() != null) {
                    dateCell.setCellValue(order.getCreatedAt().format(DATE_FMT));
                }
                dateCell.setCellStyle(dateStyle);
            }

            autoSizeColumns(summarySheet, summaryHeaders.length);

            Sheet detailSheet = wb.createSheet("Order Items");
            String[] detailHeaders = {
                    "Order ID", "Shop", "Product Name", "Variant",
                    "SKU", "Qty", "Unit Price", "Line Total"
            };
            createHeaderRow(detailSheet, detailHeaders, headerStyle);

            int detailRowIdx = 1;
            for (Order order : orders) {
                for (OrderShopGroup group : order.getOrderShopGroups()) {
                    String shopName = group.getShop() != null ? group.getShop().getName() : "";
                    for (OrderItem item : group.getOrderItems()) {
                        Row row = detailSheet.createRow(detailRowIdx++);
                        int col = 0;
                        row.createCell(col++).setCellValue(order.getId());
                        row.createCell(col++).setCellValue(shopName);
                        row.createCell(col++).setCellValue(item.getProductName());
                        row.createCell(col++).setCellValue(item.getVariantName());
                        row.createCell(col++).setCellValue(item.getVariantSku());
                        row.createCell(col++).setCellValue(item.getQuantity());
                        setCellMoney(row.createCell(col++), item.getPrice(), moneyStyle);

                        BigDecimal lineTotal = item.getPrice() != null
                                ? item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                                : BigDecimal.ZERO;
                        setCellMoney(row.createCell(col), lineTotal, moneyStyle);
                    }
                }
            }

            autoSizeColumns(detailSheet, detailHeaders.length);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();

        } catch (IOException e) {
            log.error("Failed to generate Excel report", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.PALE_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDateStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.LEFT);
        return style;
    }

    private CellStyle createMoneyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0"));
        return style;
    }

    private void createHeaderRow(Sheet sheet, String[] headers, CellStyle style) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private void setCellMoney(Cell cell, BigDecimal value, CellStyle style) {
        cell.setCellValue(value != null ? value.doubleValue() : 0);
        cell.setCellStyle(style);
    }

    private void autoSizeColumns(Sheet sheet, int colCount) {
        for (int i = 0; i < colCount; i++) {
            sheet.autoSizeColumn(i);
        }
    }
}
