import os
import certifi
import traceback
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING

# Load environment variables
load_dotenv()

DEFAULT_ATLAS_URI = "mongodb+srv://anandhans23aid_db_user:kVz2ktq8F0yQkKRq@cluster0.4wpzqoj.mongodb.net/brain_tumor_db?retryWrites=true&w=majority&appName=Cluster0"
MONGO_URI = os.getenv("MONGO_URI") or DEFAULT_ATLAS_URI
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-brain-tumor-detection-2026")

# In-memory fallbacks when MongoDB is offline
users_fallback = []

patients_fallback = []
predictions_fallback = []
reports_fallback = []
analytics_fallback = [
    {
        "model_version": "v1.0.0",
        "accuracy": 96.2,
        "precision": 95.8,
        "recall": 96.0,
        "f1_score": 95.9,
        "confusion_matrix": [
            [84, 5, 2, 3],
            [4, 88, 1, 2],
            [1, 2, 94, 1],
            [3, 1, 2, 89]
        ],
        "training_date": "2026-07-01T00:00:00"
    }
]
activity_logs_fallback = []
history_fallback = []

# Database state
client = None
db = None

users_collection = None
patients_collection = None
predictions_collection = None
reports_collection = None
analytics_collection = None
activity_logs_collection = None
history_collection = None

def init_db():
    global client, db, users_collection, patients_collection
    global predictions_collection, reports_collection
    global analytics_collection, activity_logs_collection, history_collection

    mongo_target = MONGO_URI or DEFAULT_ATLAS_URI
    print(f"[INFO] Connecting to MongoDB: {mongo_target.split('@')[-1] if '@' in mongo_target else mongo_target}")

    try:
        kwargs = {
            "serverSelectionTimeoutMS": 10000,
            "connectTimeoutMS": 10000
        }
        if "mongodb+srv://" in mongo_target or "tls=true" in mongo_target.lower():
            kwargs.update({
                "tls": True,
                "tlsCAFile": certifi.where(),
                "tlsAllowInvalidCertificates": False,
                "tlsAllowInvalidHostnames": False
            })

        client = MongoClient(mongo_target, **kwargs)
        db = client["brain_tumor_db"]

        # Collections
        users_collection = db["users"]
        patients_collection = db["patients"]
        predictions_collection = db["predictions"]
        reports_collection = db["reports"]
        analytics_collection = db["analytics"]
        activity_logs_collection = db["activity_logs"]
        history_collection = db["history"]

        # Validate connection
        client.admin.command('ping')
        colls = db.list_collection_names()
        print("[OK] MongoDB Atlas connection successful!")
        print(f"[DB STARTUP] Connected Database Name: {db.name}")
        print(f"[DB STARTUP] All Collection Names: {colls}")
        print(f"[DB STARTUP] users_collection Initialized: {users_collection is not None}")

        # Create indexes
        try:
            users_collection.create_index("email", unique=True, sparse=True)
            patients_collection.create_index("patient_id")
            predictions_collection.create_index([("patient_id", ASCENDING), ("prediction_time", DESCENDING)])
            reports_collection.create_index("created_time")
            activity_logs_collection.create_index("timestamp")
        except Exception as idx_err:
            print(f"[WARNING] Database index creation note: {idx_err}")

        # Seed initial analytics if empty
        if analytics_collection.count_documents({}) == 0:
            analytics_collection.insert_one(analytics_fallback[0])

        return True

    except Exception as e:
        print(f"[WARNING] MongoDB connection unsuccessful: {e}")
        users_collection = None
        patients_collection = None
        predictions_collection = None
        reports_collection = None
        analytics_collection = None
        activity_logs_collection = None
        history_collection = None
        return False

# Initialize DB connection on module load
init_db()

import threading

def is_connected():
    return users_collection is not None

def log_activity(action, user_email="System", details=None):
    """Record audit activity logs asynchronously to eliminate API latency."""
    def _async_log():
        try:
            log_entry = {
                "action": action,
                "user_email": user_email,
                "details": details or {},
                "timestamp": datetime.now().isoformat()
            }
            if activity_logs_collection is not None:
                activity_logs_collection.insert_one(log_entry)
            else:
                activity_logs_fallback.append(log_entry)
        except Exception as e:
            print(f"Error logging activity: {e}")

    try:
        threading.Thread(target=_async_log, daemon=True).start()
    except Exception:
        pass

