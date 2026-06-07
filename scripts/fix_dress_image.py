import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
}

def fix_image():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    product_id = 'bd1c6a56-af6c-45e2-a4f3-c4b414274114'
    new_url = 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600&auto=format&fit=crop&q=80'
    
    try:
        # 1. Update product_images
        cursor.execute("""
            UPDATE product_images 
            SET url = %s 
            WHERE product_id = %s AND url LIKE '%.gif%'
        """, (new_url, product_id))
        updated_prod_images = cursor.rowcount
        print(f"Updated {updated_prod_images} rows in product_images")
        
        # In case there's no matching .gif, update all images of this product
        if updated_prod_images == 0:
            cursor.execute("""
                UPDATE product_images 
                SET url = %s 
                WHERE product_id = %s
            """, (new_url, product_id))
            print(f"Force updated {cursor.rowcount} rows in product_images")
            
        # 2. Update product_variants image_url
        cursor.execute("""
            UPDATE product_variants 
            SET image_url = %s 
            WHERE product_id = %s
        """, (new_url, product_id))
        print(f"Updated {cursor.rowcount} rows in product_variants")
        
        # 3. Update product_variant_images
        cursor.execute("""
            UPDATE product_variant_images pvi
            JOIN product_variants pv ON pvi.variant_id = pv.id
            SET pvi.url = %s
            WHERE pv.product_id = %s
        """, (new_url, product_id))
        print(f"Updated {cursor.rowcount} rows in product_variant_images")
        
        conn.commit()
        print("Successfully updated the product image to the new high-quality Unsplash image!")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_image()
