import requests
import json

base_url = 'http://localhost:8088/api'

def test_api():
    # 1. Login to get token
    login_url = f"{base_url}/auth/token"
    # We can use admin or any seed user credentials. Let's find one.
    # Typically seed data has admin or a standard user like "user" or "buyer".
    # Let's try "buyer" or we can check the database first to find a valid username/password.
    # Let's write the query first to get a valid user.
    import mysql.connector
    conn = mysql.connector.connect(host='localhost', user='root', password='taiteasicale', database='ecommerce_db')
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT username, email, phone FROM users LIMIT 5")
    users = cursor.fetchall()
    print("Users in DB:", users)
    
    # We can try to authenticate with one of the users. But wait, we don't know their passwords because they are hashed.
    # Wait, scripts/seed_seller_orders.py or other seed scripts might have standard passwords.
    # Let's search for password in scripts.
    cursor.close()
    conn.close()

test_api()
