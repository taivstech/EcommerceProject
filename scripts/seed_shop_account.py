import mysql.connector
import uuid
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

def seed_shop_account():
    print("Seeding new shop account...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    now_dt = datetime.now()
    
    user_id = uid()
    shop_id = uid()
    warehouse_id = uid()
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
        
        # 2. Create seller user
        email = 'seller2@gocart.com'
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        res = cursor.fetchone()
        if res:
            user_id = res[0]
            print(f"User with email '{email}' already exists. Updating password...")
            cursor.execute("UPDATE users SET password = %s WHERE id = %s", (BCRYPT_DUMMY, user_id))
        else:
            cursor.execute("""
                INSERT INTO users (id, email, username, password, full_name, active, email_verified, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (user_id, email, 'seller2', BCRYPT_DUMMY, "GoCart Seller Two", True, True, now_dt, now_dt))
            print(f"Created user with email '{email}'")
        
        # 3. Link user to SELLER role
        cursor.execute("SELECT * FROM user_roles WHERE user_id = %s AND role_id = %s", (user_id, role_id))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO user_roles (user_id, role_id, assigned_at, created_at, updated_at) VALUES (%s, %s, %s, %s, %s)",
                           (user_id, role_id, now_dt, now_dt, now_dt))
            print("Assigned SELLER role to user")
        
        # 4. Create shop
        cursor.execute("SELECT id FROM shops WHERE user_id = %s", (user_id,))
        res = cursor.fetchone()
        if res:
            shop_id = res[0]
            print(f"Shop for user already exists. Updating...")
            cursor.execute("""
                UPDATE shops 
                SET name = 'MegaMart Shop', status = 'APPROVED',
                    shop_address_phone_number = '0987654321',
                    shop_address_full = 'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội',
                    shop_address_detail = 'Số 1 Đại Cồ Việt',
                    shop_address_ward = 'Bách Khoa',
                    shop_address_ward_code = '20103',
                    shop_address_district = 'Hai Bà Trưng',
                    shop_address_district_id = 1482,
                    shop_address_province = 'Hà Nội',
                    shop_address_province_id = '201'
                WHERE id = %s
            """, (shop_id,))
        else:
            cursor.execute("""
                INSERT INTO shops (
                    id, user_id, name, status, approved_at, created_at, updated_at,
                    shop_address_phone_number, shop_address_full, shop_address_detail,
                    shop_address_ward, shop_address_ward_code, shop_address_district,
                    shop_address_district_id, shop_address_province, shop_address_province_id
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                shop_id, user_id, 'MegaMart Shop', 'APPROVED', now_dt, now_dt, now_dt,
                '0987654321', 'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội', 'Số 1 Đại Cồ Việt',
                'Bách Khoa', '20103', 'Hai Bà Trưng', 1482, 'Hà Nội', '201'
            ))
            print("Created MegaMart Shop")

        # 5. Create default warehouse
        cursor.execute("SELECT id FROM warehouses WHERE shop_id = %s AND is_default = 1", (shop_id,))
        res = cursor.fetchone()
        if res:
            warehouse_id = res[0]
            print("Default warehouse already exists. Updating...")
            cursor.execute("""
                UPDATE warehouses 
                SET name = 'MegaMart - Kho chính', contact_name = 'GoCart Seller Two',
                    contact_phone = '0987654321', full_address = 'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội',
                    detail_address = 'Số 1 Đại Cồ Việt', ward = 'Bách Khoa', ward_code = '20103',
                    district = 'Hai Bà Trưng', district_id = 1482, province = 'Hà Nội', province_id = '201',
                    status = 'ACTIVE'
                WHERE id = %s
            """, (warehouse_id,))
        else:
            cursor.execute("""
                INSERT INTO warehouses (
                    id, name, contact_name, contact_phone, full_address, detail_address,
                    ward, ward_code, district, district_id, province, province_id,
                    is_default, status, shop_id, created_at, updated_at
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                warehouse_id, 'MegaMart - Kho chính', 'GoCart Seller Two', '0987654321',
                'Số 1 Đại Cồ Việt, Bách Khoa, Hai Bà Trưng, Hà Nội', 'Số 1 Đại Cồ Việt',
                'Bách Khoa', '20103', 'Hai Bà Trưng', 1482, 'Hà Nội', '201',
                True, 'ACTIVE', shop_id, now_dt, now_dt
            ))
            print("Created default warehouse in Hanoi")
        
        conn.commit()
        print("Success! Shop account seeded:")
        print("Email: seller2@gocart.com")
        print("Password: password")
        print("Shop Name: MegaMart Shop")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_shop_account()
