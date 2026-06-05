import requests
import json

base_url = 'http://localhost:8088/api'

def test_flow():
    # 1. Login
    login_payload = {
        "email_or_phone": "admin@gocart.com",
        "password": "Password1"
    }
    response = requests.post(f"{base_url}/auth/token", json=login_payload)
    if response.status_code != 200:
        login_payload["password"] = "password"
        response = requests.post(f"{base_url}/auth/token", json=login_payload)
        
    if response.status_code != 200:
        print("Login failed")
        return
        
    token = response.json()['result']['access_token']
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    print("1. Logged in successfully.")

    # 2. Add item to cart
    cart_payload = {
        "product_variant_id": "422f401e-7f21-44bd-afd5-771841114861",
        "quantity": 1
    }
    r = requests.post(f"{base_url}/cart/items", json=cart_payload, headers=headers)
    print("2. Add to cart status:", r.status_code, r.text)

    # 3. Create address
    address_payload = {
        "receiver_name": "Test Receiver",
        "phone_number": "0123456789",
        "full_address": "Test Ward, Test District, Test Province",
        "detail_address": "123 Test Street",
        "ward": "Test Ward",
        "ward_code": "123",
        "district": "Test District",
        "district_id": 456,
        "province": "Test Province",
        "province_id": "789",
        "default_address": True
    }
    r = requests.post(f"{base_url}/users/me/addresses", json=address_payload, headers=headers)
    print("3. Create address status:", r.status_code, r.text)

    # 4. Checkout
    checkout_payload = {
        "receiver_name": "Test Receiver",
        "phone_number": "0123456789",
        "full_address": "Test Ward, Test District, Test Province",
        "detail_address": "123 Test Street",
        "ward": "Test Ward",
        "ward_code": "123",
        "district": "Test District",
        "district_id": 456,
        "province": "Test Province",
        "province_id": "789",
        "payment": "COD"
    }
    r = requests.post(f"{base_url}/orders/checkout", json=checkout_payload, headers=headers)
    print("4. Checkout status:", r.status_code, r.text)

if __name__ == "__main__":
    test_flow()
