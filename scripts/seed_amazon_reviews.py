import mysql.connector
import json
import uuid
import os
import random
from datetime import datetime, timedelta

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
    'charset': 'utf8mb4',
    'autocommit': False,
}

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data_for_recommend_base_behavior")
FILES_TO_READ = ["All_Beauty.jsonl", "Amazon_Fashion.jsonl"]
MAX_REVIEWS_TO_SEED = 20000  # Reasonable amount to not crash DB

def stream_jsonl(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try: yield json.loads(line)
            except json.JSONDecodeError: continue

def main():
    print("=" * 50)
    print(" Seeding Amazon Reviews to MySQL ")
    print("=" * 50)

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
    except Exception as e:
        print("Failed to connect to DB:", e)
        return

    # 1. Fetch Users
    cursor.execute("SELECT id FROM users LIMIT 100")
    user_ids = [r[0] for r in cursor.fetchall()]
    if not user_ids:
        print("No users found in DB. Exiting.")
        return

    # 2. Fetch Products and Variants
    print("Fetching products and variants...")
    cursor.execute("SELECT id, avg_rating FROM products WHERE avg_rating IS NOT NULL")
    products = cursor.fetchall()
    
    if not products:
        print("No products with ratings found.")
        return
        
    print(f"Found {len(products)} products.")
    
    # Get one variant per product (just to attach the review to)
    cursor.execute("SELECT product_id, id FROM product_variants WHERE status = 'ACTIVE'")
    variant_map = {}
    for pid, vid in cursor.fetchall():
        if pid not in variant_map:
            variant_map[pid] = vid

    now = datetime.now()
    reviews_batch = []
    total_inserted = 0

    print("Reading review files...")
    for filename in FILES_TO_READ:
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            continue
            
        print(f"Processing {filename}...")
        for item in stream_jsonl(filepath):
            if total_inserted >= MAX_REVIEWS_TO_SEED:
                break
                
            text = item.get("text", "").strip()
            rating = item.get("rating")
            
            if not text or not rating:
                continue
                
            try:
                rating = int(float(rating))
            except:
                continue
                
            if len(text) > 500:
                text = text[:497] + "..."
                
            # Randomly pick a product
            product = random.choice(products)
            pid = product[0]
            vid = variant_map.get(pid)
            if not vid:
                continue
                
            uid_str = random.choice(user_ids)
            created_at = now - timedelta(days=random.randint(0, 365))
            
            reviews_batch.append((
                str(uuid.uuid4()),
                rating,
                text,
                vid,
                uid_str,
                created_at,
                created_at
            ))
            
            if len(reviews_batch) >= 1000:
                cursor.executemany("""
                    INSERT INTO customer_reviews (id, rating, comment, product_variant_id, user_id, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, reviews_batch)
                conn.commit()
                total_inserted += len(reviews_batch)
                print(f"  Inserted {total_inserted} reviews...")
                reviews_batch.clear()
                
        if total_inserted >= MAX_REVIEWS_TO_SEED:
            break

    if reviews_batch:
        cursor.executemany("""
            INSERT INTO customer_reviews (id, rating, comment, product_variant_id, user_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, reviews_batch)
        conn.commit()
        total_inserted += len(reviews_batch)

    print(f"Done! Inserted {total_inserted} reviews.")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
