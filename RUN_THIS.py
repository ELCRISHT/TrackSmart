"""
🚀 FAST TRAINING - Run this script!
70 epochs, optimized for speed
Estimated: 15-45 min (GPU) or 1-3 hours (CPU)
"""

import os
import yaml
from ultralytics import YOLO

print("=" * 60)
print("🚀 FAST YOLOv5 Training (70 epochs)")
print("=" * 60)

# Check data.yaml
if not os.path.exists('data.yaml'):
    print("❌ data.yaml not found!")
    input("Press Enter to exit...")
    exit(1)

# Fix paths
with open('data.yaml', 'r') as f:
    data = yaml.safe_load(f)
    if '../' in str(data):
        data['train'] = os.path.abspath('train/images')
        data['val'] = os.path.abspath('valid/images')
        data['test'] = os.path.abspath('test/images')
        with open('data.yaml', 'w') as f2:
            yaml.dump(data, f2)

# Read classes
with open('data.yaml', 'r') as f:
    classes = yaml.safe_load(f).get('names', [])
    print(f"✅ Classes: {classes}")

# Train
print("\n⚡ Starting FAST training...")
print("   - 70 epochs")
print("   - 416px images (2-3x faster)")
print("   - Batch 32 (faster)")
print("   - Mixed precision (GPU boost)")

model = YOLO('yolov5n.pt')
results = model.train(
    data='data.yaml',
    epochs=70,
    imgsz=416,      # Smaller = faster
    batch=32,       # Larger = faster
    name='distraction_detector',
    patience=30,
    workers=8,
    device=0,      # GPU if available
    cache=True,    # Cache images
    amp=True,      # Mixed precision
)

# Convert
print("\n📦 Converting to ONNX...")
model = YOLO(model.trainer.best)
model.export(format='onnx', imgsz=416)

onnx_path = model.trainer.best.replace('.pt', '.onnx')
target = 'public/models/yolov5.onnx'

print(f"\n✅ Done!")
print(f"\n📋 Next:")
print(f"1. Copy: {onnx_path} → {target}")
print(f"2. Edit MeetingRoom.tsx: useYOLOv5={{true}}")
print(f"3. Update classes: {classes}")

input("\nPress Enter to exit...")

