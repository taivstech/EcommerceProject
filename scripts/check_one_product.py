import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
}

def check_product():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    product_id = 'bd1c6a56-af6c-45e2-a4f3-c4b414274114'
    
    # 1. Product details
    cursor.execute("SELECT id, name, avg_rating, total_sold FROM products WHERE id = %s", (product_id,))
    prod = cursor.fetchone()
    if prod:
        print("Product:", prod)
    else:
        print("Product not found!")
        cursor.close()
        conn.close()
        return

    # 2. Product images
    cursor.execute("SELECT id, url, is_main FROM product_images WHERE product_id = %s", (product_id,))
    images = cursor.fetchall()
    print("Images:")
    for img in images:
        print(img)
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_product()
