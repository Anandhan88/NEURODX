import builtins
def print(*args, **kwargs):
    try:
        builtins.print(*args, **kwargs)
    except Exception:
        pass

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import os
from PIL import Image
import traceback
import certifi

# ========== Load environment variables ==========
load_dotenv()

# ========== Initialize Flask app ==========
app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)

# ========== MongoDB Setup ==========
MONGO_URI = os.getenv("MONGO_URI")
print("MONGO_URI:", MONGO_URI)

history_fallback = []
history_collection = None

try:
    if MONGO_URI:
        client = MongoClient(
            MONGO_URI,
            tls=True,
            tlsCAFile=certifi.where(),
            tlsAllowInvalidCertificates=False,
            tlsAllowInvalidHostnames=False
        )
    else:
        client = MongoClient("mongodb://localhost:27017/")
    db = client["brain_tumor_db"]
    users_collection = db["users"]
    history_collection = db["history"]
    client.admin.command('ping')
    print("[OK] MongoDB connection successful!")
except Exception as e:
    print("[ERROR] MongoDB connection failed:", e)
    users_collection = None
    history_collection = None

# ========== Load Brain Tumor Classifier Model ==========
try:
    MODEL_PATH = os.path.join("model", "brain_tumor_classifier.h5")
    print(f"Loading model from: {MODEL_PATH}")
    model = load_model(MODEL_PATH)
    print("[OK] Model loaded successfully!")
except Exception as e:
    print(f"[ERROR] Error loading model: {e}")
    model = None

# Class labels
class_labels = ['Glioma', 'Meningioma', 'No Tumor', 'Pituitary']

# ========== Utilities ==========
def preprocess_image(img):
    try:
        img = img.resize((150, 150))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        raise e

# ========== API Endpoints ==========

@app.route('/', methods=['GET'])
def serve_index():
    return app.send_static_file('index.html')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Brain Tumor Classifier API is running',
        'model_loaded': model is not None
    })

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Missing Email or Password"}), 400

        user = users_collection.find_one({"email": email})
        if user and user["password"] == password:
            return jsonify({"message": "Login successful"}), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        hospital_name = data.get("hospital_name")
        phone_number = data.get("phone_number")

        if not all([email, password, hospital_name, phone_number]):
            return jsonify({"error": "All fields are required"}), 400

        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            return jsonify({"error": "Email address already registered"}), 409

        users_collection.insert_one({
            "email": email,
            "password": password,
            "hospital_name": hospital_name,
            "phone_number": phone_number
        })

        return jsonify({"message": "Signup successful"}), 200
    except Exception as e:
        print(f"Signup Error: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            return jsonify({'error': 'Only .png, .jpg, and .jpeg files are allowed'}), 400

        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        img = Image.open(file.stream).convert("RGB")
        img_array = preprocess_image(img)

        prediction = model.predict(img_array, verbose=0)
        class_index = np.argmax(prediction)
        confidence = float(np.max(prediction))

        probabilities = {
            class_labels[i]: round(float(prediction[0][i]) * 100, 2)
            for i in range(len(class_labels))
        }

        # Add logging for prediction requests
        print(f"[PREDICT] Classified image. Outcome: {class_labels[class_index]} ({round(confidence * 100, 2)}% confidence)")

        return jsonify({
            'result': f"{class_labels[class_index]} ({round(confidence * 100, 2)}% confidence)",
            'class': class_labels[class_index],
            'confidence': round(confidence * 100, 2),
            'probabilities': probabilities
        })

    except Exception as e:
        print(f"[ERROR] Error in prediction: {e}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

from datetime import datetime

@app.route('/history', methods=['POST'])
def save_history():
    try:
        data = request.get_json()
        patient_name = data.get("patient_name", "Anonymous")
        patient_id = data.get("patient_id", "N/A")
        patient_age = data.get("patient_age", "N/A")
        doctor_notes = data.get("doctor_notes", "")
        tumor_class = data.get("tumor_class")
        confidence = data.get("confidence")
        timestamp = data.get("timestamp") or datetime.now().isoformat()
        
        record = {
            "patient_name": patient_name,
            "patient_id": patient_id,
            "patient_age": patient_age,
            "doctor_notes": doctor_notes,
            "tumor_class": tumor_class,
            "confidence": confidence,
            "timestamp": timestamp
        }
        
        if history_collection is not None:
            history_collection.insert_one(record)
            record["_id"] = str(record["_id"])
        else:
            history_fallback.append(record)
            
        return jsonify({"message": "Scan history saved successfully", "record": record}), 200
    except Exception as e:
        print(f"Error saving history: {e}")
        return jsonify({"error": f"Failed to save history: {str(e)}"}), 500

@app.route('/history', methods=['GET'])
def get_history():
    try:
        if history_collection is not None:
            records = list(history_collection.find().sort("timestamp", -1))
            for r in records:
                r["_id"] = str(r["_id"])
        else:
            records = sorted(history_fallback, key=lambda x: x.get("timestamp", ""), reverse=True)
            
        return jsonify(records), 200
    except Exception as e:
        print(f"Error retrieving history: {e}")
        return jsonify({"error": f"Failed to retrieve history: {str(e)}"}), 500

@app.before_request
def log_request():
    try:
        print(f"[{request.method}] {request.path} from {request.remote_addr}")
    except Exception:
        pass

# ========== Run Flask App ==========
if __name__ == '__main__':
    print("[INFO] Starting Brain Tumor Classifier API...")
    print(f"Model path: {MODEL_PATH}")
    print(f"Model file exists: {os.path.exists(MODEL_PATH)}")
    app.run(debug=True, host='0.0.0.0', port=5000)
