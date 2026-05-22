package com.taivs.EcommerceWeb.dto.request.warehouse;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ShippingFeeRequest {

    @JsonProperty("shop_id")
    private String shopId;

    @JsonProperty("service_type_id")
    private Integer serviceTypeId;

    @JsonProperty("from_district_id")
    private Integer fromDistrictId;

    @JsonProperty("from_ward_code")
    private String fromWardCode;

    @JsonProperty("to_district_id")
    private Integer toDistrictId;

    @JsonProperty("to_ward_code")
    private String toWardCode;

    @JsonProperty("weight")
    private Integer weight;

    @JsonProperty("length")
    private Integer length;

    @JsonProperty("width")
    private Integer width;

    @JsonProperty("height")
    private Integer height;

    @JsonProperty("insurance_value")
    private Integer insuranceValue;

    @JsonProperty("coupon")
    private String coupon;

    @JsonProperty("items")
    private List<Item> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        @JsonProperty("name")
        private String name;
        @JsonProperty("quantity")
        private Integer quantity;
        @JsonProperty("length")
        private Integer length;
        @JsonProperty("width")
        private Integer width;
        @JsonProperty("height")
        private Integer height;
        @JsonProperty("weight")
        private Integer weight;
    }
}
