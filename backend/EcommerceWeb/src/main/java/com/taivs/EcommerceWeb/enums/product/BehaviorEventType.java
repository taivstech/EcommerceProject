package com.taivs.EcommerceWeb.enums.product;

/**
 * Types of user behavior events tracked for recommendation training.
 *
 * Weight hierarchy (used by collaborative filtering):
 *   VIEW < CLICK < SEARCH < WISHLIST < CART_ADD
 *
 * Purchase and review signals come from the orders/reviews tables
 * and are combined separately in data_loader.py with higher weights.
 */
public enum BehaviorEventType {
    /** User visited the product detail page */
    VIEW,
    /** User clicked a product card from a listing/feed */
    CLICK,
    /** User searched for a keyword (productId = null, keyword captured separately) */
    SEARCH,
    /** User added/removed from wishlist (always ADD — removals are ignored as implicit) */
    WISHLIST,
    /** User added product to cart */
    CART_ADD
}
