import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

try:
    client = MongoClient(MONGO_URI)
    client.admin.command('ping')  # to check connection
    print("[OK] MongoDB connection successful")
except Exception as e:
    print("[ERROR] MongoDB connection failed:", e)
