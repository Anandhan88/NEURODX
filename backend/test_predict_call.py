import requests
import io
import numpy as np
from PIL import Image

print("Sending test MRI scan prediction to Render...")
img = Image.fromarray(np.random.randint(0, 255, (150, 150, 3), dtype=np.uint8))
buf = io.BytesIO()
img.save(buf, format='JPEG')
buf.seek(0)

try:
    res = requests.post('https://neurodx-001b.onrender.com/predict', files={'file': ('test.jpg', buf, 'image/jpeg')})
    print(f"Status Code: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(f"Error: {e}")
