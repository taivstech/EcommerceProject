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
        SELECT oi.* 
        FROM order_items oi
        LEFT JOIN product_variants v ON oi.product_variant_id = v.id
        WHERE v.id IS NULL
        LIMIT 5
    """)
    rows = cursor.fetchall()
    print("Invalid order_items:")
    for r in rows:
        print(r)
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check()
