import requests
import json

base_url = 'http://localhost:8088/api'

def test_api():
    login_url = f"{base_url}/auth/token"
    login_payload = {
        "email_or_phone": "admin@gocart.com",
        "password": "Password1"
    }
    
    response = requests.post(login_url, json=login_payload)
    if response.status_code != 200:
        login_payload["password"] = "password"
        response = requests.post(login_url, json=login_payload)
        
    if response.status_code != 200:
        print("Login failed:", response.status_code, response.text)
        return
        
    token = response.json()['result']['access_token']
    print("Logged in successfully.")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    checkout_url = f"{base_url}/orders/checkout"
    
    # 1. camelCase checkout payload
    payload_camel = {
        "receiverName": "John Doe",
        "phoneNumber": "0987654321",
        "fullAddress": "123 Main St, Hanoi",
        "payment": "COD"
    }
    
    # 2. snake_case checkout payload
    payload_snake = {
        "receiver_name": "John Doe",
        "phone_number": "0987654321",
        "full_address": "123 Main St, Hanoi",
        "payment": "COD"
    }
    
    print("\nTesting checkout with camelCase:")
    r = requests.post(checkout_url, json=payload_camel, headers=headers)
    print("Status:", r.status_code)
    print("Response:", r.text)
    
    print("\nTesting checkout with snake_case:")
    r = requests.post(checkout_url, json=payload_snake, headers=headers)
    print("Status:", r.status_code)
    print("Response:", r.text)

if __name__ == "__main__":
    test_api()
