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
    
    # Check all columns in orders table
    cursor.execute("SELECT * FROM orders LIMIT 2")
    print("Orders sample:")
    for r in cursor.fetchall():
        print(r)
        
    # Check all columns in order_shop_groups table
    cursor.execute("SELECT * FROM order_shop_groups LIMIT 2")
    print("\nOrder shop groups sample:")
    for r in cursor.fetchall():
        print(r)
        
    # Check for any rows with nulls in important columns
    cursor.execute("SELECT COUNT(*) FROM order_shop_groups WHERE shop_id IS NULL")
    print(f"\nGroups with shop_id IS NULL: {cursor.fetchone()}")
    
    cursor.execute("SELECT COUNT(*) FROM order_items WHERE order_shop_group_id IS NULL")
    print(f"Items with group_id IS NULL: {cursor.fetchone()}")
    
    cursor.execute("SELECT COUNT(*) FROM order_items WHERE product_variant_id IS NULL")
    print(f"Items with product_variant_id IS NULL: {cursor.fetchone()}")
    
    # Are there any items where product_variant_id doesn't exist in product_variants?
    cursor.execute("""
        SELECT COUNT(*) FROM order_items oi
        LEFT JOIN product_variants v ON oi.product_variant_id = v.id
        WHERE v.id IS NULL
    """)
    print(f"Items with non-existent product_variant_id: {cursor.fetchone()}")
    
    # Let's count items where product_id doesn't exist in products
    cursor.execute("""
        SELECT COUNT(*) FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE p.id IS NULL
    """)
    print(f"Items with non-existent product_id: {cursor.fetchone()}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    check()
