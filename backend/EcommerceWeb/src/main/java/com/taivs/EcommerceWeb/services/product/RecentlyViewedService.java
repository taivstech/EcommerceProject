package com.taivs.EcommerceWeb.services.product;

import java.util.List;

public interface RecentlyViewedService {
    void trackView(String productId);

    List<String> getRecentlyViewedProductIds();
}
