import requests
import json

url = 'http://localhost:8088/api/products/fb040c1e-a9c4-4ef3-97b0-19007d4638b2'
try:
    response = requests.get(url)
    print("Status code:", response.status_code)
    data = response.json()
    print(json.dumps(data, indent=2))
except Exception as e:
    print("Error calling API:", e)
