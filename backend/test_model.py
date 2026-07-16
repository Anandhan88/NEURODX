import tensorflow as tf
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from PIL import Image
import os

def preprocess_image(img):
    try:
        # Resize to 150x150 (as expected by the model)
        img = img.resize((150, 150))
        
        # Convert to array and normalize
        img_array = image.img_to_array(img)
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        raise e

def test_model():
    try:
        print("Testing model loading and prediction...")
        
        # Check if model file exists
        model_path = os.path.join("model", "brain_tumor_classifier.h5")
        print(f"Model path: {model_path}")
        print(f"Model file exists: {os.path.exists(model_path)}")
        
        if not os.path.exists(model_path):
            print("❌ Model file not found!")
            return False
        
        # Load model
        print("Loading model...")
        model = load_model(model_path)
        print("[OK] Model loaded successfully!")
        
        # Create a dummy image for testing
        print("Creating test image...")
        dummy_img = np.random.randint(0, 255, (150, 150, 3), dtype=np.uint8)
        pil_img = Image.fromarray(dummy_img)
        
        # Preprocess image
        print("Preprocessing image...")
        img_array = preprocess_image(pil_img)
        print(f"Input shape: {img_array.shape}")
        
        # Make prediction
        print("Making prediction...")
        prediction = model.predict(img_array, verbose=0)
        class_index = np.argmax(prediction)
        confidence = float(np.max(prediction))
        
        class_labels = ['Glioma', 'Meningioma', 'No Tumor', 'Pituitary']
        print(f"[OK] Prediction successful!")
        print(f"Predicted class: {class_labels[class_index]}")
        print(f"Confidence: {confidence * 100:.2f}%")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    test_model() 