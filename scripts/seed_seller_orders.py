import mysql.connector
import uuid
import random
from datetime import datetime, timedelta

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
}

def uid(): return str(uuid.uuid4())

def seed_orders(email='sportspro@shop.com'):
    print(f"Seeding orders for shop owner: {email}...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            print(f"User {email} not found.")
            return
        user_id = user['id']
        
        cursor.execute("SELECT id FROM shops WHERE user_id = %s", (user_id,))
        shop = cursor.fetchone()
        if not shop:
            print(f"Shop not found for user {email}.")
            return
        shop_id = shop['id']
        print(f"Found shop ID: {shop_id}")

        cursor.execute("SELECT id FROM warehouses WHERE shop_id = %s LIMIT 1", (shop_id,))
        warehouse = cursor.fetchone()
        warehouse_id = warehouse['id'] if warehouse else None
        
        cursor.execute("""
            SELECT v.id as variant_id, v.price, p.id as product_id, p.name as product_name, v.sku as variant_sku, v.name as variant_name
            FROM product_variants v
            JOIN products p ON v.product_id = p.id
            WHERE p.shop_id = %s AND p.deleted_at IS NULL
        """, (shop_id,))
        variants = cursor.fetchall()
        
        if not variants:
            print("No product variants found for this shop. Cannot seed orders.")
            return

        statuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED']
        weights = [0.1, 0.1, 0.1, 0.1, 0.5, 0.1]
        
        num_orders_to_create = 50
        print(f"Creating {num_orders_to_create} fake orders...")
        
        for _ in range(num_orders_to_create):
            order_id = uid()
            group_id = uid()
            shipping_id = uid()
            
            days_ago = random.randint(0, 30)
            created_at = datetime.now() - timedelta(days=days_ago, hours=random.randint(0,23))
            
            status = random.choices(statuses, weights=weights)[0]
            cancel_reason = "Customer changed mind" if status == 'CANCELLED' else None
            
            num_items = random.randint(1, 4)
            selected_variants = random.choices(variants, k=num_items)
            
            subtotal = sum(v['price'] * random.randint(1, 3) for v in selected_variants)
            shipping_fee = 30000
            total = subtotal + shipping_fee
            
            # Insert Order
            cursor.execute("""
                INSERT INTO orders (
                    id, user_id, status, payment, is_paid, subtotal, shipping_fee, total_discount, total, 
                    created_at, updated_at, cancel_reason
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                order_id, user_id, status, 'COD', status in ['DELIVERED', 'COMPLETED'], subtotal, shipping_fee, 0, total,
                created_at, created_at, cancel_reason
            ))
            
            # Insert Shipping Address
            cursor.execute("""
                INSERT INTO shipping_addresses (
                    id, order_id, receiver_name, phone_number, full_address, detail_address, 
                    ward, ward_code, district, district_id, province, province_id, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                shipping_id, order_id, 'Test Customer ' + str(random.randint(1, 100)), '0987654321', 
                '123 Test Street, Hanoi', '123 Test', 'Hang Bai', '123', 'Hoan Kiem', 1, 'Hanoi', '1',
                created_at, created_at
            ))
            
            # Insert OrderShopGroup
            commission_rate = 0.05
            commission_amount = float(subtotal) * commission_rate
            net_amount = float(subtotal) - commission_amount
            
            cursor.execute("""
                INSERT INTO order_shop_groups (
                    id, order_id, shop_id, warehouse_id, subtotal, shipping_fee, total_discount, total,
                    commission_rate, commission_amount, net_amount, created_at, updated_at, shipment
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                group_id, order_id, shop_id, warehouse_id, subtotal, shipping_fee, 0, total,
                commission_rate, commission_amount, net_amount, created_at, created_at, 'GHN'
            ))
            
            # Insert OrderItems
            for v in selected_variants:
                item_id = uid()
                quantity = random.randint(1, 3)
                cursor.execute("""
                    INSERT INTO order_items (
                        id, order_shop_group_id, product_id, product_variant_id, 
                        product_name, variant_name, variant_sku, price, quantity, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    item_id, group_id, v['product_id'], v['variant_id'],
                    v['product_name'], v['variant_name'], v['variant_sku'], v['price'], quantity,
                    created_at, created_at
                ))
                
                # Update total_sold if completed
                if status == 'COMPLETED':
                    cursor.execute("""
                        UPDATE products SET total_sold = COALESCE(total_sold, 0) + %s WHERE id = %s
                    """, (quantity, v['product_id']))
                    cursor.execute("""
                        UPDATE product_variants SET sold_count = COALESCE(sold_count, 0) + %s WHERE id = %s
                    """, (quantity, v['variant_id']))

        conn.commit()
        print(f"Successfully seeded {num_orders_to_create} fake orders.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    import sys
    email = sys.argv[1] if len(sys.argv) > 1 else 'sportspro@shop.com'
    seed_orders(email)
