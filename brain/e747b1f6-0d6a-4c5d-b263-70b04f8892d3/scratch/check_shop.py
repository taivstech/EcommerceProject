import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
}

def check():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT u.id, u.email, u.username, u.password, r.name as role_name 
        FROM users u 
        LEFT JOIN user_roles ur ON u.id = ur.user_id 
        LEFT JOIN roles r ON ur.role_id = r.id 
        WHERE r.name = 'ADMIN'
    """)
    rows = cursor.fetchall()
    print("Admin users:")
    for r in rows:
        print(r)
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check()
