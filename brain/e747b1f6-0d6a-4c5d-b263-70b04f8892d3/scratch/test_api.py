import requests

BASE_URL = "http://localhost:8088/api"

def test():
    # 1. Login
    login_url = f"{BASE_URL}/auth/token"
    payload = {
        "email_or_phone": "admin@gocart.com",
        "password": "Password1"
    }
    
    print("Attempting login...")
    try:
        res = requests.post(login_url, json=payload)
        print(f"Login Response status: {res.status_code}")
        
        token = res.json()["result"]["access_token"]
        print(f"Obtained Token: {token[:20]}...")
        
        # 2. Get Admin Orders
        orders_url = f"{BASE_URL}/admin/orders"
        headers = {
            "Authorization": f"Bearer {token}"
        }
        res_orders = requests.get(orders_url, headers=headers)
        print(f"Get Orders status: {res_orders.status_code}")
        orders_result = res_orders.json()
        print(f"Total orders returned: {len(orders_result.get('result', []))}")
        if orders_result.get('result'):
            print("First order details:")
            first_order = orders_result['result'][0]
            print({k: v for k, v in first_order.items() if k != 'shopGroups'})
            
        # 3. Get Category Revenue
        cat_url = f"{BASE_URL}/admin/stats/category-revenue?days=30"
        res_cat = requests.get(cat_url, headers=headers)
        print(f"Get Category Revenue status: {res_cat.status_code}")
        print(f"Get Category Revenue response: {res_cat.json()}")
        
        # 4. Get Revenue Chart
        rev_url = f"{BASE_URL}/admin/stats/revenue-chart?days=30"
        res_rev = requests.get(rev_url, headers=headers)
        print(f"Get Revenue Chart status: {res_rev.status_code}")
        print(f"Get Revenue Chart response: {res_rev.json()}")
        
        # 5. Get Top Products
        top_url = f"{BASE_URL}/admin/stats/top-products?days=30&limit=10"
        res_top = requests.get(top_url, headers=headers)
        print(f"Get Top Products status: {res_top.status_code}")
        print(f"Get Top Products response: {res_top.json()}")
        
        # 6. Get User Growth
        growth_url = f"{BASE_URL}/admin/stats/user-growth?days=30"
        res_growth = requests.get(growth_url, headers=headers)
        print(f"Get User Growth status: {res_growth.status_code}")
        print(f"Get User Growth response: {res_growth.json()}")

    except Exception as e:
        print(f"Error making request: {e}")

if __name__ == "__main__":
    test()
