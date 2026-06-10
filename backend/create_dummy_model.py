import os
import tensorflow as tf
from tensorflow.keras import layers, models

# Make sure model folder exists
os.makedirs("model", exist_ok=True)

# Build a simple sequential model
model = models.Sequential([
    layers.Input(shape=(150, 150, 3)),
    layers.Conv2D(8, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    layers.Flatten(),
    layers.Dense(16, activation='relu'),
    layers.Dense(4, activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

model_path = os.path.join("model", "brain_tumor_classifier.h5")
model.save(model_path)
print(f"✅ Dummy model saved successfully at {model_path}!")
