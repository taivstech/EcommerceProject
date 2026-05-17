"""
seed_amazon_v2.py — Complete Amazon Product Data Seeder
- Drop & re-seed: categories, shops, users, products, variants, attributes, images
- Data normalization: skip no-image, fix price=0, deduplicate variants (fingerprint)
- 15 categories, ~20 fake shops, ~50k products from 7 main JSONL files
"""

import mysql.connector
import json
import uuid
import hashlib
import re
import os
from datetime import datetime, timedelta
import random

# ─────────────────────────────────────────────
#  CONFIG
# ─────────────────────────────────────────────
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
    'charset': 'utf8mb4',
    'autocommit': False,
}

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
BATCH_SIZE = 500
MAX_VARIANTS_PER_PRODUCT = 5
# Files to process (ordered by priority with custom limits)
CATEGORY_FILES = [
    # Popular categories (Higher limits)
    ("Electronics",            "meta_Electronics.jsonl",              5000),
    ("Fashion",                "meta_Amazon_Fashion.jsonl",           5000),
    ("Home & Kitchen",         "meta_Home_and_Kitchen.jsonl",         5000),
    ("Sports & Outdoors",      "meta_Sports_and_Outdoors.jsonl",      4000),
    ("Toys & Games",           "meta_Toys_and_Games.jsonl",           4000),
    
    # Mid-range categories
    ("Beauty",                 "meta_All_Beauty.jsonl",               3000),
    ("Health & Personal Care", "meta_Health_and_Personal_Care.jsonl",  3000),
    ("Pet Supplies",           "meta_Pet_Supplies.jsonl",              3000),
    ("Tools & Home Improvement","meta_Tools_and_Home_Improvement.jsonl",3000),
    ("Video Games",            "meta_Video_Games.jsonl",               3000),
    
    # Specialized categories (Lower limits)
    ("Office Products",        "meta_Office_Products.jsonl",          2000),
    ("Musical Instruments",    "meta_Musical_Instruments.jsonl",      2000),
    ("Industrial & Scientific", "meta_Industrial_and_Scientific.jsonl", 2000),
    ("Patio & Garden",         "meta_Patio_Lawn_and_Garden.jsonl",     2000),
    ("Movies & TV",            "meta_Movies_and_TV.jsonl",             2000),
]

VALID_ATTR_KEYS = {'color','size','style','capacity','pattern','material','storage','memory','flavor','scent','count','type','model','edition','format','voltage','wattage','gauge','weight'}

# ─────────────────────────────────────────────
#  FAKE SHOPS DATA
# ─────────────────────────────────────────────
FAKE_SHOPS = [
    ("TechZone Store",       "techzone@shop.com",      "Hà Nội"),
    ("HomeStyle",            "homestyle@shop.com",     "Hồ Chí Minh"),
    ("SportsPro",            "sportspro@shop.com",     "Đà Nẵng"),
    ("GadgetHub",            "gadgethub@shop.com",     "Hải Phòng"),
    ("KitchenWorld",         "kitchenworld@shop.com",  "Cần Thơ"),
    ("FashionCity",          "fashioncity@shop.com",   "Hà Nội"),
    ("OutdoorGear",          "outdoorgear@shop.com",   "Đà Lạt"),
    ("PetLove Shop",         "petlove@shop.com",       "Hồ Chí Minh"),
    ("HealthPlus",           "healthplus@shop.com",    "Hà Nội"),
    ("OfficeMart",           "officemart@shop.com",    "Hải Phòng"),
    ("ToyKingdom",           "toykingdom@shop.com",    "Hồ Chí Minh"),
    ("ToolMaster",           "toolmaster@shop.com",    "Đà Nẵng"),
    ("ElectroWorld",         "electroworld@shop.com",  "Hà Nội"),
    ("GardenLife",           "gardenlife@shop.com",    "Cần Thơ"),
    ("MusicZone",            "musiczone@shop.com",     "Hồ Chí Minh"),
    ("IndustrialPro",        "industrialpro@shop.com", "Bình Dương"),
    ("GameStation",          "gamestation@shop.com",   "Hà Nội"),
    ("BeautyBox",            "beautybox@shop.com",     "Hồ Chí Minh"),
    ("MovieStore",           "moviestore@shop.com",    "Đà Nẵng"),
    ("SmartHome",            "smarthome@shop.com",     "Hà Nội"),
]

BCRYPT_DUMMY = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y"

now_dt = datetime.now()

# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────

def uid(): return str(uuid.uuid4())

def stream_jsonl(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue

def clean_text(s, max_len=None):
    if not s:
        return ""
    s = re.sub(r'<[^>]+>', ' ', str(s))          # strip HTML
    s = re.sub(r'\s+', ' ', s).strip()
    if max_len and len(s) > max_len:
        s = s[:max_len - 3] + "..."
    return s

def extract_price(item):
    raw = str(item.get("price", "") or "")
    clean = re.sub(r'[^\d.]', '', raw)
    try:
        p = float(clean)
        return p if p > 0 else None
    except Exception:
        return None

def extract_images(item):
    imgs = item.get("images") or []
    urls = []
    for img in imgs:
        if not isinstance(img, dict):
            continue
        url = img.get("hi_res") or img.get("large") or img.get("thumb") or ""
        url = url.strip()
        if url and url.startswith("http") and len(url) <= 500:
            urls.append(url)
    return urls

def extract_attrs(item):
    details = item.get("details") or {}
    attrs = {}
    for k, v in details.items():
        k_str = str(k).strip()
        v_str = str(v).strip()
        k_lower = k_str.lower().replace(" ", "")
        for key in VALID_ATTR_KEYS:
            if key in k_lower and v_str and len(v_str) <= 100:
                attrs[key.capitalize()] = v_str
                break
    return attrs

def variant_fingerprint(parent_asin, attrs_dict, price):
    combo = parent_asin + "|" + "|".join(f"{k}={v}" for k, v in sorted(attrs_dict.items()))
    return hashlib.md5(combo.encode()).hexdigest()

def category_median_price(prices_by_cat, cat_name):
    prices = prices_by_cat.get(cat_name, [])
    if not prices:
        return 29.99
    prices.sort()
    mid = len(prices) // 2
    return prices[mid]

def clean_specs(details):
    if not details:
        return "{}"
    clean = {}
    for k, v in details.items():
        k2 = clean_text(str(k), 100)
        v2 = clean_text(str(v), 255)
        if k2 and v2 and v2.lower() not in ("none", "null", "nan", "n/a", ""):
            clean[k2] = v2
        if len(clean) >= 20:
            break
    try:
        return json.dumps(clean, ensure_ascii=False)
    except Exception:
        return "{}"

# ─────────────────────────────────────────────
#  DB OPERATIONS
# ─────────────────────────────────────────────
#  MOCK VARIANTS FOR UI DEMO
# ─────────────────────────────────────────────

def mock_variants_for_ui(base_attrs, cat_name):
    """Generate synthetic variants based on base attributes and category."""
    mocked = []
    cat_lower = cat_name.lower()
    
    if any(x in cat_lower for x in ["fashion", "clothing", "shoes", "sports"]):
        if "Color" in base_attrs:
            c = base_attrs["Color"].lower()
            adds = ["White", "Navy"] if "black" in c else (["Black", "Grey"] if "white" in c else ["Black", "White"])
            for a in adds:
                n = base_attrs.copy()
                n["Color"] = a
                mocked.append((n, 0.0))
        elif "Size" in base_attrs:
            s = base_attrs["Size"].upper()
            adds = ["S", "M", "L", "XL"]
            for a in adds:
                if a != s:
                    n = base_attrs.copy()
                    n["Size"] = a
                    mocked.append((n, 0.0))
                    
    elif any(x in cat_lower for x in ["electronic", "computer", "phone"]):
        for k in ["Capacity", "Storage", "Memory"]:
            if k in base_attrs:
                val = base_attrs[k].upper()
                if "GB" in val or "TB" in val:
                    adds = [("128GB", 50), ("256GB", 100)] if "64" in val else ([("256GB", 50), ("512GB", 150)] if "128" in val else [("512GB", 100), ("1TB", 250)])
                    for a, p_add in adds:
                        if a not in val:
                            n = base_attrs.copy()
                            n[k] = a
                            mocked.append((n, p_add))
                break
    return mocked

# ─────────────────────────────────────────────

def get_conn():
    return mysql.connector.connect(**DB_CONFIG)

def drop_and_reset(cursor, conn):
    print("\n[PHASE 0] Dropping existing product/shop/user data...")

    # Ensure new columns exist (safe for older MySQL without IF NOT EXISTS support)
    alter_stmts = [
        ("avg_rating", "ALTER TABLE products ADD COLUMN avg_rating DECIMAL(3,1) NULL"),
        ("rating_count", "ALTER TABLE products ADD COLUMN rating_count BIGINT NULL DEFAULT 0"),
    ]
    for col_name, stmt in alter_stmts:
        try:
            cursor.execute(stmt)
            conn.commit()
            print(f"  Added column: {col_name}")
        except Exception as e:
            err_str = str(e)
            if "Duplicate column" in err_str or "1060" in err_str:
                pass  # Column already exists, skip
            else:
                print(f"  [WARN] ALTER {col_name}: {e}")

    stmts = [
        "SET FOREIGN_KEY_CHECKS=0",
        "TRUNCATE TABLE product_variant_detail_attributes",
        "TRUNCATE TABLE product_variant_images",
        "TRUNCATE TABLE product_variants",
        "TRUNCATE TABLE product_images",
        "TRUNCATE TABLE detail_attributes",
        "TRUNCATE TABLE product_attributes",
        "TRUNCATE TABLE products",
        "TRUNCATE TABLE categories",
        # Keep wishlists/reviews/orders consistent: truncate related
        "TRUNCATE TABLE wishlists",
        "TRUNCATE TABLE customer_reviews",
        # Shops and users (seller) — keep admin users
        "DELETE FROM shops WHERE id IS NOT NULL",
        "DELETE FROM users WHERE email NOT LIKE '%@admin.%' AND email NOT IN ('admin@gocart.com','superadmin@gocart.com')",
        "SET FOREIGN_KEY_CHECKS=1",
    ]
    for stmt in stmts:
        try:
            cursor.execute(stmt)
        except Exception as e:
            print(f"  [WARN] {stmt[:60]}: {e}")
    conn.commit()
    print("  Done — DB reset complete.")


def seed_categories(cursor, conn):
    print("\n[PHASE 1] Seeding categories...")
    CATEGORIES = [
        ("Electronics",              "Electronics & Technology products",        "https://ik.imagekit.io/taivs93/categories/electronics.jpg"),
        ("Home & Kitchen",           "Home, kitchen and living products",        "https://ik.imagekit.io/taivs93/categories/home-kitchen.jpg"),
        ("Sports & Outdoors",        "Sports equipment and outdoor gear",        "https://ik.imagekit.io/taivs93/categories/sports.jpg"),
        ("Toys & Games",             "Toys, games and entertainment",            "https://ik.imagekit.io/taivs93/categories/toys.jpg"),
        ("Tools & Home Improvement", "Tools, hardware and home improvement",     "https://ik.imagekit.io/taivs93/categories/tools.jpg"),
        ("Pet Supplies",             "Food, accessories and care for pets",      "https://ik.imagekit.io/taivs93/categories/pets.jpg"),
        ("Health & Personal Care",   "Health, beauty and personal care",         "https://ik.imagekit.io/taivs93/categories/health.jpg"),
        ("Fashion",                  "Clothing, shoes and jewelry",              "https://ik.imagekit.io/taivs93/categories/fashion.jpg"),
        ("Office Products",          "Office supplies and stationery",           "https://ik.imagekit.io/taivs93/categories/office.jpg"),
        ("Musical Instruments",      "Instruments and music accessories",        "https://ik.imagekit.io/taivs93/categories/music.jpg"),
        ("Industrial & Scientific",  "Industrial tools and scientific equipment","https://ik.imagekit.io/taivs93/categories/industrial.jpg"),
        ("Patio & Garden",           "Garden tools and outdoor furniture",       "https://ik.imagekit.io/taivs93/categories/garden.jpg"),
        ("Video Games",              "Gaming consoles, games and accessories",   "https://ik.imagekit.io/taivs93/categories/gaming.jpg"),
        ("Movies & TV",              "DVDs, Blu-ray and streaming content",      "https://ik.imagekit.io/taivs93/categories/movies.jpg"),
        ("Beauty",                   "Makeup, skincare and beauty products",     "https://ik.imagekit.io/taivs93/categories/beauty.jpg"),
    ]
    cat_map = {}
    for name, desc, img in CATEGORIES:
        cid = uid()
        cursor.execute(
            "INSERT INTO categories (id, name, description, image_url, created_at, updated_at) VALUES (%s,%s,%s,%s,%s,%s)",
            (cid, name, desc, img, now_dt, now_dt)
        )
        cat_map[name] = cid
    conn.commit()
    print(f"  Seeded {len(cat_map)} categories.")
    return cat_map

def seed_admin(cursor, conn):
    print("\n[PHASE 2.5] Seeding admin account...")
    admin_id = uid()
    role_id = uid()
    
    # 1. Ensure ADMIN role exists
    cursor.execute("SELECT id FROM roles WHERE name = 'ADMIN'")
    res = cursor.fetchone()
    if res:
        role_id = res[0]
    else:
        cursor.execute("INSERT INTO roles (id, name, description, created_at, updated_at) VALUES (%s, %s, %s, %s, %s)",
                       (role_id, 'ADMIN', 'Administrator role', now_dt, now_dt))
    
    # 2. Create admin user
    cursor.execute("SELECT id FROM users WHERE email = 'admin@gocart.com'")
    res = cursor.fetchone()
    if res:
        admin_id = res[0]
        cursor.execute("UPDATE users SET password = %s WHERE id = %s", (BCRYPT_DUMMY, admin_id))
    else:
        cursor.execute("""
            INSERT INTO users (id, email, username, password, full_name, active, email_verified, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (admin_id, 'admin@gocart.com', 'admin', BCRYPT_DUMMY, "System Admin", True, True, now_dt, now_dt))
    
    # 3. Link user to role
    cursor.execute("SELECT * FROM user_roles WHERE user_id = %s AND role_id = %s", (admin_id, role_id))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO user_roles (user_id, role_id, assigned_at, created_at, updated_at) VALUES (%s, %s, %s, %s, %s)",
                       (admin_id, role_id, now_dt, now_dt, now_dt))
    
    conn.commit()
    print(f"  Admin seeded: admin@gocart.com / password")

def seed_shops(cursor, conn):
    print("\n[PHASE 2] Seeding fake shops & users...")
    shop_ids = []
    for shop_name, email, province in FAKE_SHOPS:
        user_id = uid()
        shop_id = uid()
        username = email.split("@")[0]
        cursor.execute("""
            INSERT INTO users (id, email, username, password, full_name, active, email_verified, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (user_id, email, username, BCRYPT_DUMMY, shop_name + " Owner", True, True, now_dt, now_dt))
        cursor.execute("""
            INSERT INTO shops (id, user_id, name, status, shop_address_province, approved_at, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """, (shop_id, user_id, shop_name, "APPROVED", province, now_dt, now_dt, now_dt))
        shop_ids.append(shop_id)
    conn.commit()
    print(f"  Seeded {len(shop_ids)} shops.")
    return shop_ids

def insert_batch(cursor, conn, products, p_images, p_attrs, d_attrs, variants, v_images, v_d_attrs):
    if products:
        cursor.executemany("""
            INSERT IGNORE INTO products
              (id, name, brand, description, specifications, min_price, max_price, total_sold, avg_rating, rating_count, category_id, shop_id, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, products)
    if p_images:
        cursor.executemany("""
            INSERT IGNORE INTO product_images (id, url, is_main, product_id, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, p_images)
    if p_attrs:
        cursor.executemany("""
            INSERT IGNORE INTO product_attributes (id, name, status, product_id, sort_order, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s)
        """, p_attrs)
    if d_attrs:
        cursor.executemany("""
            INSERT IGNORE INTO detail_attributes (id, name, image_url, status, product_attribute_id, sort_order)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, d_attrs)
    if variants:
        cursor.executemany("""
            INSERT IGNORE INTO product_variants
              (id, name, sku, price, stock, sold_count, status, image_url, product_id, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, variants)
    if v_images:
        cursor.executemany("""
            INSERT IGNORE INTO product_variant_images (id, url, is_main, variant_id, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, v_images)
    if v_d_attrs:
        cursor.executemany("""
            INSERT IGNORE INTO product_variant_detail_attributes (product_variant_id, detail_attribute_id)
            VALUES (%s,%s)
        """, v_d_attrs)
    conn.commit()

# ─────────────────────────────────────────────
#  MAIN SEED LOGIC
# ─────────────────────────────────────────────

def process_category(cat_name, filename, cat_id, shop_ids, cursor, conn, max_products):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"  [SKIP] File not found: {filepath}")
        return 0

    print(f"\n  Processing: {cat_name} <- {filename}")

    # First pass: collect category price samples for median
    price_samples = []
    lines_scanned = 0
    for item in stream_jsonl(filepath):
        lines_scanned += 1
        if lines_scanned > 20000:
            break
        p = extract_price(item)
        if p and p > 0:
            price_samples.append(p)
    price_samples.sort()
    median_price = price_samples[len(price_samples)//2] if price_samples else 29.99
    print(f"    Category median price: ${median_price:.2f} (from {len(price_samples)} samples)")

    # Second pass: actual seed
    products_b, p_images_b, p_attrs_b, d_attrs_b = [], [], [], []
    variants_b, v_images_b, v_d_attrs_b = [], [], []

    seen_parent = {}        # parent_asin → product_id (UUID)
    product_attrs_map = {}  # parent_asin → {attr_name_lower: {id, details: {val_lower: detail_id}}}
    seen_fingerprints = {}  # parent_asin → set of variant fingerprints
    product_count = 0
    skipped_no_img = 0
    skipped_no_title = 0
    fixed_prices = 0
    total_variants = 0
    skipped_dup_variants = 0

    for item in stream_jsonl(filepath):
        parent_asin = item.get("parent_asin") or ""
        asin = item.get("asin") or ""
        if not parent_asin:
            continue

        title = clean_text(item.get("title", ""), 200)
        if not title:
            if parent_asin not in seen_parent:
                skipped_no_title += 1
            continue

        prod_images = extract_images(item)
        if not prod_images and parent_asin not in seen_parent:
            skipped_no_img += 1
            continue

        is_new = parent_asin not in seen_parent
        if is_new:
            if product_count >= max_products:
                continue
            product_id = uid()
            seen_parent[parent_asin] = product_id
            seen_fingerprints[parent_asin] = set()

            price = extract_price(item)
            if not price or price <= 0:
                price = median_price
                fixed_prices += 1

            description = clean_text("\n".join(item.get("features") or []), 3000)
            brand = clean_text(item.get("store") or item.get("brand") or "Generic", 100)
            specs = clean_specs(item.get("details"))
            avg_rating = item.get("average_rating") or item.get("averageRating") or None
            rating_count = item.get("rating_number") or item.get("ratingNumber") or 0
            try:
                avg_rating = float(avg_rating) if avg_rating else None
                rating_count = int(rating_count) if rating_count else 0
            except Exception:
                avg_rating = None
                rating_count = 0

            shop_id = shop_ids[product_count % len(shop_ids)]
            created_offset = now_dt - timedelta(days=random.randint(0, 365))

            products_b.append((
                product_id, title, brand, description, specs,
                price, price, 0, avg_rating, rating_count,
                cat_id, shop_id, created_offset, created_offset
            ))

            for i, img_url in enumerate(prod_images[:5]):
                p_images_b.append((uid(), img_url, i == 0, product_id, created_offset, created_offset))

            product_count += 1

        product_id = seen_parent[parent_asin]
        if parent_asin not in product_attrs_map:
            product_attrs_map[parent_asin] = {}

        # Variant processing
        attrs_dict = extract_attrs(item)
        
        var_price_base = extract_price(item)
        if not var_price_base or var_price_base <= 0:
            var_price_base = median_price

        # The real variant + any controlled synthetic variants
        variants_to_create = [(attrs_dict, 0.0)]
        variants_to_create.extend(mock_variants_for_ui(attrs_dict, cat_name))

        for v_attrs, p_add in variants_to_create:
            if len(seen_fingerprints.get(parent_asin, set())) >= MAX_VARIANTS_PER_PRODUCT:
                break

            fp = variant_fingerprint(parent_asin, v_attrs, None)
            if fp in seen_fingerprints[parent_asin]:
                if p_add == 0.0:  # count only the real one as duplicate if skipped
                    skipped_dup_variants += 1
                continue
            seen_fingerprints[parent_asin].add(fp)

            var_price = var_price_base + p_add
            var_imgs = prod_images if prod_images else []
            var_image_url = var_imgs[0] if var_imgs else None

            variant_parts = []
            variant_attr_links = []

            for attr_name, attr_val in v_attrs.items():
                attr_lower = attr_name.lower()
                if attr_lower not in product_attrs_map[parent_asin]:
                    attr_id = uid()
                    product_attrs_map[parent_asin][attr_lower] = {"id": attr_id, "details": {}}
                    sort_idx = len(product_attrs_map[parent_asin])
                    p_attrs_b.append((attr_id, attr_name, "ACTIVE", product_id, sort_idx, now_dt, now_dt))

                attr_info = product_attrs_map[parent_asin][attr_lower]
                val_lower = attr_val.lower()
                if val_lower not in attr_info["details"]:
                    detail_id = uid()
                    attr_info["details"][val_lower] = detail_id
                    d_img = var_image_url if attr_lower == "color" else None
                    sort_idx2 = len(attr_info["details"])
                    d_attrs_b.append((detail_id, attr_val, d_img, "ACTIVE", attr_info["id"], sort_idx2))

                variant_attr_links.append((None, attr_info["details"][val_lower]))
                variant_parts.append(attr_val)

            var_name = " / ".join(variant_parts) if variant_parts else "Default"
            if len(var_name) > 200:
                var_name = var_name[:197] + "..."

            is_mock = p_add > 0.0 or v_attrs != attrs_dict
            var_id = asin if asin and len(asin) <= 36 and not is_mock else uid()
            stock = random.randint(10, 500)

            variants_b.append((
                var_id, var_name, var_id, var_price, stock, 0,
                "ACTIVE", var_image_url, product_id, now_dt, now_dt
            ))

            for i, img_url in enumerate(var_imgs[:3]):
                v_images_b.append((uid(), img_url, i == 0, var_id, now_dt, now_dt))

            for _, detail_id in variant_attr_links:
                v_d_attrs_b.append((var_id, detail_id))

            total_variants += 1

        # Batch flush
        if len(products_b) >= BATCH_SIZE or len(variants_b) >= BATCH_SIZE * 3:
            insert_batch(cursor, conn, products_b, p_images_b, p_attrs_b, d_attrs_b, variants_b, v_images_b, v_d_attrs_b)
            products_b.clear(); p_images_b.clear(); p_attrs_b.clear(); d_attrs_b.clear()
            variants_b.clear(); v_images_b.clear(); v_d_attrs_b.clear()
            print(f"    [{cat_name}] Products: {product_count} | Variants: {total_variants}")

    # Final flush
    insert_batch(cursor, conn, products_b, p_images_b, p_attrs_b, d_attrs_b, variants_b, v_images_b, v_d_attrs_b)

    print(f"  ✓ {cat_name}: {product_count} products, {total_variants} variants")
    print(f"    Skipped (no image): {skipped_no_img} | (no title): {skipped_no_title} | (dup variant): {skipped_dup_variants} | (fixed price): {fixed_prices}")
    return product_count


def update_product_prices(cursor, conn):
    """Recalculate min_price/max_price/total_sold from variants."""
    print("\n[POST] Recalculating product min/max prices from variants...")
    cursor.execute("""
        UPDATE products p
        JOIN (
            SELECT product_id,
                   MIN(price) as min_p,
                   MAX(price) as max_p,
                   COALESCE(SUM(sold_count), 0) as total_s
            FROM product_variants
            WHERE status = 'ACTIVE'
            GROUP BY product_id
        ) v ON p.id = v.product_id
        SET p.min_price = v.min_p,
            p.max_price = v.max_p,
            p.total_sold = v.total_s
    """)
    conn.commit()
    print("  Done.")


def verify(cursor):
    print("\n[VERIFY] Database counts:")
    for table in ["categories", "shops", "users", "products", "product_variants",
                  "product_images", "product_attributes", "detail_attributes",
                  "product_variant_images", "product_variant_detail_attributes"]:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"  {table:45s}: {count:>8,}")

    print("\n  Sample products:")
    try:
        cursor.execute("""
            SELECT p.name, p.brand, p.min_price, p.max_price, c.name as cat
            FROM products p JOIN categories c ON p.category_id = c.id
            ORDER BY RAND() LIMIT 5
        """)
        for row in cursor.fetchall():
            name = str(row[0])[:60] if row[0] else ''
            print(f"    [{row[4]}] {name} | Brand: {row[1]} | ${row[2]:.2f}-${row[3]:.2f}")
    except Exception as e:
        print(f"  [WARN] Sample query failed: {e}")


# ─────────────────────────────────────────────
#  ENTRY POINT
# ─────────────────────────────────────────────

def main():
    print("=" * 60)
    print(" Amazon Product Seeder v2")
    print("=" * 60)

    conn = get_conn()
    cursor = conn.cursor()

    try:
        drop_and_reset(cursor, conn)
        cat_map = seed_categories(cursor, conn)
        seed_admin(cursor, conn)
        shop_ids = seed_shops(cursor, conn)
    except Exception as e:
        print(f"\n[ERROR] Setup failed: {e}")
        conn.rollback()
        cursor.close(); conn.close()
        return

    total_products = 0
    for cat_name, filename, limit in CATEGORY_FILES:
        cat_id = cat_map.get(cat_name)
        if not cat_id:
            print(f"  [WARN] No category ID for: {cat_name}")
            continue
        try:
            n = process_category(cat_name, filename, cat_id, shop_ids, cursor, conn, limit)
            total_products += n
        except Exception as e:
            print(f"\n  [ERROR] Category {cat_name}: {e}")
            import traceback; traceback.print_exc()
            conn.rollback()

    update_product_prices(cursor, conn)
    verify(cursor)

    cursor.close()
    conn.close()
    print(f"\n{'='*60}")
    print(f" DONE — Total products seeded: {total_products:,}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
