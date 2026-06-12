import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
}

def find_broken():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    
    # Query product_images with .gif
    cursor.execute("SELECT p.id, p.name, pi.url FROM product_images pi JOIN products p ON pi.product_id = p.id WHERE pi.url LIKE '%.gif%'")
    rows = cursor.fetchall()
    print(f"Found {len(rows)} products in product_images with .gif:")
    for r in rows:
        print(f"  ID: {r['id']}, Name: {r['name']}, URL: {r['url']}")
        
    print("\n" + "="*50 + "\n")
    
    # Query product_variants with .gif
    cursor.execute("SELECT pv.id, pv.name, pv.image_url, p.id as product_id, p.name as product_name FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.image_url LIKE '%.gif%'")
    rows_v = cursor.fetchall()
    print(f"Found {len(rows_v)} variants in product_variants with .gif:")
    for r in rows_v:
        print(f"  Variant ID: {r['id']}, Variant Name: {r['name']}, Product ID: {r['product_id']}, Product Name: {r['product_name']}, URL: {r['image_url']}")

    cursor.close()
    conn.close()

if __name__ == '__main__':
    find_broken()
