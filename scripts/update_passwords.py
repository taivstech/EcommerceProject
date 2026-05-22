import mysql.connector

# You may need to run `pip install bcrypt` if not already installed
import bcrypt

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
}

def update_all_passwords():
    print("Connecting to database to update passwords...")
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Generate hash for "Password1"
        password = b"Password1"
        hashed = bcrypt.hashpw(password, bcrypt.gensalt())
        hashed_str = hashed.decode('utf-8')
        
        cursor.execute("UPDATE users SET password = %s", (hashed_str,))
        affected = cursor.rowcount
        
        conn.commit()
        print(f"Successfully updated passwords for {affected} users to 'Password1'.")
        
    except Exception as e:
        print(f"Error: {e}")
        if 'conn' in locals() and conn.is_connected():
            conn.rollback()
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals() and conn.is_connected():
            conn.close()

if __name__ == "__main__":
    update_all_passwords()
