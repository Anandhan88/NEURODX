import os
import tensorflow as tf
from tensorflow.keras.layers import Conv2D, BatchNormalization, MaxPooling2D, Flatten, Dropout, Dense
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

# Paths to the dataset in BRAIN_TUMOUR_PRED
DATASET_DIR = r"C:\Users\Anandhan S\Desktop\BRAIN_TUMOUR_PRED\Brain-Tumor-detector\dataset"
TRAIN_DIR = os.path.join(DATASET_DIR, "Training")
TEST_DIR = os.path.join(DATASET_DIR, "Testing")

IMG_SIZE = (150, 150)
BATCH_SIZE = 32
EPOCHS = 20

print("Dataset Directory:", DATASET_DIR)
print("Training Folder  :", TRAIN_DIR)
print("Testing Folder   :", TEST_DIR)

# 1. Load training, validation, and test datasets
print("\nLoading training dataset...")
train_dataset = tf.keras.utils.image_dataset_from_directory(
    TRAIN_DIR,
    validation_split=0.2,
    subset="training",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="categorical"
)

print("\nLoading validation dataset...")
validation_dataset = tf.keras.utils.image_dataset_from_directory(
    TRAIN_DIR,
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="categorical"
)

print("\nLoading test dataset...")
test_dataset = tf.keras.utils.image_dataset_from_directory(
    TEST_DIR,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="categorical",
    shuffle=False
)

# Verify class names
class_names = train_dataset.class_names
print("\nClass Names found:", class_names)
class_indices = {name: i for i, name in enumerate(class_names)}
print("Class Indices:", class_indices)

# Optimize performance with tf.data API
AUTOTUNE = tf.data.AUTOTUNE

# Normalize pixel values to [0, 1] as expected by BTP's app.py
def normalize_images(images, labels):
    return images / 255.0, labels

train_dataset = train_dataset.map(normalize_images, num_parallel_calls=AUTOTUNE)
validation_dataset = validation_dataset.map(normalize_images, num_parallel_calls=AUTOTUNE)
test_dataset = test_dataset.map(normalize_images, num_parallel_calls=AUTOTUNE)

# Cache and prefetch to memory for speed
train_dataset = train_dataset.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
validation_dataset = validation_dataset.cache().prefetch(buffer_size=AUTOTUNE)
test_dataset = test_dataset.cache().prefetch(buffer_size=AUTOTUNE)

# 2. Native data augmentation layers
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal"),
    tf.keras.layers.RandomRotation(0.05), # ~20 degrees
    tf.keras.layers.RandomZoom(0.2)
])

# 3. Build the Custom CNN Model Architecture (12 Layers total: Conv/Dense)
inputs = tf.keras.Input(shape=(150, 150, 3))
x = data_augmentation(inputs)

# Block 1
x = Conv2D(32, (3, 3), activation='relu')(x)
x = BatchNormalization()(x)
x = MaxPooling2D((2, 2))(x)

# Block 2
x = Conv2D(64, (3, 3), activation='relu')(x)
x = BatchNormalization()(x)
x = MaxPooling2D((2, 2))(x)

# Block 3
x = Conv2D(128, (3, 3), activation='relu')(x)
x = BatchNormalization()(x)
x = MaxPooling2D((2, 2))(x)

# Block 4
x = Conv2D(128, (3, 3), activation='relu')(x)
x = BatchNormalization()(x)
x = MaxPooling2D((2, 2))(x)

# Fully Connected Classifier
x = Flatten()(x)
x = Dropout(0.5)(x)
x = Dense(512, activation='relu')(x)
x = BatchNormalization()(x)
x = Dropout(0.5)(x)
x = Dense(256, activation='relu')(x)
x = BatchNormalization()(x)
x = Dropout(0.3)(x)

outputs = Dense(4, activation='softmax')(x)

model = Model(inputs=inputs, outputs=outputs)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# 4. Prepare callbacks
os.makedirs("model", exist_ok=True)
model_path = os.path.join("model", "brain_tumor_classifier.h5")

checkpoint = ModelCheckpoint(
    filepath=model_path,
    monitor="val_accuracy",
    save_best_only=True,
    mode="max",
    verbose=1
)

early_stop = EarlyStopping(
    monitor="val_loss",
    patience=5,
    restore_best_weights=True,
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.2,
    patience=3,
    min_lr=1e-6,
    verbose=1
)

# 5. Model training
print("\nInitiating model training...")
history = model.fit(
    train_dataset,
    validation_data=validation_dataset,
    epochs=EPOCHS,
    callbacks=[checkpoint, early_stop, reduce_lr]
)

print("\nModel training completed!")

# 6. Evaluation
loss, accuracy = model.evaluate(test_dataset)
print(f"\nFinal Test Accuracy: {accuracy*100:.2f}%")

# Save final model state
model.save(model_path)
print(f"Model saved successfully to {model_path}")
