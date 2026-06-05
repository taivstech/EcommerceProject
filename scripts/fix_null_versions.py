import mysql.connector

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'taiteasicale',
    'database': 'ecommerce_db',
    'port': 3306,
}

def fix_null_versions():
    print("Fixing NULL versions in database...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        # Fetch all tables
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]
        
        for table in tables:
            try:
                # Check if 'version' column exists
                cursor.execute(f"SHOW COLUMNS FROM `{table}` LIKE 'version'")
                if cursor.fetchone():
                    # Update NULL versions to 0
                    cursor.execute(f"UPDATE `{table}` SET version = 0 WHERE version IS NULL")
                    print(f"Updated {cursor.rowcount} rows in table '{table}'")
            except Exception as e:
                print(f"Skipping table {table} due to error: {e}")
        
        conn.commit()
        print("Success! All NULL versions fixed.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    fix_null_versions()
