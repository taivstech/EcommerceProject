package com.taivs.EcommerceWeb.services.product;

import java.util.List;

public interface SearchHistoryService {

    void save(String keyword);

    List<String> getRecentSearches();

    void delete(String id);

    void clearAll();
}
