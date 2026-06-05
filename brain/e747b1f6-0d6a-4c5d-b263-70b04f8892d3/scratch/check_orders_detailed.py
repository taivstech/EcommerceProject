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
    
    cursor.execute("SELECT COUNT(*) FROM orders")
    print(f"Total orders in DB: {cursor.fetchone()}")
    
    cursor.execute("SELECT DISTINCT status FROM orders")
    print(f"Statuses of orders: {cursor.fetchall()}")
    
    cursor.execute("SELECT COUNT(*) FROM order_shop_groups")
    print(f"Total order_shop_groups in DB: {cursor.fetchone()}")
    
    cursor.execute("SELECT COUNT(*) FROM order_items")
    print(f"Total order_items in DB: {cursor.fetchone()}")
    
    # Check if there are any orders with status COMPLETED or DELIVERED
    cursor.execute("SELECT COUNT(*) FROM orders WHERE status IN ('DELIVERED', 'COMPLETED')")
    print(f"Total DELIVERED/COMPLETED orders: {cursor.fetchone()}")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check()
