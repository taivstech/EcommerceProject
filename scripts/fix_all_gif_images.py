import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
}

def fix_all_gif_images():
    print("Connecting to database to replace all broken GIF images...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    fallback_url = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'
    
    try:
        # 1. Update product_images
        cursor.execute("""
            UPDATE product_images 
            SET url = %s 
            WHERE url LIKE '%.gif%'
        """, (fallback_url,))
        updated_images = cursor.rowcount
        print(f"Updated {updated_images} rows in product_images")
        
        # 2. Update product_variants
        cursor.execute("""
            UPDATE product_variants 
            SET image_url = %s 
            WHERE image_url LIKE '%.gif%'
        """, (fallback_url,))
        updated_variants = cursor.rowcount
        print(f"Updated {updated_variants} rows in product_variants")
        
        # 3. Update product_variant_images
        cursor.execute("""
            UPDATE product_variant_images 
            SET url = %s 
            WHERE url LIKE '%.gif%'
        """, (fallback_url,))
        updated_variant_images = cursor.rowcount
        print(f"Updated {updated_variant_images} rows in product_variant_images")
        
        conn.commit()
        print("Successfully updated all placeholder GIF images to a clean Unsplash product image!")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_all_gif_images()
