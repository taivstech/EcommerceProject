package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.models.product.SearchSuggestion;
import com.taivs.EcommerceWeb.repositories.product.SearchSuggestionRepository;
import com.taivs.EcommerceWeb.services.product.SearchSuggestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchSuggestionServiceImpl implements SearchSuggestionService {

    private final SearchSuggestionRepository repo;

    @Override
    @Transactional(readOnly = true)
    public List<String> getSuggestions(String prefix, int limit) {
        if (prefix == null || prefix.isBlank()) return List.of();

        String normalized = prefix.trim().toLowerCase();

        // 1. Prefix match (highest priority — starts with input)
        List<SearchSuggestion> prefixMatches =
                repo.findByPrefixOrderByPopularity(normalized, PageRequest.of(0, limit));

        // Use LinkedHashSet to preserve insertion order while deduplicating
        LinkedHashSet<String> results = new LinkedHashSet<>();
        prefixMatches.forEach(s -> results.add(s.getKeyword()));

        // 2. Contains fallback — fill remaining slots
        if (results.size() < limit) {
            int remaining = limit - results.size();
            List<SearchSuggestion> containsMatches =
                    repo.findByContainsOrderByPopularity(normalized, PageRequest.of(0, remaining));
            containsMatches.forEach(s -> results.add(s.getKeyword()));
        }

        return new ArrayList<>(results);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getTopPopular(int limit) {
        return repo.findTopPopular(PageRequest.of(0, limit))
                .stream()
                .map(SearchSuggestion::getKeyword)
                .toList();
    }

    /**
     * Called whenever a user confirms a search.
     * Increments count if keyword exists; creates a new record if not.
     * This allows organic popularity to grow from real searches.
     */
    @Override
    @Transactional
    public void recordSearch(String keyword) {
        if (keyword == null || keyword.isBlank()) return;
        String normalized = keyword.trim().toLowerCase();
        try {
            Optional<SearchSuggestion> existing = repo.findByKeywordIgnoreCase(normalized);
            if (existing.isPresent()) {
                repo.incrementCount(existing.get().getId());
            } else {
                // Auto-create with count=1 so real user searches naturally grow the corpus
                repo.save(SearchSuggestion.builder()
                        .keyword(normalized)
                        .searchCount(1L)
                        .isActive(true)
                        .build());
            }
        } catch (Exception e) {
            log.warn("Failed to record search for '{}': {}", keyword, e.getMessage());
        }
    }
}
