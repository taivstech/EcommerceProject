package com.taivs.EcommerceWeb.serviceimpl.product;

import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.models.admin.SearchHistory;
import com.taivs.EcommerceWeb.repositories.admin.SearchHistoryRepository;
import com.taivs.EcommerceWeb.services.product.SearchHistoryService;
import com.taivs.EcommerceWeb.exceptions.AppException;
import com.taivs.EcommerceWeb.exceptions.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SearchHistoryServiceImpl implements SearchHistoryService {

    private static final int MAX_HISTORY = 10;

    private final SearchHistoryRepository searchHistoryRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void save(String keyword) {
        if (keyword == null || keyword.isBlank()) return;

        String userId = getCurrentUserId();
        String trimmed = keyword.trim();
        if (trimmed.length() > 200) trimmed = trimmed.substring(0, 200);

        Optional<SearchHistory> existing = searchHistoryRepository.findByUserIdAndKeyword(userId, trimmed);
        if (existing.isPresent()) {
            existing.get().setSearchedAt(LocalDateTime.now());
            searchHistoryRepository.save(existing.get());
            return;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        SearchHistory history = SearchHistory.builder()
                .user(user)
                .keyword(trimmed)
                .build();

        searchHistoryRepository.save(history);

        List<SearchHistory> all = searchHistoryRepository.findRecentByUserId(userId);
        if (all.size() > MAX_HISTORY) {
            for (int i = MAX_HISTORY; i < all.size(); i++) {
                searchHistoryRepository.delete(all.get(i));
            }
        }
    }

    @Override
    public List<String> getRecentSearches() {
        String userId = getCurrentUserId();
        return searchHistoryRepository.findRecentByUserId(userId)
                .stream()
                .limit(MAX_HISTORY)
                .map(SearchHistory::getKeyword)
                .toList();
    }

    @Override
    @Transactional
    public void delete(String id) {
        String userId = getCurrentUserId();
        searchHistoryRepository.deleteByIdAndUserId(id, userId);
    }

    @Override
    @Transactional
    public void clearAll() {
        String userId = getCurrentUserId();
        searchHistoryRepository.deleteAllByUserId(userId);
    }

    private String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
