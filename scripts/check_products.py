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
    cursor = conn.cursor()
    
    cursor.execute("SELECT count(*) FROM products")
    count = cursor.fetchone()[0]
    print(f"Total products in DB: {count}")
    
    cursor.execute("SELECT count(*) FROM products WHERE deleted_at IS NULL")
    active_count = cursor.fetchone()[0]
    print(f"Products with deleted_at IS NULL: {active_count}")
    
    if count > 0:
        cursor.execute("SELECT id, name, deleted_at FROM products LIMIT 5")
        for row in cursor.fetchall():
            print(row)
            
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check()
