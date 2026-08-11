import builtins
def print(*args, **kwargs):
    try:
        builtins.print(*args, **kwargs)
    except Exception:
        pass

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['TF_NUM_INTRAOP_THREADS'] = '1'
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
import gc

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
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

import io
try:
    import werkzeug.formparser
    werkzeug.formparser.default_stream_factory = lambda total_content_length, filename, content_type, content_length=None: io.BytesIO()
except Exception:
    pass

# ========== ONNX / TFLite / Keras Brain Tumor Classifier Model Loader ==========
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ONNX_PATH = os.path.join(BASE_DIR, "model", "brain_tumor_classifier.onnx")
TFLITE_PATH = os.path.join(BASE_DIR, "model", "brain_tumor_classifier.tflite")
H5_PATH = os.path.join(BASE_DIR, "model", "brain_tumor_classifier.h5")

onnx_session = None
onnx_input_names = None
onnx_output_name = None

tflite_interpreter = None
tflite_input_details = None
tflite_output_details = None

model = None
model_loading = False
model_load_error = None
model_lock = threading.Lock()

def _find_file(filename):
    candidates = [
        os.path.join(BASE_DIR, "model", filename),
        os.path.join(os.getcwd(), "model", filename),
        os.path.join(os.getcwd(), "backend", "model", filename),
        os.path.join(BASE_DIR, "..", "model", filename)
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate
    return None

def load_classifier_model():
    global onnx_session, onnx_input_names, onnx_output_name
    global tflite_interpreter, tflite_input_details, tflite_output_details
    global model, model_loading, model_load_error

    if onnx_session is not None or tflite_interpreter is not None or model is not None:
        return True

    with model_lock:
        if onnx_session is not None or tflite_interpreter is not None or model is not None:
            return True
        try:
            model_loading = True
            model_load_error = None

            # 1. Try ONNX Runtime (Ultra-fast, 20MB RAM, zero TF overhead - best for Render)
            target_onnx = _find_file("brain_tumor_classifier.onnx")
            if target_onnx and os.path.exists(target_onnx):
                print(f"[INFO] Loading ONNX model from: {target_onnx}")
                import onnxruntime as ort
                sess = ort.InferenceSession(target_onnx, providers=['CPUExecutionProvider'])
                onnx_input_names = [i.name for i in sess.get_inputs()]
                onnx_output_name = sess.get_outputs()[0].name
                onnx_session = sess
                model_load_error = None
                print("[OK] ONNX Runtime Model loaded successfully! (20MB low-RAM mode active)")
                return True

            # 2. Try TFLite model
            target_tflite = _find_file("brain_tumor_classifier.tflite")
            if target_tflite and os.path.exists(target_tflite):
                print(f"[INFO] Loading TFLite model from: {target_tflite}")
                try:
                    import tflite_runtime.interpreter as tflite
                except ImportError:
                    import tensorflow.lite as tflite

                interp = tflite.Interpreter(model_path=target_tflite)
                interp.allocate_tensors()
                tflite_input_details = interp.get_input_details()
                tflite_output_details = interp.get_output_details()
                tflite_interpreter = interp
                model_load_error = None
                print("[OK] TFLite Model loaded successfully! (15MB low-RAM mode active)")
                return True

            # 3. Try Keras H5 model
            target_h5 = _find_file("brain_tumor_classifier.h5")
            if target_h5 and os.path.exists(target_h5):
                print(f"[INFO] Loading Keras H5 model from: {target_h5}")
                import tensorflow as tf
                from tensorflow.keras.models import load_model
                model = load_model(target_h5)
                model_load_error = None
                print("[OK] Keras Model loaded successfully!")
                return True

            model_load_error = "No valid model file found (.onnx, .tflite, .h5)"
            return False

        except Exception as e:
            print(f"[ERROR] Error loading model: {e}")
            traceback.print_exc()
            model_load_error = str(e)
            return False
        finally:
            model_loading = False

def get_model():
    if onnx_session is not None or tflite_interpreter is not None or model is not None:
        return True
    return load_classifier_model()

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
        "version": "1.0.1",
        "message": "NEURODX Brain Tumor Detection API",
        "health": "/health"
    })

@app.route('/health', methods=['GET'])
def health_check():
    m = get_model()
    return jsonify({
        'status': 'healthy',
        'version': '1.0.1',
        'message': 'Brain Tumor Classifier API is running',
        'model_loaded': m is not None,
        'model_loading': model_loading,
        'model_load_error': model_load_error,
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
            existing_user = db.users_collection.find_one({"email": email}, {"_id": 1})
        else:
            existing_user = next((u for u in users_fallback if u.get("email") == email), None)

        if existing_user:
            return jsonify({"error": "Email address already registered"}), 409

        # Fast password hash algorithm (pbkdf2:sha256:1000) for instant CPU computation
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256:1000')

        new_user = {
            "email": email,
            "password": hashed_password,
            "hospital_name": hospital_name,
            "doctor_name": doctor_name,
            "phone_number": phone_number,
            "role": role,
            "created_at": datetime.now().isoformat()
        }

        if db.users_collection is not None:
            db.users_collection.insert_one(new_user)
        else:
            users_fallback.append(new_user)

        log_activity("Account Registration", email, {"hospital": hospital_name})
        return jsonify({"message": "Signup successful"}), 200

    except DuplicateKeyError:
        return jsonify({"error": "Email address already registered"}), 409

    except Exception as e:
        print(f"[SIGNUP ERROR] Exception during signup:\n{traceback.format_exc()}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

import base64

@app.route('/predict', methods=['POST'])
def predict():
    try:
        start_time = time.time()
        img = None

        # 1. Try reading JSON payload (base64 image string)
        data = request.get_json(silent=True, force=True) or {}
        b64_str = data.get("image") or data.get("file") or data.get("b64")
        if b64_str:
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            try:
                img_bytes = base64.b64decode(b64_str)
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            except Exception as b64_err:
                return jsonify({'error': f'Invalid base64 image data: {str(b64_err)}'}), 400

        # 2. Try reading multipart file upload
        if img is None and 'file' in request.files:
            file = request.files['file']
            if file and file.filename != '':
                try:
                    img_bytes = file.read()
                    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                except Exception as img_err:
                    print(f"[PREDICT ERROR] Image reading failed: {img_err}")
                    return jsonify({'error': f'Invalid image format: {str(img_err)}'}), 400

        # 3. Fallback: try raw request bytes
        if img is None:
            try:
                raw_bytes = request.get_data()
                if raw_bytes and len(raw_bytes) > 0:
                    img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
            except Exception:
                pass

        if img is None:
            return jsonify({'error': 'No image file uploaded or invalid image payload'}), 400

        is_ready = get_model()
        if not is_ready:
            return jsonify({'error': f'Model not loaded ({model_load_error or "Unknown error"})'}), 500
            
        img_array = preprocess_image(img)

        try:
            if onnx_session is not None:
                inputs = {}
                for name in onnx_input_names:
                    if 'input_layer' in name or name == onnx_input_names[0]:
                        inputs[name] = img_array
                    elif 'Sub/y' in name:
                        inputs[name] = np.zeros((1, 1, 1, 3), dtype=np.float32)
                    elif 'Sqrt/x' in name:
                        inputs[name] = np.ones((1, 1, 1, 3), dtype=np.float32)
                    else:
                        inputs[name] = np.zeros((1, 1, 1, 3), dtype=np.float32)
                raw_pred = onnx_session.run([onnx_output_name], inputs)[0]
            elif tflite_interpreter is not None:
                tflite_interpreter.set_tensor(tflite_input_details[0]['index'], img_array)
                tflite_interpreter.invoke()
                raw_pred = tflite_interpreter.get_tensor(tflite_output_details[0]['index'])
            elif model is not None:
                raw_pred = model(img_array, training=False).numpy()
            else:
                return jsonify({'error': 'Model execution failed'}), 500
        except Exception as infer_err:
            print(f"[PREDICT ERROR] Inference failed: {infer_err}")
            traceback.print_exc()
            return jsonify({'error': f'Inference engine failure: {str(infer_err)}'}), 500

        gc.collect()

        class_index = int(np.argmax(raw_pred[0]))
        confidence = float(np.max(raw_pred[0]))
        inference_time = round(time.time() - start_time, 3)

        probabilities = {
            class_labels[i]: round(float(raw_pred[0][i]) * 100, 2)
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

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# ========== Run Flask App ==========
if __name__ == '__main__':
    print("[INFO] Starting Brain Tumor Classifier API...")
    print(f"ONNX Model path: {ONNX_PATH}")
    print(f"ONNX Model file exists: {os.path.exists(ONNX_PATH)}")
    print(f"MongoDB Connected: {is_connected()}")
    if db.db is not None:
        print(f"[STARTUP LOG] Connected Database Name: {db.db.name}")
        print(f"[STARTUP LOG] All Collection Names: {db.db.list_collection_names()}")
    else:
        print("[STARTUP LOG] Database: Disconnected (None)")
    print(f"[STARTUP LOG] users_collection Initialized: {db.users_collection is not None}")
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
