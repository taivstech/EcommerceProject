import requests
import json

BASE_URL = "http://localhost:8088/api"

def test():
    # 1. Login
    login_url = f"{BASE_URL}/auth/token"
    payload = {
        "email_or_phone": "admin@gocart.com",
        "password": "Password1"
    }
    
    try:
        res = requests.post(login_url, json=payload)
        token = res.json()["result"]["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        dump_url = f"{BASE_URL}/admin/commission/dump-data"
        res_dump = requests.post(dump_url, headers=headers)
        
        print(f"Dump API response: {res_dump.status_code}")
        print(res_dump.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
