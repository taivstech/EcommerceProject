package com.taivs.EcommerceWeb.controllers.warehouse;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taivs.EcommerceWeb.dto.request.warehouse.ShippingFeeRequest;
import com.taivs.EcommerceWeb.services.warehouse.GhnService;
import com.taivs.EcommerceWeb.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ghn")
@RequiredArgsConstructor
@Slf4j
public class GhnController {

    private final GhnService ghnService;
    private final ObjectMapper objectMapper;

    @GetMapping("/provinces")
    public ApiResponse<Object> getProvinces() {
        try {
            String json = ghnService.getProvinces();
            Object data = objectMapper.readValue(json, Object.class);
            return ApiResponse.<Object>builder().code(1000).result(data).build();
        } catch (Exception e) {
            log.error("Failed to get provinces", e);
            return ApiResponse.<Object>builder().code(9999).message("Failed to get provinces").build();
        }
    }

    @GetMapping("/districts")
    public ApiResponse<Object> getDistricts(@RequestParam("province_id") int provinceId) {
        try {
            String json = ghnService.getDistricts(provinceId);
            Object data = objectMapper.readValue(json, Object.class);
            return ApiResponse.<Object>builder().code(1000).result(data).build();
        } catch (Exception e) {
            log.error("Failed to get districts", e);
            return ApiResponse.<Object>builder().code(9999).message("Failed to get districts").build();
        }
    }

    @GetMapping("/wards")
    public ApiResponse<Object> getWards(@RequestParam("district_id") int districtId) {
        try {
            String json = ghnService.getWards(districtId);
            Object data = objectMapper.readValue(json, Object.class);
            return ApiResponse.<Object>builder().code(1000).result(data).build();
        } catch (Exception e) {
            log.error("Failed to get wards", e);
            return ApiResponse.<Object>builder().code(9999).message("Failed to get wards").build();
        }
    }

    @PostMapping("/available-services")
    public ApiResponse<Object> getAvailableServices(@RequestBody Map<String, Integer> request) {
        try {
            Integer fromDistrictId = request.get("from_district_id");
            Integer toDistrictId = request.get("to_district_id");
            Map<String, Object> data = ghnService.getAvailableService(fromDistrictId, toDistrictId);
            return ApiResponse.<Object>builder().code(1000).result(data).build();
        } catch (Exception e) {
            log.error("Failed to get available services", e);
            return ApiResponse.<Object>builder().code(9999).message("Failed to get available services").build();
        }
    }

    @PostMapping("/calculate-fee")
    public ApiResponse<Object> calculateFee(@RequestBody ShippingFeeRequest request) {
        log.info("GHN calculate-fee incoming: serviceTypeId={}, fromDistrictId={}, toDistrictId={}, toWardCode={}, weight={}",
                request.getServiceTypeId(), request.getFromDistrictId(),
                request.getToDistrictId(), request.getToWardCode(), request.getWeight());
        try {
            Map<String, Object> data = ghnService.calculateFee(request);
            return ApiResponse.<Object>builder().code(1000).result(data).build();
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("GHN fee API error: {}", e.getResponseBodyAsString());
            String errorMessage = "GHN shipping fee calculation failed";
            String codeMessage = null;
            try {
                Map<String, Object> errorResponse = objectMapper.readValue(
                        e.getResponseBodyAsString(), new TypeReference<Map<String, Object>>() {});
                if (errorResponse.containsKey("message")) {
                    errorMessage = (String) errorResponse.get("message");
                }
                if (errorResponse.containsKey("code_message")) {
                    codeMessage = (String) errorResponse.get("code_message");
                }
            } catch (Exception parseEx) {
                log.warn("Failed to parse GHN error body: {}", parseEx.getMessage());
            }
            return ApiResponse.<Object>builder()
                    .code(9999)
                    .message(errorMessage)
                    .result(codeMessage != null ? Map.of("code_message", codeMessage) : null)
                    .build();
        } catch (Exception e) {
            log.error("Failed to calculate fee", e);
            return ApiResponse.<Object>builder().code(9999).message("Failed to calculate fee").build();
        }
    }
}
