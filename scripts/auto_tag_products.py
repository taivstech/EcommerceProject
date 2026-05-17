"""
auto_tag_products.py
─────────────────────────────────────────────────────────────────────────────
Script to auto-tag existing products in the database based on their category.

This is a one-time backfill script. After running it, trigger a full reindex:
  POST http://localhost:8088/search/reindex

Usage:
  pip install mysql-connector-python
  python auto_tag_products.py

Configure DB_CONFIG below to match your .env / application.properties.
─────────────────────────────────────────────────────────────────────────────
"""

import mysql.connector
import re
import time
from typing import List, Dict

# ── Config ────────────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",             # match SPRING_DATASOURCE_USERNAME
    "password": "taiteasicale", # match SPRING_DATASOURCE_PASSWORD
    "database": "ecommerce_db",  # match DB_NAME in SPRING_DATASOURCE_URL
}

DRY_RUN = False          # Set True to preview without writing to DB
BATCH_SIZE = 200         # Products per batch
MAX_TAGS_PER_PRODUCT = 15
# ─────────────────────────────────────────────────────────────────────────────

# Same mapping as CategoryTagMapping.java (Vietnamese category name → tags)
CATEGORY_TAGS: Dict[str, List[str]] = {
    "thời trang nam": [
        "áo phông nam", "áo thun nam", "áo polo nam", "áo sơ mi nam",
        "áo khoác nam", "áo hoodie nam", "áo len nam",
        "quần jean nam", "quần short nam", "quần tây nam",
        "đồ nam", "thời trang nam", "quần áo nam"
    ],
    "thời trang nữ": [
        "áo phông nữ", "áo thun nữ", "đầm nữ", "váy nữ",
        "áo khoác nữ", "áo len nữ", "chân váy nữ",
        "quần legging nữ", "đồ bộ nữ", "áo dài nữ",
        "thời trang nữ", "quần áo nữ"
    ],
    "áo phông": [
        "áo phông", "áo thun", "áo cotton", "t-shirt", "tee",
        "áo thun cổ tròn", "áo thun oversize", "áo phông trắng",
        "áo phông nam", "áo phông nữ"
    ],
    "quần áo": ["quần áo", "thời trang", "đồ mặc"],
    "giày": [
        "giày thể thao", "giày sneaker", "giày tây", "giày nam",
        "giày nữ", "giày boot", "giày da", "giày chạy bộ"
    ],
    "dép": ["dép nam", "dép nữ", "dép sandal", "dép thể thao", "dép lê"],
    "sneaker": ["sneaker", "giày thể thao", "giày bóng rổ", "giày chạy bộ"],
    "điện thoại": [
        "điện thoại", "smartphone", "điện thoại thông minh",
        "ốp lưng", "kính cường lực", "sạc điện thoại"
    ],
    "tai nghe": [
        "tai nghe", "tai nghe bluetooth", "tai nghe không dây",
        "tai nghe chụp tai", "tai nghe nhét tai", "airpod"
    ],
    "laptop": [
        "laptop", "máy tính xách tay", "notebook", "laptop văn phòng",
        "laptop gaming", "laptop sinh viên"
    ],
    "phụ kiện điện tử": [
        "phụ kiện điện tử", "cáp sạc", "sạc dự phòng", "chuột máy tính",
        "bàn phím", "ổ cứng", "usb"
    ],
    "màn hình": ["màn hình máy tính", "màn hình gaming", "monitor"],
    "mỹ phẩm": [
        "mỹ phẩm", "son môi", "kem nền", "phấn phủ",
        "mascara", "trang điểm", "make up", "serum"
    ],
    "skincare": [
        "skincare", "chăm sóc da", "kem dưỡng ẩm", "kem chống nắng",
        "sữa rửa mặt", "nước tẩy trang", "toner", "serum vitamin c",
        "mặt nạ dưỡng da"
    ],
    "nước hoa": ["nước hoa", "nước hoa nữ", "nước hoa nam", "perfume"],
    "gia dụng": [
        "gia dụng", "thiết bị nhà bếp", "nồi cơm điện", "máy xay sinh tố",
        "bếp từ", "lò vi sóng"
    ],
    "nội thất": [
        "nội thất", "bàn ghế", "kệ sách", "đèn ngủ", "gương treo tường",
        "thảm trải sàn"
    ],
    "chăn ga gối": ["chăn ga gối", "chăn bông", "gối ngủ", "bộ ga trải giường"],
    "thể thao": [
        "thể thao", "dụng cụ tập gym", "quần áo thể thao",
        "bình nước thể thao", "vợt cầu lông", "găng tay boxing",
        "dây nhảy", "yoga"
    ],
    "túi xách": [
        "túi xách nữ", "túi xách nam", "túi đeo chéo", "clutch",
        "túi tote", "túi xách da"
    ],
    "balo": ["balo nam", "balo nữ", "balo laptop", "balo du lịch", "balo học sinh"],
    "phụ kiện": [
        "phụ kiện thời trang", "đồng hồ nam", "đồng hồ nữ",
        "vòng tay", "dây chuyền", "nhẫn", "khuyên tai",
        "mũ lưỡi trai", "mũ bucket", "kính mát", "thắt lưng"
    ],
    "đồng hồ": [
        "đồng hồ nam", "đồng hồ nữ", "đồng hồ thể thao",
        "smartwatch", "đồng hồ thông minh"
    ],
    "ví": ["ví da nam", "ví da nữ", "ví tiền", "ví dài", "ví ngắn"],
    "sách": [
        "sách", "sách văn học", "sách kinh doanh", "sách self-help",
        "sách thiếu nhi", "truyện tranh"
    ],
    "đồ chơi": [
        "đồ chơi trẻ em", "đồ chơi giáo dục", "lego", "mô hình",
        "thú nhồi bông", "đồ chơi xếp hình"
    ],
}

# Additional English keyword → tags mapping (for Amazon-seeded English products)
ENGLISH_CATEGORY_TAGS: Dict[str, List[str]] = {
    "clothing": ["quần áo", "thời trang", "đồ mặc"],
    "men": ["đồ nam", "thời trang nam"],
    "women": ["đồ nữ", "thời trang nữ"],
    "shirt": ["áo phông", "áo thun", "áo sơ mi"],
    "t-shirt": ["áo phông", "áo thun", "áo cotton"],
    "shoes": ["giày dép", "giày thể thao"],
    "sneakers": ["sneaker", "giày thể thao"],
    "electronics": ["điện tử", "thiết bị điện tử"],
    "headphones": ["tai nghe", "tai nghe bluetooth", "tai nghe không dây"],
    "earphones": ["tai nghe", "tai nghe nhét tai"],
    "laptop": ["laptop", "máy tính xách tay"],
    "beauty": ["mỹ phẩm", "làm đẹp"],
    "skincare": ["skincare", "chăm sóc da"],
    "bag": ["túi xách", "túi đeo"],
    "backpack": ["balo", "balo du lịch"],
    "watch": ["đồng hồ", "đồng hồ thông minh"],
    "home": ["gia dụng", "nội thất"],
    "kitchen": ["thiết bị nhà bếp", "gia dụng bếp"],
    "sports": ["thể thao", "dụng cụ thể thao"],
    "toys": ["đồ chơi trẻ em", "đồ chơi"],
    "books": ["sách", "sách giáo khoa"],
    "furniture": ["nội thất", "đồ nội thất"],
}


def get_tags_for_category(category_name: str) -> List[str]:
    """Return tags for a given category name (Vietnamese or English)."""
    if not category_name:
        return []

    lower = category_name.lower().strip()
    matched = set()

    # Vietnamese mapping (contains)
    for key, tags in CATEGORY_TAGS.items():
        if key in lower or lower in key:
            matched.update(tags)

    # English mapping (word match)
    words = re.findall(r'\w+', lower)
    for word in words:
        if word in ENGLISH_CATEGORY_TAGS:
            matched.update(ENGLISH_CATEGORY_TAGS[word])

    return list(matched)[:MAX_TAGS_PER_PRODUCT]


def run():
    print(f"{'[DRY RUN] ' if DRY_RUN else ''}Connecting to MySQL...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    # Fetch all categories
    cursor.execute("SELECT id, name FROM categories")
    categories = {row["id"]: row["name"] for row in cursor.fetchall()}
    print(f"Found {len(categories)} categories")

    # Build category_id → tags mapping
    category_tag_map: Dict[str, List[str]] = {}
    for cat_id, cat_name in categories.items():
        tags = get_tags_for_category(cat_name)
        if tags:
            category_tag_map[cat_id] = tags
            print(f"  {cat_name}: {tags[:3]}...")

    # Count products
    cursor.execute("SELECT COUNT(id) AS cnt FROM products WHERE deleted_at IS NULL")
    total = cursor.fetchone()["cnt"]
    print(f"\nTotal products to tag: {total}")

    offset = 0
    tagged_count = 0
    skipped_count = 0
    start = time.time()

    while offset < total:
        cursor.execute(
            "SELECT id, category_id FROM products WHERE deleted_at IS NULL LIMIT %s OFFSET %s",
            (BATCH_SIZE, offset)
        )
        batch = cursor.fetchall()
        if not batch:
            break

        for product in batch:
            product_id = product["id"]
            cat_id = product["category_id"]
            tags = category_tag_map.get(cat_id, [])

            if not tags:
                skipped_count += 1
                continue

            if not DRY_RUN:
                # Clear existing tags for this product
                cursor.execute(
                    "DELETE FROM product_tags WHERE product_id = %s",
                    (product_id,)
                )
                # Insert new tags
                insert_data = [(product_id, tag) for tag in tags]
                cursor.executemany(
                    "INSERT INTO product_tags (product_id, tag) VALUES (%s, %s)",
                    insert_data
                )

            tagged_count += 1

        if not DRY_RUN:
            conn.commit()

        offset += BATCH_SIZE
        elapsed = time.time() - start
        rate = tagged_count / elapsed if elapsed > 0 else 0
        print(f"  Progress: {offset}/{total} | Tagged: {tagged_count} | Skipped: {skipped_count} | {rate:.0f} products/sec")

    cursor.close()
    conn.close()

    print(f"\n{'[DRY RUN] ' if DRY_RUN else ''}Done!")
    print(f"  Tagged:  {tagged_count} products")
    print(f"  Skipped: {skipped_count} products (no category match)")
    print()
    if not DRY_RUN:
        print("Next step: trigger a full Elasticsearch reindex:")
        print("  POST http://localhost:8088/search/reindex")
    else:
        print("Set DRY_RUN = False and re-run to actually write to DB.")


if __name__ == "__main__":
    run()
