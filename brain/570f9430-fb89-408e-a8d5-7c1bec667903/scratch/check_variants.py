import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
}

def check_variants():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Check product_variants
        cursor.execute("SELECT id, name, price, product_id FROM product_variants WHERE id IS NULL OR id = '' OR name = ''")
        rows = cursor.fetchall()
        print(f"Found {len(rows)} product variants with null/empty id/name:")
        for r in rows:
            print(r)
            
        # Check products count and variants count
        cursor.execute("SELECT COUNT(*) as c FROM products")
        print("Products count:", cursor.fetchone()['c'])
        
        cursor.execute("SELECT COUNT(*) as c FROM product_variants")
        print("Variants count:", cursor.fetchone()['c'])
        
        # Check a few product variants for "Bodhi Dog"
        cursor.execute("SELECT pv.id, pv.name, pv.price, p.name as product_name FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE p.name LIKE '%Bodhi%'")
        rows = cursor.fetchall()
        print(f"Found {len(rows)} variants for 'Bodhi':")
        for r in rows:
            print(r)
            
    except Exception as e:
        print("Error:", e)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_variants()
