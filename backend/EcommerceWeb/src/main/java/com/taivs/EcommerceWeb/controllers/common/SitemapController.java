package com.taivs.EcommerceWeb.controllers.common;

import com.taivs.EcommerceWeb.repositories.product.CategoryRepository;
import com.taivs.EcommerceWeb.repositories.product.ProductRepository;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
public class SitemapController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ShopRepository shopRepository;

    @Value("${app.frontend.base-url:https://ecommerce.example.com}")
    private String baseUrl;

    private static final DateTimeFormatter W3C_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final int PRODUCT_LIMIT = 10_000;

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"\n");
        sb.append("        xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">\n");

        String today = LocalDateTime.now().format(W3C_DATE);

        addUrl(sb, baseUrl + "/", "1.0", "daily", today);
        addUrl(sb, baseUrl + "/shop", "0.9", "daily", today);
        addUrl(sb, baseUrl + "/pricing", "0.7", "monthly", today);

        try {
            categoryRepository.findAll()
                    .forEach(cat -> addUrl(sb, baseUrl + "/shop?categoryId=" + cat.getId(), "0.8", "weekly", today));
        } catch (Exception e) {
            log.warn("Sitemap: failed to load categories - {}", e.getMessage());
        }

        try {
            List<String> productIds = productRepository.findTopProductIdsByTotalSold(
                    PageRequest.of(0, PRODUCT_LIMIT));
            productIds.forEach(id -> addUrl(sb, baseUrl + "/product/" + id, "0.8", "weekly", today));
        } catch (Exception e) {
            log.warn("Sitemap: failed to load products - {}", e.getMessage());
        }

        try {
            shopRepository.findActiveShopUsernames()
                    .forEach(username -> addUrl(sb, baseUrl + "/shop/" + username, "0.7", "weekly", today));
        } catch (Exception e) {
            log.warn("Sitemap: failed to load shops - {}", e.getMessage());
        }

        sb.append("</urlset>");
        return sb.toString();
    }

    private void addUrl(StringBuilder sb, String loc, String priority, String changefreq, String lastmod) {
        sb.append("  <url>\n");
        sb.append("    <loc>").append(escapeXml(loc)).append("</loc>\n");
        sb.append("    <lastmod>").append(lastmod).append("</lastmod>\n");
        sb.append("    <changefreq>").append(changefreq).append("</changefreq>\n");
        sb.append("    <priority>").append(priority).append("</priority>\n");
        sb.append("  </url>\n");
    }

    private String escapeXml(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
