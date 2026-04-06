package com.taivs.EcommerceWeb.services.order;

import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.dto.request.order.CreateReturnRequest;
import com.taivs.EcommerceWeb.dto.request.order.SellerReturnActionRequest;
import com.taivs.EcommerceWeb.dto.response.order.ReturnRequestResponse;

import java.util.List;

public interface ReturnRefundService {
    ReturnRequestResponse createReturnRequest(CreateReturnRequest request);

    List<ReturnRequestResponse> getMyReturnRequests();

    void cancelReturnRequest(String id);

    List<ReturnRequestResponse> getSellerReturnRequests();

    ReturnRequestResponse sellerAction(String id, SellerReturnActionRequest request);

    ReturnRequestResponse confirmReturned(String id);

    ReturnRequestResponse confirmRefund(String id);
}
