# 🎯 Complete Guide: Train YOLOv5 from Roboflow Dataset

## Overview
You have a Roboflow dataset. We need to:
1. Download the dataset
2. Train a YOLOv5 model
3. Convert to ONNX
4. Integrate into your app

---

## Step 1: Download Your Dataset

Run this command in your terminal:

```bash
curl -L "https://app.roboflow.com/ds/UJzZwNvixz?key=q7OCUvAdOK" > roboflow.zip
unzip roboflow.zip
rm roboflow.zip
```

This will create a folder with your dataset (usually named something like `dataset-name-1` or similar).

---

## Step 2: Install Training Dependencies

```bash
pip install ultralytics roboflow
```

Or if you prefer the original YOLOv5:

```bash
pip install yolov5 roboflow
```

---

## Step 3: Train Your YOLOv5 Model

### Option A: Using Ultralytics YOLOv8 (Recommended - Easier)

Create a file called `train_model.py`:

```python
from ultralytics import YOLO
import os

# Download dataset
os.system('curl -L "https://app.roboflow.com/ds/UJzZwNvixz?key=q7OCUvAdOK" > roboflow.zip')
os.system('unzip roboflow.zip')
os.system('rm roboflow.zip')

# Find the dataset folder (usually ends with -1, -2, etc.)
dataset_folder = None
for item in os.listdir('.'):
    if os.path.isdir(item) and 'dataset' in item.lower():
        dataset_folder = item
        break

if not dataset_folder:
    print("Could not find dataset folder!")
    exit()

# Path to dataset.yaml (usually in dataset folder)
dataset_yaml = os.path.join(dataset_folder, 'data.yaml')

# Initialize YOLO model
model = YOLO('yolov5n.pt')  # or yolov5s.pt, yolov5m.pt, yolov5l.pt, yolov5x.pt

# Train the model
results = model.train(
    data=dataset_yaml,
    epochs=100,           # Number of training epochs
    imgsz=640,           # Image size
    batch=16,            # Batch size (adjust based on your GPU)
    name='distraction_model'  # Model name
)

print("Training complete!")
print(f"Best model saved at: {model.trainer.best}")
```

Run it:
```bash
python train_model.py
```

After training, your model will be at: `runs/detect/distraction_model/weights/best.pt`

### Option B: Using Original YOLOv5

```python
from yolov5 import YOLOv5
import os

# Download dataset
os.system('curl -L "https://app.roboflow.com/ds/UJzZwNvixz?key=q7OCUvAdOK" > roboflow.zip')
os.system('unzip roboflow.zip')
os.system('rm roboflow.zip')

# Find dataset folder
dataset_folder = None
for item in os.listdir('.'):
    if os.path.isdir(item) and 'dataset' in item.lower():
        dataset_folder = item
        break

dataset_yaml = os.path.join(dataset_folder, 'data.yaml')

# Initialize model
model = YOLOv5('yolov5s.pt')  # Start with pretrained weights

# Train
model.train(
    data=dataset_yaml,
    epochs=100,
    imgsz=640,
    batch=16
)

print("Training complete!")
```

---

## Step 4: Convert Trained Model to ONNX

After training, convert your model:

### If using Ultralytics:

```python
from ultralytics import YOLO

# Load your trained model
model = YOLO('runs/detect/distraction_model/weights/best.pt')

# Export to ONNX
model.export(format='onnx', imgsz=640)

print("Model exported to ONNX!")
```

### If using YOLOv5:

```python
from yolov5 import YOLOv5

# Load your trained model
model = YOLOv5('path/to/your/trained/model.pt')

# Export to ONNX
model.export(format='onnx', imgsz=640)
```

---

## Step 5: Check Your Model Classes

Before integrating, check what classes your model detects:

1. Open the `data.yaml` file in your dataset folder
2. Look for the `names:` section
3. Note the class names (e.g., `['normal', 'distracted', 'out_of_frame']`)

You'll need these for the integration!

---

## Step 6: Integrate into Your App

1. **Copy the ONNX model:**
   - Find your `best.onnx` file (from export)
   - Copy it to: `trckr/public/models/yolov5.onnx`

2. **Update MeetingRoom.tsx:**
   - Open `components/MeetingRoom.tsx`
   - Find line 259: `useYOLOv5={false}`
   - Change to: `useYOLOv5={true}`
   
3. **Update class mappings:**
   ```typescript
   yoloClassMappings={{
     normal: ['normal', 'attentive'],        // Your actual class names
     distracted: ['distracted', 'phone'],   // Your actual class names
     outOfFrame: ['out_of_frame', 'empty'], // Your actual class names
   }}
   ```
   
   ⚠️ **Important:** Use the EXACT class names from your `data.yaml` file!

4. **Install and test:**
   ```bash
   npm install
   npm run dev
   ```

---

## Complete Training Script (All-in-One)

Save this as `train_and_convert.py`:

```python
"""
Complete script to download Roboflow dataset, train YOLOv5, and convert to ONNX
"""

import os
import subprocess
from ultralytics import YOLO

print("=" * 60)
print("YOLOv5 Training from Roboflow Dataset")
print("=" * 60)

# Step 1: Download dataset
print("\n[1/4] Downloading dataset...")
subprocess.run([
    'curl', '-L', 
    'https://app.roboflow.com/ds/UJzZwNvixz?key=q7OCUvAdOK',
    '-o', 'roboflow.zip'
], check=True)

print("[2/4] Extracting dataset...")
subprocess.run(['unzip', '-q', 'roboflow.zip'], check=True)
subprocess.run(['rm', 'roboflow.zip'], check=True)

# Find dataset folder
dataset_folder = None
for item in os.listdir('.'):
    if os.path.isdir(item) and 'dataset' in item.lower():
        dataset_folder = item
        break

if not dataset_folder:
    print("❌ Error: Could not find dataset folder!")
    exit(1)

dataset_yaml = os.path.join(dataset_folder, 'data.yaml')
print(f"✅ Found dataset: {dataset_folder}")

# Step 2: Train model
print("\n[3/4] Training YOLOv5 model...")
print("This may take a while (30 minutes to several hours)...")

model = YOLO('yolov5n.pt')  # Start with nano (smallest, fastest)

results = model.train(
    data=dataset_yaml,
    epochs=100,
    imgsz=640,
    batch=16,
    name='distraction_detector'
)

print(f"✅ Training complete!")
print(f"   Best model: {model.trainer.best}")

# Step 3: Convert to ONNX
print("\n[4/4] Converting to ONNX...")
model = YOLO(model.trainer.best)
model.export(format='onnx', imgsz=640)

onnx_path = model.trainer.best.replace('.pt', '.onnx')
print(f"✅ ONNX model ready: {onnx_path}")

print("\n" + "=" * 60)
print("Next steps:")
print(f"1. Copy {onnx_path} to trckr/public/models/yolov5.onnx")
print("2. Open components/MeetingRoom.tsx")
print("3. Change useYOLOv5={false} to useYOLOv5={true}")
print("4. Update class mappings with your model's classes")
print("=" * 60)
```

Run it:
```bash
python train_and_convert.py
```

---

## Training Tips

### GPU vs CPU
- **GPU (Recommended):** Much faster training (hours instead of days)
- **CPU:** Works but very slow (may take days)

### Model Sizes
- `yolov5n.pt` - Nano (smallest, fastest, less accurate)
- `yolov5s.pt` - Small (balanced)
- `yolov5m.pt` - Medium (better accuracy)
- `yolov5l.pt` - Large (high accuracy)
- `yolov5x.pt` - Extra Large (best accuracy, slowest)

Start with `yolov5n` or `yolov5s` for faster training.

### Training Parameters
- `epochs`: Number of training cycles (100-300 recommended)
- `batch`: Images per batch (16-32 for GPU, 4-8 for CPU)
- `imgsz`: Image size (640 is standard)

---

## Troubleshooting

### "CUDA out of memory"
- Reduce batch size: `batch=8` or `batch=4`
- Use smaller model: `yolov5n.pt` instead of `yolov5x.pt`

### "Module not found"
- Install: `pip install ultralytics` or `pip install yolov5`

### Training too slow
- Use GPU if available
- Reduce epochs for testing
- Use smaller model size

---

## Quick Start (Copy-Paste)

```bash
# Install
pip install ultralytics

# Download, train, and convert (all in one)
python train_and_convert.py

# Copy model to project
cp runs/detect/distraction_detector/weights/best.onnx trckr/public/models/yolov5.onnx
```

Then update `MeetingRoom.tsx` as described above!

---

Good luck with training! 🚀

