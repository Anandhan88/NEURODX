import os
import certifi
import traceback
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-brain-tumor-detection-2026")

# In-memory fallbacks when MongoDB is offline
users_fallback = [
    {
        "email": "admin@hospital.com",
        "password": "pbkdf2:sha256:600000$8Z9pQ$49a4ee758117769cf32e2c2ddaa6df4ef1f0bc1c7e148bc8a87679633e9b1bbd", # admin
        "hospital_name": "General Hospital",
        "doctor_name": "Dr. Admin",
        "phone_number": "1234567890",
        "role": "admin",
        "created_at": datetime.now().isoformat()
    },
    {
        "email": "doctor@hospital.com",
        "password": "pbkdf2:sha256:600000$Wv1bE$6c0c2018ea6ef07cf6bc3cbdf6d6a2f8b5066dbff1f9859ec1d87e07a33a388b", # doctor123
        "hospital_name": "City Medical Center",
        "doctor_name": "Dr. Smith",
        "phone_number": "9876543210",
        "role": "doctor",
        "created_at": datetime.now().isoformat()
    }
]

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

    mongo_target = MONGO_URI or "mongodb://localhost:27017/"
    print(f"[INFO] Connecting to MongoDB: {mongo_target.split('@')[-1] if '@' in mongo_target else mongo_target}")

    try:
        kwargs = {
            "serverSelectionTimeoutMS": 3000,
            "connectTimeoutMS": 3000
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

def is_connected():
    return users_collection is not None

def log_activity(action, user_email="System", details=None):
    """Record audit activity logs in MongoDB Atlas or fallback memory."""
    log_entry = {
        "action": action,
        "user_email": user_email,
        "details": details or {},
        "timestamp": datetime.now().isoformat()
    }
    try:
        if activity_logs_collection is not None:
            activity_logs_collection.insert_one(log_entry)
        else:
            activity_logs_fallback.append(log_entry)
    except Exception as e:
        print(f"Error logging activity: {e}")

