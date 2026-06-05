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
    cursor.execute("SELECT product_id FROM product_variants WHERE id = '422f401e-7f21-44bd-afd5-771841114861'")
    r = cursor.fetchone()
    print("Product ID:", r)
    cursor.close()
    conn.close()

check()
