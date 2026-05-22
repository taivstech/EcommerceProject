package com.taivs.EcommerceWeb.dto.response.chat;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatContactResponse {
    private String id; // This is the user's ID
    private String name; // Display name
    private String shopName; // If type is SHOP, display this
    private String type; // "USER" or "SHOP"
    private String avatar; // profile picture or logo
}
