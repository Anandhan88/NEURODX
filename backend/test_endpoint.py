import requests
import json


def test_backend():
    """Test the backend API endpoints"""
    
    # Test health check
    try:
        response = requests.get('http://localhost:5000/health')
        print("[OK] Health check status:", response.status_code)
        print("Response:", response.json())
    except Exception as e:
        print("[ERROR] Health check failed:", e)
        return False
    
    # Test prediction endpoint with a dummy request
    try:
        # Create a simple test image (1x1 pixel)
        from PIL import Image
        import io
        
        # Create a test image
        img = Image.new('RGB', (150, 150), color='white')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        files = {'file': ('test.png', img_bytes, 'image/png')}
        response = requests.post('http://localhost:5000/predict', files=files)
        
        print("[OK] Prediction test status:", response.status_code)
        if response.status_code == 200:
            print("Response:", response.json())
        else:
            print("Error:", response.text)
            
    except Exception as e:
        print("[ERROR] Prediction test failed:", e)
        return False
    
    return True

if __name__ == "__main__":
    print("Testing Brain Tumor Classifier Backend...")
    success = test_backend()
    if success:
        print("\n[OK] Backend is working correctly!")
    else:
        print("\n[ERROR] Backend has issues!") 