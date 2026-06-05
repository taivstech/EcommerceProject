import requests
import json

base_url = 'http://localhost:8088/api'

def test_api():
    # 1. Login to get token
    login_url = f"{base_url}/auth/token"
    login_payload = {
        "email_or_phone": "admin@gocart.com",
        "password": "Password1"  # Or "password", let's try both
    }
    
    response = requests.post(login_url, json=login_payload)
    if response.status_code != 200:
        login_payload["password"] = "password"
        response = requests.post(login_url, json=login_payload)
        
    if response.status_code != 200:
        print("Login failed:", response.status_code, response.text)
        return
        
    token = response.json()['result']['access_token']
    print("Logged in successfully, token obtained.")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Let's test the endpoint with different payloads
    cart_url = f"{base_url}/cart/items"
    
    payloads = [
        {"desc": "Valid request", "body": {"productVariantId": "422f401e-7f21-44bd-afd5-771841114861", "quantity": 1}},
        {"desc": "Null productVariantId", "body": {"productVariantId": None, "quantity": 1}},
        {"desc": "Empty string productVariantId", "body": {"productVariantId": "", "quantity": 1}},
        {"desc": "String 'null' productVariantId", "body": {"productVariantId": "null", "quantity": 1}},
        {"desc": "String 'undefined' productVariantId", "body": {"productVariantId": "undefined", "quantity": 1}},
        {"desc": "Missing productVariantId", "body": {"quantity": 1}},
    ]
    
    for p in payloads:
        print(f"\nTesting: {p['desc']}")
        r = requests.post(cart_url, json=p['body'], headers=headers)
        print("Status:", r.status_code)
        try:
            print("Response:", json.dumps(r.json(), indent=2))
        except Exception:
            print("Response text:", r.text)

if __name__ == "__main__":
    test_api()
