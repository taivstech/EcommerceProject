import mysql.connector
import uuid
import random
from datetime import datetime

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
}

BCRYPT_DUMMY = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y" # hashes to "password"

def uid(): return str(uuid.uuid4())

def seed_pending_shops(count=15):
    print(f"Seeding {count} pending shop accounts...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    now_dt = datetime.now()
    
    role_id = uid()
    
    try:
        # 1. Ensure SELLER role exists
        cursor.execute("SELECT id FROM roles WHERE name = 'SELLER'")
        res = cursor.fetchone()
        if res:
            role_id = res[0]
        else:
            cursor.execute("INSERT INTO roles (id, name, description, created_at, updated_at) VALUES (%s, %s, %s, %s, %s)",
                           (role_id, 'SELLER', 'Seller role', now_dt, now_dt))
        
        for i in range(1, count + 1):
            user_id = uid()
            shop_id = uid()
            
            username = f'pending_seller_{i}_{random.randint(100, 999)}'
            email = f'{username}@gocart.com'
            full_name = f'Pending Seller {i}'
            shop_name = f'Pending Shop {i}'
            phone = f'090{random.randint(1000000, 9999999)}'
            
            # 2. Create user
            cursor.execute("""
                INSERT INTO users (id, email, username, password, full_name, active, email_verified, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (user_id, email, username, BCRYPT_DUMMY, full_name, True, True, now_dt, now_dt))
            
            # 3. Link user to SELLER role
            cursor.execute("INSERT INTO user_roles (user_id, role_id, assigned_at, created_at, updated_at) VALUES (%s, %s, %s, %s, %s)",
                           (user_id, role_id, now_dt, now_dt, now_dt))
            
            # 4. Create pending shop
            cursor.execute("""
                INSERT INTO shops (
                    id, user_id, name, status, created_at, updated_at,
                    shop_address_phone_number, shop_address_full, shop_address_detail,
                    shop_address_ward, shop_address_ward_code, shop_address_district,
                    shop_address_district_id, shop_address_province, shop_address_province_id
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                shop_id, user_id, shop_name, 'PENDING', now_dt, now_dt,
                phone, 'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội', 'Số 1 Đại Cồ Việt',
                'Bách Khoa', '20103', 'Hai Bà Trưng', 1482, 'Hà Nội', '201'
            ))
            
            if i % 5 == 0:
                print(f"  Created {i}/{count} shops...")

        conn.commit()
        print(f"Success! {count} pending shops have been seeded.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_pending_shops(15)
