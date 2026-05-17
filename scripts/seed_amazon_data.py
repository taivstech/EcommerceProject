import mysql.connector
import json
import uuid
from datetime import datetime
import re
import hashlib
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306
}

JSONL_PATH = "../meta_Electronics.jsonl"
MAX_PRODUCTS = 20000
BATCH_SIZE = 1000

def stream_jsonl(path):
    """Đọc file JSONL khổng lồ mà không sợ tốn RAM"""
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            yield json.loads(line)

def get_or_create_dependencies(cursor):
    user_id = str(uuid.uuid4())
    shop_id = str(uuid.uuid4())
    category_id = str(uuid.uuid4())
    now = datetime.now()

    # 1. Tự tạo một User ảo (người bán hàng Amazon)
    cursor.execute("SELECT id FROM users WHERE email = 'amazon_seed@gocart.com' LIMIT 1")
    row = cursor.fetchone()
    if row:
        user_id = row[0]
    else:
        cursor.execute("""
            INSERT INTO users (id, email, username, password, full_name, active, email_verified, created_at, updated_at) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, "amazon_seed@gocart.com", "amazon_seed", "$2a$10$dummy_password", "Amazon Official", True, True, now, now))

    # 2. Tạo Shop ảo và link tới User vừa tạo
    cursor.execute("SELECT id FROM shops WHERE user_id = %s LIMIT 1", (user_id,))
    row = cursor.fetchone()
    if row:
        shop_id = row[0]
    else:
        cursor.execute("""
            INSERT INTO shops (id, user_id, name, status, created_at, updated_at) 
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (shop_id, user_id, "Amazon Official Store", "APPROVED", now, now))

    # 3. Tạo Category Electronics
    cursor.execute("SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1")
    row = cursor.fetchone()
    if row:
        category_id = row[0]
    else:
        cursor.execute("""
            INSERT INTO categories (id, name, status, created_at, updated_at) 
            VALUES (%s, %s, %s, %s, %s)
        """, (category_id, "Electronics", "ACTIVE", now, now))
    
    return shop_id, category_id

def insert_data(cursor, conn, products, variants, p_attrs, d_attrs, v_d_attrs):
    """Hàm chạy câu lệnh Batch Insert siêu tốc, bao gồm cả Attributes"""
    sql_product = """
        INSERT INTO products (
            id, name, brand, description, specifications, min_price, max_price, total_sold, category_id, shop_id, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            min_price = VALUES(min_price),
            max_price = VALUES(max_price)
    """
    
    sql_variant = """
        INSERT INTO product_variants (
            id, name, sku, price, stock, sold_count, status, image_url, product_id, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            price = VALUES(price),
            name = VALUES(name)
    """
    
    sql_p_attr = """
        INSERT INTO product_attributes (id, name, status, product_id, sort_order) 
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE name=VALUES(name)
    """
    
    sql_d_attr = """
        INSERT INTO detail_attributes (id, name, image_url, status, product_attribute_id, sort_order)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE name=VALUES(name)
    """
    
    sql_v_d_attr = """
        INSERT IGNORE INTO product_variant_detail_attributes (product_variant_id, detail_attribute_id)
        VALUES (%s, %s)
    """

    if products: cursor.executemany(sql_product, products)
    if variants: cursor.executemany(sql_variant, variants)
    if p_attrs: cursor.executemany(sql_p_attr, p_attrs)
    if d_attrs: cursor.executemany(sql_d_attr, d_attrs)
    if v_d_attrs: cursor.executemany(sql_v_d_attr, v_d_attrs)
    conn.commit()

def main():
    print("Dang ket noi toi Database...")
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
    except Exception as e:
        print(f"Loi ket noi MySQL. Vui long kiem tra user/password/port. Chi tiet: {e}")
        return

    print("Ket noi MySQL thanh cong!")
    shop_id, category_id = get_or_create_dependencies(cursor)
    conn.commit()
    print(f"Dung Shop ID: {shop_id[:8]}... | Category ID: {category_id[:8]}...")

    print(f"\nDang doc dataset tu: {JSONL_PATH}")
    
    product_batch = []
    variant_batch = []
    p_attr_batch = []
    d_attr_batch = []
    v_d_attr_batch = []
    
    seen_products = set() # CHỐNG DUPLICATE QUAN TRỌNG
    
    # Quản lý Attributes để không bị trùng
    # Map: parent_asin -> { attr_name_lower: { 'id': attr_id, 'details': { detail_name_lower: detail_id } } }
    product_attrs_map = {}
    
    # Biến để đánh số thứ tự tránh trùng tên variant nếu cùng thông số
    variant_name_counts = {}

    count = 0
    now = datetime.now()

    try:
        ds = stream_jsonl(JSONL_PATH)
    except FileNotFoundError:
        print(f"Khong tim thay file {JSONL_PATH}. Vui long kiem tra lai!")
        return

    print(f"Bat dau qua trinh Import (Gioi han: {MAX_PRODUCTS} products, doc toi da 200000 dong)...\n")

    lines_read = 0
    for item in ds:
        lines_read += 1
        if lines_read > 200000:
            break
            
        parent_asin = item.get("parent_asin")
        if not parent_asin: continue
        
        is_new_product = parent_asin not in seen_products
        
        if is_new_product:
            if len(seen_products) >= MAX_PRODUCTS:
                continue # Bỏ qua product mới, nhưng CỨ tiếp tục đọc để tìm thêm variants cho các product cũ
            seen_products.add(parent_asin)

        title = item.get("title")
        if not title or len(title) > 200:
            title = str(title)[:197] + "..."

        price_raw = str(item.get("price", ""))
        price_clean = re.sub(r'[^\d.]', '', price_raw)
        try:
            price = float(price_clean) if price_clean else 0.0
        except:
            price = 0.0
            
        if price == 0.0:
            h = int(hashlib.md5(parent_asin.encode()).hexdigest(), 16)
            price = 10.0 + (h % 190) + 0.99

        description = "\n".join(item.get("features", [])) if item.get("features") else ""
        brand = item.get("store") or "Generic"
        if len(brand) > 100: brand = brand[:97] + "..."
        specifications = "{}"

        images = item.get("images", [])
        image_url = ""
        if images and isinstance(images, list) and len(images) > 0:
            image_url = images[0].get("hi_res") or images[0].get("large") or ""
        if len(image_url) > 500: image_url = image_url[:497] + "..."

        # 1. PRODUCT
        if is_new_product:
            product_batch.append((
                parent_asin, title, brand, description, specifications, 
                price, price, 0, category_id, shop_id, now, now
            ))
            count += 1

        # 2. PRODUCT VARIANT
        variant_id = item.get("asin")
        if not variant_id:
            variant_id = f"var_{parent_asin}_{uuid.uuid4().hex[:8]}"
            
        # Trích xuất Attributes (Color, Size, v.v.)
        details = item.get("details", {})
        valid_attr_keys = ['color', 'size', 'style', 'capacity', 'pattern', 'memory', 'storage', 'material']
        
        variant_parts = []
        variant_attributes_links = []
        
        if details:
            for k, v in details.items():
                k_str = str(k).strip()
                v_str = str(v).strip()
                k_lower = k_str.lower()
                if k_lower in valid_attr_keys and v_str:
                    variant_parts.append(v_str)
                    
                    # Khởi tạo map cho product này
                    if parent_asin not in product_attrs_map:
                        product_attrs_map[parent_asin] = {}
                    
                    # Lấy hoặc tạo ProductAttribute
                    if k_lower not in product_attrs_map[parent_asin]:
                        attr_id = str(uuid.uuid4())
                        product_attrs_map[parent_asin][k_lower] = {'id': attr_id, 'details': {}}
                        p_attr_batch.append((attr_id, k_str.capitalize(), "ACTIVE", parent_asin, len(product_attrs_map[parent_asin])))
                    
                    attr_dict = product_attrs_map[parent_asin][k_lower]
                    
                    # Lấy hoặc tạo DetailAttribute
                    v_lower = v_str.lower()
                    if v_lower not in attr_dict['details']:
                        detail_id = str(uuid.uuid4())
                        attr_dict['details'][v_lower] = detail_id
                        # Nếu là color, thử lấy image_url của variant làm ảnh đại diện cho option đó
                        d_img = image_url if k_lower == 'color' else None
                        d_attr_batch.append((detail_id, v_str, d_img, "ACTIVE", attr_dict['id'], len(attr_dict['details'])))
                        
                    detail_id = attr_dict['details'][v_lower]
                    variant_attributes_links.append((variant_id, detail_id))

        variant_name = "Default"
        if variant_parts:
            variant_name = " - ".join(variant_parts)
            if len(variant_name) > 100: variant_name = variant_name[:97] + "..."
            
        # Tránh trùng tên variant trong cùng 1 product
        vn_key = f"{parent_asin}_{variant_name}"
        if vn_key in variant_name_counts:
            variant_name_counts[vn_key] += 1
            variant_name = f"{variant_name} ({variant_name_counts[vn_key]})"
        else:
            variant_name_counts[vn_key] = 1

        variant_batch.append((
            variant_id, variant_name, variant_id, price, 100, 0, "ACTIVE", 
            image_url, parent_asin, now, now
        ))
        
        for link in variant_attributes_links:
            v_d_attr_batch.append(link)

        # Batch Insert trigger
        if len(product_batch) >= BATCH_SIZE or len(variant_batch) >= BATCH_SIZE * 5:
            insert_data(cursor, conn, product_batch, variant_batch, p_attr_batch, d_attr_batch, v_d_attr_batch)
            product_batch.clear()
            variant_batch.clear()
            p_attr_batch.clear()
            d_attr_batch.clear()
            v_d_attr_batch.clear()
            print(f"   Da insert {count} san pham (va cac variants)...")

    # Insert phần dư còn lại
    if len(product_batch) > 0 or len(variant_batch) > 0:
        insert_data(cursor, conn, product_batch, variant_batch, p_attr_batch, d_attr_batch, v_d_attr_batch)

    cursor.close()
    conn.close()
    print("\nHOAN THANH! Da import xong", count, "san pham.")

if __name__ == "__main__":
    main()
