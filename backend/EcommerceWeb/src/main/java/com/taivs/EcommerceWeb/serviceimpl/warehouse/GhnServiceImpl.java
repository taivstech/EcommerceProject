package com.taivs.EcommerceWeb.serviceimpl.warehouse;

import com.taivs.EcommerceWeb.models.promotion.Coupon;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.dto.request.warehouse.ShippingFeeRequest;
import com.taivs.EcommerceWeb.services.warehouse.GhnService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GhnServiceImpl implements GhnService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ghn.api-url}")
    private String apiUrl;

    private String getCleanApiUrl() {
        if (apiUrl != null && apiUrl.endsWith("/")) {
            return apiUrl.substring(0, apiUrl.length() - 1);
        }
        return apiUrl;
    }

    @Value("${ghn.token}")
    private String token;

    @Value("${ghn.shop-id}")
    private String shopId;

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", token);
        headers.set("ShopId", shopId);
        return headers;
    }

    @Override
    public String getProvinces() {
        String url = getCleanApiUrl() + "/master-data/province";
        HttpEntity<Void> request = new HttpEntity<>(buildHeaders());
        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, request, String.class);
        return response.getBody();
    }

    @Override
    public String getDistricts(int provinceId) {
        String url = getCleanApiUrl() + "/master-data/district?province_id=" + provinceId;
        HttpEntity<Void> request = new HttpEntity<>(buildHeaders());
        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, request, String.class);
        return response.getBody();
    }

    @Override
    public String getWards(int districtId) {
        String url = getCleanApiUrl() + "/master-data/ward?district_id=" + districtId;
        HttpEntity<Void> request = new HttpEntity<>(buildHeaders());
        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, request, String.class);
        return response.getBody();
    }

    @Override
    public Map<String, Object> getAvailableService(Integer fromDistrictId, Integer toDistrictId) {
        String url = getCleanApiUrl() + "/v2/shipping-order/available-services";
        Map<String, Object> body = Map.of(
                "shop_id", Integer.parseInt(shopId),
                "from_district", fromDistrictId,
                "to_district", toDistrictId
        );
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, buildHeaders());
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, request, new ParameterizedTypeReference<>() {});
        return response.getBody();
    }

    @Override
    public Map<String, Object> calculateFee(ShippingFeeRequest requestDto) {
        return calculateFeeInternal(requestDto, Integer.parseInt(shopId));
    }

    @Override
    public Map<String, Object> calculateFeeWithShopId(ShippingFeeRequest requestDto, int ghnShopId) {
        return calculateFeeInternal(requestDto, ghnShopId);
    }

    private Map<String, Object> calculateFeeInternal(ShippingFeeRequest requestDto, int ghnShopId) {
        String url = getCleanApiUrl() + "/v2/shipping-order/fee";

        Map<String, Object> body = new LinkedHashMap<>();

        if (requestDto.getServiceTypeId() != null)
            body.put("service_type_id", requestDto.getServiceTypeId());
        if (requestDto.getFromDistrictId() != null)
            body.put("from_district_id", requestDto.getFromDistrictId());
        if (requestDto.getFromWardCode() != null)
            body.put("from_ward_code", requestDto.getFromWardCode());
        if (requestDto.getToDistrictId() != null)
            body.put("to_district_id", requestDto.getToDistrictId());
        if (requestDto.getToWardCode() != null)
            body.put("to_ward_code", requestDto.getToWardCode());
        if (requestDto.getWeight() != null)
            body.put("weight", requestDto.getWeight());
        if (requestDto.getLength() != null)
            body.put("length", requestDto.getLength());
        if (requestDto.getWidth() != null)
            body.put("width", requestDto.getWidth());
        if (requestDto.getHeight() != null)
            body.put("height", requestDto.getHeight());
        if (requestDto.getInsuranceValue() != null)
            body.put("insurance_value", requestDto.getInsuranceValue());
        if (requestDto.getCoupon() != null)
            body.put("coupon", requestDto.getCoupon());

        if (requestDto.getItems() != null && !requestDto.getItems().isEmpty()) {
            List<Map<String, Object>> itemsList = requestDto.getItems().stream()
                    .map(item -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        if (item.getName() != null) m.put("name", item.getName());
                        if (item.getQuantity() != null) m.put("quantity", item.getQuantity());
                        if (item.getLength() != null) m.put("length", item.getLength());
                        if (item.getWidth() != null) m.put("width", item.getWidth());
                        if (item.getHeight() != null) m.put("height", item.getHeight());
                        if (item.getWeight() != null) m.put("weight", item.getWeight());
                        return m;
                    })
                    .collect(Collectors.toList());
            body.put("items", itemsList);
        } else {
            // GHN often requires at least one item even for weight-based calculation
            Map<String, Object> dummyItem = new LinkedHashMap<>();
            dummyItem.put("name", "Product");
            dummyItem.put("quantity", 1);
            dummyItem.put("weight", requestDto.getWeight() != null ? requestDto.getWeight() : 200);
            body.put("items", List.of(dummyItem));
        }

        // Add shop_id to body
        body.put("shop_id", ghnShopId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", token);
        headers.set("ShopId", String.valueOf(ghnShopId));

        log.info("GHN calculate-fee with ShopId={}, body: {}", ghnShopId, body);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.POST, request, new ParameterizedTypeReference<>() {});
            return response.getBody();
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("GHN fee API error (4xx) for ShopId {}: {}. Status: {}, Body: {}", 
                    ghnShopId, e.getResponseBodyAsString(), e.getStatusCode(), body);
            throw e;
        } catch (Exception e) {
            log.error("GHN fee API unexpected error for ShopId {}: {}", ghnShopId, e.getMessage());
            throw e;
        }
    }

    @Override
    public Map<String, Object> registerShop(String name, String phone, String address,
                                             int districtId, String wardCode) {
        String url = getCleanApiUrl() + "/v2/shop/register";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("district_id", districtId);
        body.put("ward_code", wardCode);
        body.put("name", name);
        body.put("phone", phone);
        body.put("address", address);

        log.info("GHN register-shop request: {}", body);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, buildHeaders());
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url, HttpMethod.POST, request, new ParameterizedTypeReference<>() {});

        log.info("GHN register-shop response: {}", response.getBody());
        return response.getBody();
    }
}
