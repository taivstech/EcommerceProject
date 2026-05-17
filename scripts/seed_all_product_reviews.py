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
FILES_TO_READ = ["Home_and_Kitchen.jsonl", "Electronics.jsonl", "All_Beauty.jsonl"]

def stream_jsonl(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try: yield json.loads(line)
            except json.JSONDecodeError: continue

def main():
    print("=" * 60)
    print(" DUMPING REVIEWS TO ALL PRODUCTS WITH RATING_COUNT > 0 ")
    print("=" * 60)

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
        print("No users found.")
        return

    # 2. Fetch all products that have rating_count > 0
    # But check if they already have actual reviews
    print("Identifying products that need review text...")
    cursor.execute("""
        SELECT p.id, p.avg_rating, p.rating_count
        FROM products p
        LEFT JOIN (
            SELECT p.id as prod_id, count(cr.id) as real_count
            FROM customer_reviews cr
            JOIN product_variants pv ON cr.product_variant_id = pv.id
            JOIN products p ON pv.product_id = p.id
            GROUP BY p.id
        ) rc ON p.id = rc.prod_id
        WHERE p.rating_count > 0 AND (rc.real_count IS NULL OR rc.real_count < 2)
    """)
    products_needing_reviews = cursor.fetchall()
    
    if not products_needing_reviews:
        print("All products seem to have enough real reviews! Exiting.")
        return
        
    print(f"Found {len(products_needing_reviews)} products needing review text.")
    
    # 3. Cache variants for these products
    cursor.execute("SELECT product_id, id FROM product_variants WHERE status = 'ACTIVE'")
    variant_map = {}
    for pid, vid in cursor.fetchall():
        if pid not in variant_map:
            variant_map[pid] = []
        variant_map[pid].append(vid)

    now = datetime.now()
    
    # Preload a pool of review texts from JSONL to avoid reading file multiple times
    print("Preloading a pool of review comments...")
    review_pool = []
    
    for filename in FILES_TO_READ:
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath): continue
        print(f"Reading {filename}...")
        for item in stream_jsonl(filepath):
            text = item.get("text", "").strip()
            rating = item.get("rating")
            if not text or not rating: continue
            try: rating = int(float(rating))
            except: continue
            
            if len(text) > 500:
                text = text[:497] + "..."
            review_pool.append((rating, text))
            if len(review_pool) > 50000:
                break
        if len(review_pool) > 50000:
            break
            
    if not review_pool:
        print("Failed to load any reviews from dataset.")
        return

    print(f"Loaded {len(review_pool)} reviews into memory pool.")

    # Sort pool by rating for easy matching
    reviews_by_rating = {1: [], 2: [], 3: [], 4: [], 5: []}
    for r, t in review_pool:
        if r in reviews_by_rating:
            reviews_by_rating[r].append(t)

    # 4. Dump reviews for each product
    print("Generating inserts...")
    inserts_batch = []
    total_inserted = 0

    for i, prod in enumerate(products_needing_reviews):
        pid, avg_rating, rating_count = prod
        vids = variant_map.get(pid)
        if not vids: continue
        
        # Decide how many reviews to dump (max 15 to save DB space, but UI will show the fake '294' count anyway)
        # We just need some text so the "No reviews yet" message disappears!
        num_to_dump = min(rating_count, random.randint(5, 12))
        
        for _ in range(num_to_dump):
            # Try to pick a rating close to avg_rating
            target_r = int(round(float(avg_rating)))
            if target_r < 1: target_r = 1
            if target_r > 5: target_r = 5
            
            # Add some variance
            if random.random() < 0.3:
                target_r = random.choice([1, 2, 3, 4, 5])
                
            pool = reviews_by_rating.get(target_r)
            if not pool: pool = reviews_by_rating[5] # fallback
            
            text = random.choice(pool)
            vid = random.choice(vids)
            uid_str = random.choice(user_ids)
            created_at = now - timedelta(days=random.randint(0, 365))
            
            inserts_batch.append((
                str(uuid.uuid4()),
                target_r,
                text,
                vid,
                uid_str,
                created_at,
                created_at
            ))
            
        if len(inserts_batch) >= 2000:
            cursor.executemany("""
                INSERT INTO customer_reviews (id, rating, comment, product_variant_id, user_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, inserts_batch)
            conn.commit()
            total_inserted += len(inserts_batch)
            print(f"  Inserted {total_inserted} reviews (Progress: {i}/{len(products_needing_reviews)} products)")
            inserts_batch.clear()

    if inserts_batch:
        cursor.executemany("""
            INSERT INTO customer_reviews (id, rating, comment, product_variant_id, user_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, inserts_batch)
        conn.commit()
        total_inserted += len(inserts_batch)

    print(f"Done! Inserted {total_inserted} total reviews for {len(products_needing_reviews)} products.")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
