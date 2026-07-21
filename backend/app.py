import builtins
def print(*args, **kwargs):
    try:
        builtins.print(*args, **kwargs)
    except Exception:
        pass

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np
from PIL import Image
import traceback
import threading
import time
from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo.errors import DuplicateKeyError

# Import MongoDB database module
import db
from db import (
    is_connected, log_activity,
    users_fallback, patients_fallback, predictions_fallback,
    reports_fallback, analytics_fallback, activity_logs_fallback, history_fallback
)

# ========== Load environment variables ==========
load_dotenv()

# ========== Initialize Flask app ==========
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

# ========== Lazy / Background Brain Tumor Classifier Model Loader ==========
MODEL_PATH = os.path.join("model", "brain_tumor_classifier.h5")
model = None
model_loading = False
model_load_error = None
model_lock = threading.Lock()

def load_classifier_model():
    global model, model_loading, model_load_error
    if model is not None:
        return model
    with model_lock:
        if model is not None:
            return model
        try:
            model_loading = True
            model_load_error = None
            print(f"[INFO] Loading TensorFlow model from: {MODEL_PATH}")
            import tensorflow as tf
            from tensorflow.keras.models import load_model
            if os.path.exists(MODEL_PATH):
                model = load_model(MODEL_PATH)
                model_load_error = None
                print("[OK] TensorFlow Model loaded successfully!")
            else:
                print(f"[ERROR] Model path not found: {MODEL_PATH}")
                model_load_error = f"File not found: {MODEL_PATH}"
        except Exception as e:
            print(f"[ERROR] Error loading model: {e}")
            traceback.print_exc()
            model_load_error = str(e)
        finally:
            model_loading = False
        return model

def _start_background_model_load():
    thread = threading.Thread(target=load_classifier_model, daemon=True)
    thread.start()

# Launch TensorFlow model load in background daemon thread for INSTANT server startup (<0.3s)
_start_background_model_load()

def get_model():
    if model is not None:
        return model
    if model_loading:
        print("[INFO] Waiting for background model load to finish...")
        start_wait = time.time()
        while model_loading and (time.time() - start_wait < 10):
            time.sleep(0.1)
    return model or load_classifier_model()

# Class labels
class_labels = ['Glioma', 'Meningioma', 'No Tumor', 'Pituitary']

# ========== Utilities ==========
def preprocess_image(img):
    try:
        img = img.resize((150, 150))
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        raise e

# ========== API Endpoints ==========

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "running",
        "message": "NEURODX Brain Tumor Detection API",
        "health": "/health"
    })

@app.route('/health', methods=['GET'])
def health_check():
    m = get_model()
    return jsonify({
        'status': 'healthy',
        'message': 'Brain Tumor Classifier API is running',
        'model_loaded': m is not None,
        'model_loading': model_loading,
        'database_connected': is_connected()
    })

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"error": "Missing Email or Password"}), 400

        user = None
        if db.users_collection is not None:
            user = db.users_collection.find_one({"email": email})
        else:
            user = next((u for u in users_fallback if u.get("email") == email), None)

        if not user:
            log_activity("Login Failed", email, {"reason": "User not found"})
            return jsonify({"error": "Invalid credentials"}), 401

        stored_password = user.get("password", "")
        # Password verification: support hashed passwords & legacy plain text fallback
        is_valid = False
        if stored_password.startswith("pbkdf2:") or stored_password.startswith("scrypt:"):
            is_valid = check_password_hash(stored_password, password)
        else:
            is_valid = (stored_password == password)

        if is_valid:
            log_activity("Login Success", email, {"hospital": user.get("hospital_name")})
            return jsonify({
                "message": "Login successful",
                "user": {
                    "email": user.get("email"),
                    "hospital_name": user.get("hospital_name"),
                    "doctor_name": user.get("doctor_name", user.get("hospital_name")),
                    "role": user.get("role", "doctor")
                }
            }), 200
        else:
            log_activity("Login Failed", email, {"reason": "Incorrect password"})
            return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json() or {}
        print(f"[SIGNUP DEBUG] Incoming request JSON: {data}")
        print(f"[SIGNUP DEBUG] db.users_collection is None: {db.users_collection is None}")

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        hospital_name = data.get("hospital_name", "")
        doctor_name = data.get("doctor_name") or hospital_name
        phone_number = data.get("phone_number", "")
        role = data.get("role", "hospital")

        if not all([email, password, hospital_name, phone_number]):
            return jsonify({"error": "All fields are required"}), 400

        existing_user = None
        if db.users_collection is not None:
            existing_user = db.users_collection.find_one({"email": email})
        else:
            print("[SIGNUP DEBUG] MongoDB collection unavailable. Using fallback memory list.")
            existing_user = next((u for u in users_fallback if u.get("email") == email), None)

        if existing_user:
            print(f"[SIGNUP DEBUG] Existing user found for email '{email}'")
            return jsonify({"error": "Email address already registered"}), 409

        # Hash password securely using Werkzeug
        hashed_password = generate_password_hash(password)

        new_user = {
            "email": email,
            "password": hashed_password,
            "hospital_name": hospital_name,
            "doctor_name": doctor_name,
            "phone_number": phone_number,
            "role": role,
            "created_at": datetime.now().isoformat()
        }

        print(f"[SIGNUP DEBUG] Document before insertion: {new_user}")

        if db.users_collection is not None:
            result = db.users_collection.insert_one(new_user)
            print(f"[SIGNUP DEBUG] Inserted ID: {result.inserted_id}")

            # Immediate verification in 'users' collection in 'brain_tumor_db'
            verify_doc = db.users_collection.find_one({"email": email})
            print(f"[SIGNUP DEBUG] Immediate find_one verification result: {verify_doc}")
        else:
            print("[SIGNUP DEBUG] Inserting into fallback memory list.")
            users_fallback.append(new_user)

        log_activity("Account Registration", email, {"hospital": hospital_name})
        return jsonify({"message": "Signup successful"}), 200

    except DuplicateKeyError as dup_err:
        print(f"[SIGNUP DEBUG] DuplicateKeyError for email '{email}': {dup_err}")
        return jsonify({"error": "Email address already registered"}), 409

    except Exception as e:
        print(f"[SIGNUP ERROR] Exception during signup:\n{traceback.format_exc()}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        start_time = time.time()
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            return jsonify({'error': 'Only .png, .jpg, and .jpeg files are allowed'}), 400

        active_model = get_model()
        if active_model is None:
            return jsonify({'error': f'Model not loaded ({model_load_error or "Unknown error"})'}), 500

        img = Image.open(file.stream).convert("RGB")
        img_array = preprocess_image(img)

        prediction = active_model.predict(img_array, verbose=0)
        class_index = int(np.argmax(prediction))
        confidence = float(np.max(prediction))
        inference_time = round(time.time() - start_time, 3)

        probabilities = {
            class_labels[i]: round(float(prediction[0][i]) * 100, 2)
            for i in range(len(class_labels))
        }

        predicted_class = class_labels[class_index]
        confidence_percentage = round(confidence * 100, 2)

        print(f"[PREDICT] Classified image. Outcome: {predicted_class} ({confidence_percentage}% confidence, {inference_time}s)")

        # Log prediction to activity_logs
        log_activity("MRI Scan Prediction", request.remote_addr, {
            "class": predicted_class,
            "confidence": confidence_percentage,
            "inference_time": inference_time
        })

        return jsonify({
            'result': f"{predicted_class} ({confidence_percentage}% confidence)",
            'class': predicted_class,
            'confidence': confidence_percentage,
            'probabilities': probabilities,
            'inference_time': f"{inference_time}s",
            'model_version': 'v1.0.0'
        })

    except Exception as e:
        print(f"[ERROR] Error in prediction: {e}")
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/history', methods=['POST'])
def save_history():
    try:
        data = request.get_json() or {}
        patient_name = data.get("patient_name", "Anonymous")
        patient_id = data.get("patient_id", "N/A")
        patient_age = data.get("patient_age", "N/A")
        doctor_notes = data.get("doctor_notes", "")
        tumor_class = data.get("tumor_class")
        confidence = data.get("confidence")
        timestamp = data.get("timestamp") or datetime.now().isoformat()
        gender = data.get("gender", "N/A")
        hospital_name = data.get("hospital_name", "General Hospital")
        doctor_name = data.get("doctor_name", "Attending Physician")
        mri_type = data.get("mri_type", "T1-Weighted Contrast MRI")
        pdf_path = data.get("pdf_path", "")

        record = {
            "patient_name": patient_name,
            "patient_id": patient_id,
            "patient_age": patient_age,
            "gender": gender,
            "hospital_name": hospital_name,
            "doctor_name": doctor_name,
            "mri_type": mri_type,
            "doctor_notes": doctor_notes,
            "tumor_class": tumor_class,
            "confidence": confidence,
            "pdf_path": pdf_path,
            "timestamp": timestamp,
            "created_time": timestamp
        }

        # Save to patients & predictions collections
        if db.patients_collection is not None and db.predictions_collection is not None:
            # Upsert patient
            db.patients_collection.update_one(
                {"patient_id": patient_id},
                {"$set": {
                    "patient_name": patient_name,
                    "patient_age": patient_age,
                    "gender": gender,
                    "hospital": hospital_name,
                    "doctor": doctor_name,
                    "mri_type": mri_type,
                    "updated_time": timestamp
                }},
                upsert=True
            )
            # Insert prediction
            db.predictions_collection.insert_one({
                "patient_id": patient_id,
                "patient_name": patient_name,
                "prediction": tumor_class,
                "confidence": confidence,
                "model_version": "v1.0.0",
                "prediction_time": timestamp,
                "doctor_notes": doctor_notes
            })
            if db.history_collection is not None:
                db.history_collection.insert_one(record)
                record["_id"] = str(record["_id"])
        else:
            patients_fallback.append(record)
            predictions_fallback.append(record)
            history_fallback.append(record)

        log_activity("Report Generation", doctor_name, {"patient_id": patient_id, "tumor_class": tumor_class})
        return jsonify({"message": "Scan history saved successfully", "record": record}), 200

    except Exception as e:
        print(f"Error saving history: {e}")
        return jsonify({"error": f"Failed to save history: {str(e)}"}), 500

@app.route('/history', methods=['GET'])
def get_history():
    try:
        search_query = request.args.get('q', '').strip()
        tumor_class_filter = request.args.get('tumor_class', '').strip()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 0))

        if db.history_collection is not None:
            query = {}
            if tumor_class_filter:
                query['tumor_class'] = tumor_class_filter
            if search_query:
                query['$or'] = [
                    {'patient_name': {'$regex': search_query, '$options': 'i'}},
                    {'patient_id': {'$regex': search_query, '$options': 'i'}},
                    {'doctor_notes': {'$regex': search_query, '$options': 'i'}},
                    {'tumor_class': {'$regex': search_query, '$options': 'i'}}
                ]

            cursor = db.history_collection.find(query).sort("timestamp", -1)
            if limit > 0:
                cursor = cursor.skip((page - 1) * limit).limit(limit)

            records = list(cursor)
            for r in records:
                r["_id"] = str(r["_id"])
        else:
            records = sorted(history_fallback, key=lambda x: x.get("timestamp", ""), reverse=True)
            if tumor_class_filter:
                records = [r for r in records if r.get('tumor_class') == tumor_class_filter]
            if search_query:
                sq = search_query.lower()
                records = [r for r in records if sq in r.get('patient_name', '').lower() or sq in r.get('patient_id', '').lower()]

        return jsonify(records), 200

    except Exception as e:
        print(f"Error retrieving history: {e}")
        return jsonify({"error": f"Failed to retrieve history: {str(e)}"}), 500

# ========== Patient Management Endpoints ==========

@app.route('/patients', methods=['POST'])
def add_patient():
    """Add a new patient record."""
    try:
        data = request.get_json() or {}
        patient_id = data.get("patient_id") or f"PAT-{int(time.time() * 1000)}"
        name = data.get("name", "").strip()
        age = data.get("age", "")
        gender = data.get("gender", "Other")
        phone = data.get("phone", "")
        email = data.get("email", "")
        doctor = data.get("doctor", "Attending Physician")
        mri_image = data.get("mri_image", "")
        prediction = data.get("prediction", "Pending")
        confidence = data.get("confidence", 0)
        report_status = data.get("report_status", "Pending")
        scan_date = data.get("scan_date") or datetime.now().isoformat()

        if not name:
            return jsonify({"error": "Patient name is required"}), 400

        patient_doc = {
            "patient_id": patient_id,
            "name": name,
            "patient_name": name,
            "age": age,
            "gender": gender,
            "phone": phone,
            "email": email,
            "doctor": doctor,
            "doctor_name": doctor,
            "scan_date": scan_date,
            "mri_image": mri_image,
            "prediction": prediction,
            "tumor_class": prediction,
            "confidence": confidence,
            "report_status": report_status,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        if db.patients_collection is not None:
            existing = db.patients_collection.find_one({"patient_id": patient_id})
            if existing:
                patient_id = f"PAT-{int(time.time() * 1000)}"
                patient_doc["patient_id"] = patient_id
            db.patients_collection.insert_one(patient_doc)
            patient_doc["_id"] = str(patient_doc["_id"])
        else:
            patients_fallback.append(patient_doc)

        log_activity("Add Patient", doctor, {"patient_id": patient_id, "name": name})
        return jsonify({"message": "Patient added successfully", "patient": patient_doc}), 201

    except Exception as e:
        print(f"[ERROR] Error adding patient: {e}")
        return jsonify({"error": f"Failed to add patient: {str(e)}"}), 500

@app.route('/patients', methods=['GET'])
def get_patients():
    """Retrieve patient directory with search, filtering, and pagination."""
    try:
        search = request.args.get('q', '').strip()
        status_filter = request.args.get('status', '').strip()
        gender_filter = request.args.get('gender', '').strip()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 0))

        if db.patients_collection is not None:
            query = {}
            if status_filter:
                query['report_status'] = status_filter
            if gender_filter:
                query['gender'] = gender_filter
            if search:
                query['$or'] = [
                    {'name': {'$regex': search, '$options': 'i'}},
                    {'patient_name': {'$regex': search, '$options': 'i'}},
                    {'patient_id': {'$regex': search, '$options': 'i'}},
                    {'doctor': {'$regex': search, '$options': 'i'}},
                    {'email': {'$regex': search, '$options': 'i'}},
                    {'phone': {'$regex': search, '$options': 'i'}}
                ]

            cursor = db.patients_collection.find(query).sort("created_at", -1)
            if limit > 0:
                cursor = cursor.skip((page - 1) * limit).limit(limit)

            patients = list(cursor)
            for p in patients:
                p["_id"] = str(p["_id"])
        else:
            patients = sorted(patients_fallback, key=lambda x: x.get("created_at", ""), reverse=True)
            if status_filter:
                patients = [p for p in patients if p.get('report_status') == status_filter]
            if gender_filter:
                patients = [p for p in patients if p.get('gender') == gender_filter]
            if search:
                sq = search.lower()
                patients = [p for p in patients if sq in (p.get('name') or p.get('patient_name') or '').lower() or sq in (p.get('patient_id') or '').lower()]

        return jsonify(patients), 200

    except Exception as e:
        print(f"[ERROR] Error fetching patients: {e}")
        return jsonify({"error": f"Failed to fetch patients: {str(e)}"}), 500

@app.route('/patients/<patient_id>', methods=['GET'])
def get_patient_details(patient_id):
    """Fetch a single patient record with attached predictions and reports."""
    try:
        patient = None
        scans = []
        if db.patients_collection is not None:
            patient = db.patients_collection.find_one({"patient_id": patient_id})
            if patient:
                patient["_id"] = str(patient["_id"])
                if db.predictions_collection is not None:
                    scans = list(db.predictions_collection.find({"patient_id": patient_id}).sort("prediction_time", -1))
                    for s in scans:
                        s["_id"] = str(s["_id"])
        else:
            patient = next((p for p in patients_fallback if p.get("patient_id") == patient_id), None)
            scans = [p for p in predictions_fallback if p.get("patient_id") == patient_id]

        if not patient:
            return jsonify({"error": "Patient not found"}), 404

        return jsonify({
            "patient": patient,
            "scans": scans
        }), 200

    except Exception as e:
        print(f"[ERROR] Error fetching patient details: {e}")
        return jsonify({"error": f"Failed to fetch patient details: {str(e)}"}), 500

@app.route('/patients/<patient_id>', methods=['PUT'])
def update_patient(patient_id):
    """Edit patient demographics and scan parameters."""
    try:
        data = request.get_json() or {}
        update_fields = {
            "name": data.get("name"),
            "patient_name": data.get("name"),
            "age": data.get("age"),
            "gender": data.get("gender"),
            "phone": data.get("phone"),
            "email": data.get("email"),
            "doctor": data.get("doctor"),
            "doctor_name": data.get("doctor"),
            "prediction": data.get("prediction"),
            "confidence": data.get("confidence"),
            "report_status": data.get("report_status"),
            "updated_at": datetime.now().isoformat()
        }
        update_fields = {k: v for k, v in update_fields.items() if v is not None}

        if db.patients_collection is not None:
            res = db.patients_collection.update_one({"patient_id": patient_id}, {"$set": update_fields})
            if res.matched_count == 0:
                return jsonify({"error": "Patient not found"}), 404
        else:
            patient = next((p for p in patients_fallback if p.get("patient_id") == patient_id), None)
            if not patient:
                return jsonify({"error": "Patient not found"}), 404
            patient.update(update_fields)

        log_activity("Edit Patient", data.get("doctor", "System"), {"patient_id": patient_id})
        return jsonify({"message": "Patient updated successfully"}), 200

    except Exception as e:
        print(f"[ERROR] Error updating patient: {e}")
        return jsonify({"error": f"Failed to update patient: {str(e)}"}), 500

@app.route('/patients/<patient_id>', methods=['DELETE'])
def delete_patient(patient_id):
    """Delete patient record and associated predictions."""
    try:
        if db.patients_collection is not None:
            res = db.patients_collection.delete_one({"patient_id": patient_id})
            if res.deleted_count == 0:
                return jsonify({"error": "Patient not found"}), 404
            if db.predictions_collection is not None:
                db.predictions_collection.delete_many({"patient_id": patient_id})
        else:
            global patients_fallback
            patients_fallback = [p for p in patients_fallback if p.get("patient_id") != patient_id]

        log_activity("Delete Patient", "Admin", {"patient_id": patient_id})
        return jsonify({"message": "Patient deleted successfully"}), 200

    except Exception as e:
        print(f"[ERROR] Error deleting patient: {e}")
        return jsonify({"error": f"Failed to delete patient: {str(e)}"}), 500

@app.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Live dashboard aggregate metrics directly from MongoDB Atlas."""
    try:
        today_iso = date.today().isoformat()
        
        if db.history_collection is not None:
            total_scans = db.history_collection.count_documents({})
            today_scans = db.history_collection.count_documents({"timestamp": {"$regex": f"^{today_iso}"}})
            tumors_detected = db.history_collection.count_documents({"tumor_class": {"$ne": "No Tumor"}})
            healthy_patients = db.history_collection.count_documents({"tumor_class": "No Tumor"})
            high_risk_count = db.history_collection.count_documents({
                "tumor_class": {"$ne": "No Tumor"},
                "confidence": {"$gte": 80}
            })

            # Calculate average confidence
            pipeline = [{"$group": {"_id": None, "avg_conf": {"$avg": "$confidence"}}}]
            avg_res = list(db.history_collection.aggregate(pipeline))
            avg_confidence = round(avg_res[0]["avg_conf"], 1) if avg_res and avg_res[0].get("avg_conf") else 0.0

            # Recent predictions & activity
            recent_preds = list(db.history_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(5))
            recent_reports = list(db.reports_collection.find({}, {"_id": 0}).sort("created_time", -1).limit(5)) if db.reports_collection is not None else []
            latest_activity = list(db.activity_logs_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(5)) if db.activity_logs_collection is not None else []
        else:
            total_scans = len(history_fallback)
            today_scans = len([h for h in history_fallback if h.get("timestamp", "").startswith(today_iso)])
            tumors_detected = len([h for h in history_fallback if h.get("tumor_class") != "No Tumor"])
            healthy_patients = len([h for h in history_fallback if h.get("tumor_class") == "No Tumor"])
            high_risk_count = len([h for h in history_fallback if h.get("tumor_class") != "No Tumor" and (h.get("confidence") or 0) >= 80])
            avg_confidence = round(sum([h.get("confidence", 0) for h in history_fallback]) / total_scans, 1) if total_scans > 0 else 0.0
            recent_preds = sorted(history_fallback, key=lambda x: x.get("timestamp", ""), reverse=True)[:5]
            recent_reports = []
            latest_activity = sorted(activity_logs_fallback, key=lambda x: x.get("timestamp", ""), reverse=True)[:5]

        return jsonify({
            "totalScans": total_scans,
            "todayScans": today_scans,
            "tumorsDetected": tumors_detected,
            "healthyPatients": healthy_patients,
            "highRiskCount": high_risk_count,
            "avgConfidence": avg_confidence,
            "recentPredictions": recent_preds,
            "recentReports": recent_reports,
            "latestActivity": latest_activity,
            "dbConnected": is_connected()
        }), 200

    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        return jsonify({"error": f"Failed to fetch dashboard stats: {str(e)}"}), 500

@app.route('/analytics', methods=['GET', 'POST'])
def analytics():
    """Retrieve or record machine learning model evaluation metrics."""
    try:
        if request.method == 'POST':
            data = request.get_json() or {}
            metric_doc = {
                "model_version": data.get("model_version", "v1.0.0"),
                "accuracy": data.get("accuracy", 96.2),
                "precision": data.get("precision", 95.8),
                "recall": data.get("recall", 96.0),
                "f1_score": data.get("f1_score", 95.9),
                "confusion_matrix": data.get("confusion_matrix", []),
                "training_date": data.get("training_date", datetime.now().isoformat())
            }
            if db.analytics_collection is not None:
                db.analytics_collection.insert_one(metric_doc)
                metric_doc["_id"] = str(metric_doc["_id"])
            else:
                analytics_fallback.append(metric_doc)
            log_activity("Record Analytics", "Admin", {"version": metric_doc["model_version"]})
            return jsonify({"message": "Analytics recorded", "data": metric_doc}), 200

        else:
            if db.analytics_collection is not None:
                metrics = list(db.analytics_collection.find({}, {"_id": 0}).sort("training_date", -1))
            else:
                metrics = analytics_fallback
            return jsonify(metrics[0] if metrics else {}), 200

    except Exception as e:
        print(f"Error in analytics endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/activity-logs', methods=['GET'])
def get_activity_logs():
    """Retrieve audit activity logs."""
    try:
        limit = int(request.args.get('limit', 20))
        if db.activity_logs_collection is not None:
            logs = list(db.activity_logs_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit))
        else:
            logs = sorted(activity_logs_fallback, key=lambda x: x.get("timestamp", ""), reverse=True)[:limit]
        return jsonify(logs), 200
    except Exception as e:
        print(f"Error fetching activity logs: {e}")
        return jsonify({"error": str(e)}), 500

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
    print(f"MongoDB Connected: {is_connected()}")
    if db.db is not None:
        print(f"[STARTUP LOG] Connected Database Name: {db.db.name}")
        print(f"[STARTUP LOG] All Collection Names: {db.db.list_collection_names()}")
    else:
        print("[STARTUP LOG] Database: Disconnected (None)")
    print(f"[STARTUP LOG] users_collection Initialized: {db.users_collection is not None}")
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
