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
        
        hist_url = f"{BASE_URL}/admin/commission/history?page=0&size=1"
        res_hist = requests.get(hist_url, headers=headers)
        
        with open("history_out.json", "w", encoding="utf-8") as f:
            json.dump(res_hist.json(), f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
