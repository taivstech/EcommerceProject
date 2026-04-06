package com.taivs.EcommerceWeb.services.order;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;

public interface ExportService {

    byte[] exportOrdersExcel(LocalDate from, LocalDate to);

    byte[] exportSellerOrdersExcel(LocalDate from, LocalDate to);
}
