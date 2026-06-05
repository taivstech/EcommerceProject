import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
}

def check():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    
    # Let's count how many order_items exist in total
    cursor.execute("SELECT COUNT(*) FROM order_items")
    print(f"Total order_items in DB: {cursor.fetchone()}")
    
    # Let's see the distinct shop_ids in order_shop_groups
    cursor.execute("""
        SELECT s.name as shop_name, COUNT(g.id) as group_count, COUNT(oi.id) as item_count
        FROM order_shop_groups g
        JOIN shops s ON g.shop_id = s.id
        LEFT JOIN order_items oi ON oi.order_shop_group_id = g.id
        GROUP BY s.name
    """)
    print("\nOrder count by Shop:")
    for r in cursor.fetchall():
        print(r)
        
    # Let's check a few order items from SportsPro shop group
    cursor.execute("""
        SELECT oi.product_name, p.name as actual_product_name, s.name as product_owner_shop
        FROM order_items oi
        JOIN order_shop_groups g ON oi.order_shop_group_id = g.id
        JOIN shops gs ON g.shop_id = gs.id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN shops s ON p.shop_id = s.id
        WHERE gs.name = 'SportsPro'
        LIMIT 10
    """)
    print("\nSportsPro Order Items and actual product owners:")
    for r in cursor.fetchall():
        print(r)
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check()
