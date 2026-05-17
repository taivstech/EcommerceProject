package com.taivs.EcommerceWeb.services.product;

import java.util.List;

public interface SearchSuggestionService {

    /**
     * Returns popular search terms whose keyword starts with (or contains) the given prefix.
     * Results are ordered by popularity (searchCount DESC).
     *
     * @param prefix user's current input
     * @param limit  max number of terms to return
     * @return list of keyword strings
     */
    List<String> getSuggestions(String prefix, int limit);

    /**
     * Returns globally trending terms (for display when the search box is empty).
     *
     * @param limit max count
     */
    List<String> getTopPopular(int limit);

    /**
     * Increments the search count for the given keyword (called when user actually searches).
     * If the keyword does not exist yet, it is created with count = 1.
     *
     * @param keyword searched term
     */
    void recordSearch(String keyword);
}
