package com.taivs.EcommerceWeb.constants;

import java.lang.annotation.Documented;

public class PredefinedPermission {

    public static final String VIEW_PROFILE = "user:view_profile";
    public static final String UPDATE_PROFILE = "user:update_profile";
    public static final String VIEW_PRODUCTS = "product:view";
    public static final String VIEW_CART = "cart:view";
    public static final String MANAGE_CART = "cart:manage";
    public static final String CREATE_ORDER = "order:create";
    public static final String VIEW_OWN_ORDERS = "order:view_own";
    public static final String CANCEL_OWN_ORDER = "order:cancel_own";

    public static final String CREATE_SHOP = "shop:create";
    public static final String UPDATE_SHOP = "shop:update";
    public static final String VIEW_OWN_SHOP = "shop:view_own";
    
    public static final String CREATE_PRODUCT = "product:create";
    public static final String UPDATE_PRODUCT = "product:update";
    public static final String DELETE_PRODUCT = "product:delete";
    public static final String MANAGE_INVENTORY = "product:manage_inventory";
    
    public static final String VIEW_SHOP_ORDERS = "order:view_shop";
    public static final String UPDATE_ORDER_STATUS = "order:update_status";
    
    public static final String CREATE_COUPON = "coupon:create";
    public static final String MANAGE_COUPON = "coupon:manage";

    public static final String CREATE_WAREHOUSE = "warehouse:create";
    public static final String UPDATE_WAREHOUSE = "warehouse:update";
    public static final String DELETE_WAREHOUSE = "warehouse:delete";
    public static final String VIEW_WAREHOUSES = "warehouse:view";
    public static final String MANAGE_WAREHOUSE_EMPLOYEES = "warehouse:manage_employees";
    public static final String VIEW_WAREHOUSE_ORDERS = "warehouse:view_orders";
    public static final String PROCESS_WAREHOUSE_ORDERS = "warehouse:process_orders";
    public static final String MANAGE_WAREHOUSE_STOCK = "warehouse:manage_stock";

    public static final String VIEW_ALL_USERS = "user:view_all";
    public static final String MANAGE_USERS = "user:manage";
    public static final String BAN_USER = "user:ban";
    
    public static final String VIEW_ALL_SHOPS = "shop:view_all";
    public static final String SUSPEND_SHOP = "shop:suspend";
    public static final String APPROVE_SHOP = "shop:approve";
    
    public static final String VIEW_ALL_PRODUCTS = "product:view_all";
    public static final String APPROVE_PRODUCT = "product:approve";
    
    public static final String VIEW_ALL_ORDERS = "order:view_all";
    public static final String MANAGE_ORDERS = "order:manage";
    public static final String REFUND_ORDER = "order:refund";
    
    public static final String MANAGE_CATEGORIES = "category:manage";
    public static final String VIEW_ANALYTICS = "analytics:view";
    public static final String MANAGE_SYSTEM = "system:manage";
}
