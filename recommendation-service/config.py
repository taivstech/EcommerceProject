import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "ecommerce_db")
DB_USER = os.getenv("SPRING_DATASOURCE_USERNAME", "root")
DB_PASS = os.getenv("SPRING_DATASOURCE_PASSWORD", "")

# Server
HOST = os.getenv("REC_HOST", "0.0.0.0")
PORT = int(os.getenv("REC_PORT", "8000"))

# Model
REFRESH_INTERVAL_MINUTES = int(os.getenv("REFRESH_INTERVAL_MINUTES", "30"))

# Redis (for future use — currently models are in-memory)
REDIS_HOST = os.getenv("SPRING_DATA_REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("SPRING_DATA_REDIS_PORT", "6379"))
