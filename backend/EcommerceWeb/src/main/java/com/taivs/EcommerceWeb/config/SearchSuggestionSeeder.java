package com.taivs.EcommerceWeb.config;

import com.taivs.EcommerceWeb.models.product.SearchSuggestion;
import com.taivs.EcommerceWeb.repositories.product.SearchSuggestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SearchSuggestionSeeder implements ApplicationRunner {

    private final SearchSuggestionRepository repo;

    private static final List<Object[]> SEED_TERMS = List.of(

            new Object[] { "men t-shirt", "fashion", 9800L },
            new Object[] { "white t-shirt", "fashion", 8700L },
            new Object[] { "men polo shirt", "fashion", 7500L },
            new Object[] { "men casual shirt", "fashion", 7100L },
            new Object[] { "men jeans", "fashion", 8200L },
            new Object[] { "men shorts", "fashion", 6400L },
            new Object[] { "men trousers", "fashion", 5900L },
            new Object[] { "men jacket", "fashion", 7800L },
            new Object[] { "men hoodie", "fashion", 8100L },
            new Object[] { "beautiful women dress", "fashion", 9100L },
            new Object[] { "women office skirt", "fashion", 8600L },
            new Object[] { "women t-shirt", "fashion", 8400L },
            new Object[] { "women sweater", "fashion", 6800L },
            new Object[] { "women leggings", "fashion", 7200L },
            new Object[] { "women skirt", "fashion", 7600L },
            new Object[] { "women traditional dress", "fashion", 6300L },
            new Object[] { "women homewear set", "fashion", 5800L },
            new Object[] { "oversized t-shirt", "fashion", 8900L },

            new Object[] { "men running shoes", "footwear", 9300L },
            new Object[] { "men sneakers", "footwear", 8800L },
            new Object[] { "men leather shoes", "footwear", 7400L },
            new Object[] { "women high heels", "footwear", 8100L },
            new Object[] { "men fashion slides", "footwear", 6200L },
            new Object[] { "women slides", "footwear", 6500L },
            new Object[] { "women running shoes", "footwear", 7800L },
            new Object[] { "women sandals", "footwear", 6100L },
            new Object[] { "men boots", "footwear", 5700L },

            new Object[] { "iphone smartphone", "electronics", 9600L },
            new Object[] { "bluetooth headphones", "electronics", 9200L },
            new Object[] { "power bank", "electronics", 8500L },
            new Object[] { "usb type c cable", "electronics", 7900L },
            new Object[] { "iphone phone case", "electronics", 8300L },
            new Object[] { "samsung phone case", "electronics", 7600L },
            new Object[] { "computer monitor", "electronics", 7100L },
            new Object[] { "mechanical keyboard", "electronics", 7800L },
            new Object[] { "wireless mouse", "electronics", 7300L },
            new Object[] { "business laptop", "electronics", 8700L },
            new Object[] { "over ear headphones", "electronics", 7400L },
            new Object[] { "portable bluetooth speaker", "electronics", 7000L },
            new Object[] { "men smartwatch", "electronics", 7500L },

            new Object[] { "sunscreen cream", "beauty", 9400L },
            new Object[] { "lipstick color", "beauty", 8800L },
            new Object[] { "face wash cleanser", "beauty", 9000L },
            new Object[] { "moisturizer cream", "beauty", 8500L },
            new Object[] { "micellar makeup remover", "beauty", 7900L },
            new Object[] { "vitamin c serum", "beauty", 8200L },
            new Object[] { "hydrating face mask", "beauty", 7600L },
            new Object[] { "women perfume spray", "beauty", 7100L },

            new Object[] { "smart rice cooker", "home", 8400L },
            new Object[] { "kitchen blender", "home", 7200L },
            new Object[] { "electric kettle", "home", 6800L },
            new Object[] { "bedding sheet set", "home", 7600L },
            new Object[] { "bedroom night light", "home", 6400L },
            new Object[] { "wall hanging mirror", "home", 5900L },
            new Object[] { "wooden bookshelf", "home", 5700L },
            new Object[] { "home air purifier", "home", 6900L },

            new Object[] { "women handbag", "bags", 8600L },
            new Object[] { "men backpack", "bags", 8100L },
            new Object[] { "men leather wallet", "bags", 7300L },
            new Object[] { "men leather belt", "bags", 6200L },
            new Object[] { "men analog watch", "accessories", 8900L },
            new Object[] { "women fashion watch", "accessories", 8100L },
            new Object[] { "women jewelry bracelet", "accessories", 6600L },
            new Object[] { "sport baseball cap", "accessories", 6400L },

            new Object[] { "home workout equipment", "sports", 7200L },
            new Object[] { "sportswear athletic suit", "sports", 7800L },
            new Object[] { "gym water bottle", "sports", 6100L },
            new Object[] { "badminton racket", "sports", 5800L },
            new Object[] { "boxing training gloves", "sports", 5300L });

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Redumping search_suggestions table to use English keywords...");
        try {
            repo.deleteAll();
            log.info("Existing suggestions cleared successfully.");
        } catch (Exception e) {
            log.error("Failed to clear search suggestions table: {}", e.getMessage());
        }

        int created = 0;
        for (Object[] row : SEED_TERMS) {
            try {
                String keyword = (String) row[0];
                String category = (String) row[1];
                Long count = (Long) row[2];

                if (repo.findByKeywordIgnoreCase(keyword).isEmpty()) {
                    repo.save(SearchSuggestion.builder()
                            .keyword(keyword)
                            .category(category)
                            .searchCount(count)
                            .isActive(true)
                            .build());
                    created++;
                }
            } catch (Exception e) {
                log.warn("Failed to seed term '{}': {}", row[0], e.getMessage());
            }
        }
        log.info("SearchSuggestion seed complete: {} English terms inserted.", created);
    }
}
