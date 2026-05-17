package com.taivs.EcommerceWeb.utils;

import com.taivs.EcommerceWeb.repositories.product.CategoryRepository;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;

/**
 * Category → search tag mapping for Shopee-style semantic search.
 *
 * Each category has a curated list of Vietnamese keyword tags.
 * When a seller creates a product in a category, these tags are automatically
 * applied so that searches like "áo phông" find "Unisex Graphic Tee".
 *
 * Matching is done by lowercased category name — no hard-coded IDs, so this
 * works across environments even when UUID keys differ.
 */
@Slf4j
public final class CategoryTagMapping {

    private CategoryTagMapping() {}

    /**
     * Vietnamese category name → semantic search tags.
     * Keys are lowercased, partial-matched (contains).
     */
    private static final Map<String, List<String>> CATEGORY_TAGS = Map.ofEntries(

            // ── Men's Fashion ─────────────────────────────────────────────────────
            Map.entry("men's fashion", List.of(
                    "men's t-shirt", "men's shirt", "men's polo", "men's jacket",
                    "men's hoodie", "men's sweater", "men's jeans", "men's shorts",
                    "men's trousers", "men's clothing", "men's wear"
            )),

            // ── Women's Fashion ─────────────────────────────────────────────────────
            Map.entry("women's fashion", List.of(
                    "women's t-shirt", "women's dress", "women's jacket", "women's sweater",
                    "women's skirt", "women's leggings", "women's clothing", "women's wear"
            )),

            // ── T-shirt ────────────────────────────────────────────────
            Map.entry("t-shirt", List.of(
                    "t-shirt", "tee", "cotton t-shirt", "crewneck t-shirt",
                    "oversized t-shirt", "white t-shirt", "men's t-shirt", "women's t-shirt"
            )),

            // ── Clothing (generic) ──────────────────────────────────────
            Map.entry("clothing", List.of(
                    "clothing", "fashion", "apparel", "wear"
            )),

            // ── Shoes & Footwear ──────────────────────────────────────────────────
            Map.entry("shoes", List.of(
                    "sports shoes", "sneakers", "dress shoes", "men's shoes",
                    "women's shoes", "boots", "leather shoes", "running shoes"
            )),
            Map.entry("sandals", List.of(
                    "men's sandals", "women's sandals", "sandals", "sports sandals", "slides", "flip flops"
            )),
            Map.entry("sneakers", List.of(
                    "sneakers", "sports shoes", "basketball shoes", "running shoes"
            )),

            // ── Electronics ───────────────────────────────────────────────────────
            Map.entry("phones", List.of(
                    "phone", "smartphone", "cellphone", "phone case",
                    "tempered glass", "phone charger"
            )),
            Map.entry("headphones", List.of(
                    "headphones", "bluetooth headphones", "wireless headphones",
                    "over-ear headphones", "earbuds", "airpods"
            )),
            Map.entry("laptops", List.of(
                    "laptop", "notebook", "office laptop", "gaming laptop", "student laptop"
            )),
            Map.entry("electronic accessories", List.of(
                    "accessories", "charging cable", "power bank", "mouse",
                    "keyboard", "hard drive", "usb"
            )),
            Map.entry("monitors", List.of(
                    "computer monitor", "gaming monitor", "monitor"
            )),

            // ── Cosmetics & Beauty ──────────────────────────────────────────────────
            Map.entry("cosmetics", List.of(
                    "cosmetics", "lipstick", "foundation", "powder",
                    "mascara", "makeup", "serum"
            )),
            Map.entry("skincare", List.of(
                    "skincare", "skin care", "moisturizer", "sunscreen",
                    "cleanser", "makeup remover", "toner", "vitamin c serum",
                    "face mask"
            )),
            Map.entry("perfume", List.of(
                    "perfume", "women's perfume", "men's perfume", "fragrance"
            )),

            // ── Home & Living ───────────────────────────────────────────────────────
            Map.entry("home appliances", List.of(
                    "home appliances", "kitchen appliances", "rice cooker", "blender",
                    "induction cooker", "microwave"
            )),
            Map.entry("furniture", List.of(
                    "furniture", "table", "chair", "bookshelf", "nightlight",
                    "wall mirror", "rug"
            )),
            Map.entry("bedding", List.of(
                    "bedding", "blanket", "pillow", "bedsheets"
            )),

            // ── Sports ────────────────────────────────────────────────────────────
            Map.entry("sports", List.of(
                    "sports", "gym equipment", "activewear", "sports water bottle",
                    "badminton racket", "boxing gloves", "jump rope", "yoga"
            )),

            // ── Bags & Backpacks ───────────────────────────────────────────────────
            Map.entry("handbags", List.of(
                    "women's handbag", "men's bag", "crossbody bag", "clutch",
                    "tote bag", "leather bag"
            )),
            Map.entry("backpacks", List.of(
                    "men's backpack", "women's backpack", "laptop backpack",
                    "travel backpack", "student backpack"
            )),

            // ── Accessories ────────────────────────────────────────────────────────
            Map.entry("accessories", List.of(
                    "fashion accessories", "men's watch", "women's watch",
                    "bracelet", "necklace", "ring", "earrings",
                    "baseball cap", "bucket hat", "sunglasses", "belt"
            )),
            Map.entry("watches", List.of(
                    "men's watch", "women's watch", "sports watch", "smartwatch"
            )),
            Map.entry("wallets", List.of(
                    "men's wallet", "women's wallet", "purse", "long wallet", "short wallet"
            )),

            // ── Books ──────────────────────────────────────────────────────────────
            Map.entry("books", List.of(
                    "books", "literature", "business books", "self-help books",
                    "children's books", "comics"
            )),

            // ── Toys ───────────────────────────────────────────────────────────────
            Map.entry("toys", List.of(
                    "toys", "educational toys", "lego", "model",
                    "stuffed animal", "puzzle"
            ))
    );

    /**
     * Returns suggested tags for a given category by matching the category's name.
     * Falls back to empty list if no mapping found.
     *
     * @param categoryId UUID of the category
     * @param categoryRepo repository to look up the category name
     */
    public static List<String> getTagsForCategory(String categoryId, CategoryRepository categoryRepo) {
        if (categoryId == null) return List.of();
        try {
            return categoryRepo.findById(categoryId)
                    .map(cat -> getTagsByCategoryName(cat.getName()))
                    .orElse(List.of());
        } catch (Exception e) {
            log.warn("Could not resolve tags for categoryId={}: {}", categoryId, e.getMessage());
            return List.of();
        }
    }

    /**
     * Returns suggested tags for a category name directly (for API endpoint).
     */
    public static List<String> getTagsByCategoryName(String categoryName) {
        if (categoryName == null) return List.of();
        String lower = categoryName.toLowerCase().trim();
        return CATEGORY_TAGS.entrySet().stream()
                .filter(e -> lower.contains(e.getKey()) || e.getKey().contains(lower))
                .flatMap(e -> e.getValue().stream())
                .distinct()
                .limit(20)
                .toList();
    }

    /**
     * Returns ALL available tags grouped by category for the seller tag-picker UI.
     */
    public static Map<String, List<String>> getAllMappings() {
        return CATEGORY_TAGS;
    }
}
