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
    
    cursor.execute("""
        SELECT DISTINCT o.id as order_id, s.name as shop_name, o.created_at
        FROM order_items oi
        JOIN order_shop_groups g ON oi.order_shop_group_id = g.id
        JOIN orders o ON g.order_id = o.id
        JOIN shops s ON g.shop_id = s.id
        LEFT JOIN product_variants v ON oi.product_variant_id = v.id
        WHERE v.id IS NULL
    """)
    rows = cursor.fetchall()
    print(f"Total invalid orders: {len(rows)}")
    print("Invalid orders list:")
    for r in rows:
        print(r)
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check()
