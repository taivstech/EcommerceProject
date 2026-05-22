import os
import sys
import random
import requests
from dotenv import load_dotenv

# Fix encoding issue for Windows console
sys.stdout.reconfigure(encoding='utf-8')

# Load biến môi trường từ file .env ở thư mục gốc
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

GHN_TOKEN = os.getenv('GHN_TOKEN', '669398e2-1160-11f1-a3d6-dac90fb956b5')
GHN_API_URL = os.getenv('GHN_API_URL', 'https://dev-online-gateway.ghn.vn/shiip/public-api/')

HEADERS = {
    'Token': GHN_TOKEN,
    'Content-Type': 'application/json'
}

def get_provinces():
    url = f"{GHN_API_URL.rstrip('/')}/master-data/province"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json().get('data', [])
    print(f"Error fetching provinces: {response.text}")
    return []

def get_districts(province_id):
    url = f"{GHN_API_URL.rstrip('/')}/master-data/district"
    response = requests.get(url, headers=HEADERS, params={'province_id': province_id})
    if response.status_code == 200:
        return response.json().get('data', [])
    print(f"Error fetching districts: {response.text}")
    return []

def get_wards(district_id):
    url = f"{GHN_API_URL.rstrip('/')}/master-data/ward"
    response = requests.get(url, headers=HEADERS, params={'district_id': district_id})
    if response.status_code == 200:
        return response.json().get('data', [])
    print(f"Error fetching wards: {response.text}")
    return []

def generate_random_street():
    streets = ['Nguyễn Trãi', 'Lê Lợi', 'Trần Hưng Đạo', 'Lê Duẩn', 'Quang Trung', 'Nguyễn Huệ', 'Hai Bà Trưng', 'Phan Đình Phùng']
    number = random.randint(1, 999)
    prefix = random.choice(['Số', 'Ngõ', 'Hẻm'])
    street = random.choice(streets)
    return f"{prefix} {number} {street}"

def generate_random_addresses(num_addresses=5):
    print("Fetching provinces from GHN...")
    provinces = get_provinces()
    if not provinces:
        print("No provinces found. Exiting.")
        return

    generated = []
    
    print(f"Generating {num_addresses} random addresses...")
    for i in range(num_addresses):
        province = random.choice(provinces)
        
        districts = get_districts(province['ProvinceID'])
        if not districts:
            continue
            
        district = random.choice(districts)
        
        wards = get_wards(district['DistrictID'])
        if not wards:
            continue
            
        ward = random.choice(wards)
        
        street = generate_random_street()
        full_address = f"{street}, {ward['WardName']}, {district['DistrictName']}, {province['ProvinceName']}"
        
        address_info = {
            "shop_address_detail": street,
            "shop_address_ward": ward['WardName'],
            "shop_address_ward_code": ward['WardCode'],
            "shop_address_district": district['DistrictName'],
            "shop_address_district_id": district['DistrictID'],
            "shop_address_province": province['ProvinceName'],
            "shop_address_province_id": province['ProvinceID'],
            "shop_address_full": full_address
        }
        
        generated.append(address_info)
        print(f"\n[Address {i+1}]")
        print(f"Full: {address_info['shop_address_full']}")
        print(f"Province: {address_info['shop_address_province']} (ID: {address_info['shop_address_province_id']})")
        print(f"District: {address_info['shop_address_district']} (ID: {address_info['shop_address_district_id']})")
        print(f"Ward: {address_info['shop_address_ward']} (Code: {address_info['shop_address_ward_code']})")
        
    return generated

if __name__ == "__main__":
    # You can change the number of addresses you want to generate here
    generate_random_addresses(5)
