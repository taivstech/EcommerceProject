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

BCRYPT_DUMMY = "$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y"

def uid(): return str(uuid.uuid4())

def seed_admin():
    print("Seeding admin account...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    now_dt = datetime.now()
    
    admin_id = uid()
    role_id = uid()
    
    try:
        # 1. Ensure ADMIN role exists
        cursor.execute("SELECT id FROM roles WHERE name = 'ADMIN'")
        res = cursor.fetchone()
        if res:
            role_id = res[0]
        else:
            cursor.execute("INSERT INTO roles (id, name, description, created_at, updated_at, version) VALUES (%s, %s, %s, %s, %s, 0)",
                           (role_id, 'ADMIN', 'Administrator role', now_dt, now_dt))
        
        # 2. Create admin user
        cursor.execute("SELECT id FROM users WHERE email = 'admin@gocart.com'")
        res = cursor.fetchone()
        if res:
            admin_id = res[0]
            cursor.execute("UPDATE users SET password = %s WHERE id = %s", (BCRYPT_DUMMY, admin_id))
        else:
            cursor.execute("""
                INSERT INTO users (id, email, username, password, full_name, active, email_verified, created_at, updated_at, version)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,0)
            """, (admin_id, 'admin@gocart.com', 'admin', BCRYPT_DUMMY, "System Admin", True, True, now_dt, now_dt))
        
        # 3. Link user to role
        cursor.execute("SELECT * FROM user_roles WHERE user_id = %s AND role_id = %s", (admin_id, role_id))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO user_roles (user_id, role_id, assigned_at, created_at, updated_at, version) VALUES (%s, %s, %s, %s, %s, 0)",
                           (admin_id, role_id, now_dt, now_dt, now_dt))
        
        conn.commit()
        print(f"Success! Admin account created:")
        print(f"Email: admin@gocart.com")
        print(f"Password: password")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    seed_admin()
