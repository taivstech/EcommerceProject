"""
Data loader — reads all recommendation-relevant tables from MySQL.

Tables loaded:
  - products + categories  → content features
  - orders + order_shop_groups + order_items → user-item interactions (implicit)
  - customer_reviews + product_variants → user-item ratings (explicit)
"""

import logging
import pymysql
import pandas as pd

import config

logger = logging.getLogger(__name__)


def _get_connection():
    return pymysql.connect(
        host=config.DB_HOST,
        port=config.DB_PORT,
        user=config.DB_USER,
        password=config.DB_PASS,
        database=config.DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=10,
        read_timeout=30,
    )


def load_products() -> pd.DataFrame:
    """Load active products with category info."""
    conn = _get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT p.id,
                       p.name,
                       p.description,
                       p.category_id,
                       c.name        AS category_name,
                       p.min_price,
                       p.max_price,
                       p.total_sold,
                       p.shop_id,
                       p.created_at
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.deleted_at IS NULL
            """)
            rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df["min_price"] = pd.to_numeric(df["min_price"], errors="coerce").fillna(0)
    df["max_price"] = pd.to_numeric(df["max_price"], errors="coerce").fillna(0)
    df["total_sold"] = pd.to_numeric(df["total_sold"], errors="coerce").fillna(0).astype(int)
    logger.info("Loaded %d products", len(df))
    return df


def load_user_item_interactions() -> pd.DataFrame:
    """
    Load implicit interactions: who bought which product and how many.

    Returns DataFrame with columns:
      user_id, product_id, total_qty, last_order_date
    """
    conn = _get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT o.user_id,
                       oi.product_id,
                       SUM(oi.quantity)    AS total_qty,
                       MAX(o.created_at)   AS last_order_date
                FROM orders o
                JOIN order_shop_groups osg ON osg.order_id = o.id
                JOIN order_items oi        ON oi.order_shop_group_id = osg.id
                WHERE o.status IN ('COMPLETED', 'DELIVERED')
                  AND oi.product_id IS NOT NULL
                GROUP BY o.user_id, oi.product_id
            """)
            rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        return pd.DataFrame(columns=["user_id", "product_id", "total_qty", "last_order_date"])

    df = pd.DataFrame(rows)
    df["total_qty"] = pd.to_numeric(df["total_qty"], errors="coerce").fillna(1).astype(int)
    logger.info("Loaded %d user-item interactions from orders", len(df))
    return df


def load_user_ratings() -> pd.DataFrame:
    """
    Load explicit ratings: user → product → avg rating.

    Reviews are on product_variants, so we join to get the parent product_id.

    Returns DataFrame with columns:
      user_id, product_id, avg_rating
    """
    conn = _get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT cr.user_id,
                       pv.product_id,
                       AVG(cr.rating) AS avg_rating
                FROM customer_reviews cr
                JOIN product_variants pv ON cr.product_variant_id = pv.id
                WHERE cr.deleted_at IS NULL
                  AND pv.deleted_at IS NULL
                GROUP BY cr.user_id, pv.product_id
            """)
            rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        return pd.DataFrame(columns=["user_id", "product_id", "avg_rating"])

    df = pd.DataFrame(rows)
    df["avg_rating"] = pd.to_numeric(df["avg_rating"], errors="coerce").fillna(0)
    logger.info("Loaded %d user-product ratings", len(df))
    return df


def load_order_baskets() -> pd.DataFrame:
    """
    Load which products were bought together in the same order.

    Returns DataFrame with columns:
      order_id, product_id
    One row per unique (order, product) pair.
    """
    conn = _get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT o.id AS order_id,
                       oi.product_id
                FROM orders o
                JOIN order_shop_groups osg ON osg.order_id = o.id
                JOIN order_items oi        ON oi.order_shop_group_id = osg.id
                WHERE o.status IN ('COMPLETED', 'DELIVERED')
                  AND oi.product_id IS NOT NULL
                GROUP BY o.id, oi.product_id
            """)
            rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        return pd.DataFrame(columns=["order_id", "product_id"])

    df = pd.DataFrame(rows)
    logger.info("Loaded %d order-product basket rows", len(df))
    return df


def load_all():
    """Load all datasets at once. Returns a dict of DataFrames."""
    logger.info("Loading all recommendation data from MySQL...")
    products = load_products()
    interactions = load_user_item_interactions()
    ratings = load_user_ratings()
    baskets = load_order_baskets()
    logger.info(
        "Data load complete — products=%d, interactions=%d, ratings=%d, basket_rows=%d",
        len(products), len(interactions), len(ratings), len(baskets),
    )
    return {
        "products": products,
        "interactions": interactions,
        "ratings": ratings,
        "baskets": baskets,
    }
