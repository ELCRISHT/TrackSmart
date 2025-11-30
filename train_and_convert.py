"""
Complete script to download Roboflow dataset, train YOLOv5, and convert to ONNX
Run this script to automatically:
1. Download your Roboflow dataset
2. Train a YOLOv5 model
3. Convert to ONNX format
"""

import os
import subprocess
import sys

try:
    from ultralytics import YOLO
except ImportError:
    print("❌ Error: ultralytics not installed")
    print("   Install it with: pip install ultralytics")
    sys.exit(1)

print("=" * 60)
print("YOLOv5 Training from Roboflow Dataset")
print("=" * 60)

# Step 1: Download dataset
print("\n[1/4] Downloading dataset from Roboflow...")
try:
    subprocess.run([
        'curl', '-L', 
        'https://app.roboflow.com/ds/UJzZwNvixz?key=q7OCUvAdOK',
        '-o', 'roboflow.zip'
    ], check=True, capture_output=True)
    print("✅ Download complete")
except Exception as e:
    print(f"❌ Download failed: {e}")
    print("   Make sure curl is installed and you have internet connection")
    sys.exit(1)

# Step 2: Extract dataset
print("\n[2/4] Extracting dataset...")
try:
    subprocess.run(['unzip', '-q', 'roboflow.zip'], check=True)
    subprocess.run(['rm', 'roboflow.zip'], check=True)
    print("✅ Extraction complete")
except Exception as e:
    print(f"❌ Extraction failed: {e}")
    sys.exit(1)

# Find dataset folder
dataset_folder = None
for item in os.listdir('.'):
    if os.path.isdir(item) and ('dataset' in item.lower() or 'train' in item.lower()):
        # Check if it has data.yaml
        if os.path.exists(os.path.join(item, 'data.yaml')):
            dataset_folder = item
            break

if not dataset_folder:
    print("❌ Error: Could not find dataset folder with data.yaml")
    print("   Available folders:", [d for d in os.listdir('.') if os.path.isdir(d)])
    sys.exit(1)

dataset_yaml = os.path.join(dataset_folder, 'data.yaml')
print(f"✅ Found dataset: {dataset_folder}")

# Read classes from data.yaml
try:
    import yaml
    with open(dataset_yaml, 'r') as f:
        data = yaml.safe_load(f)
        classes = data.get('names', [])
        print(f"✅ Found {len(classes)} classes: {classes}")
except Exception as e:
    print(f"⚠️  Could not read classes from data.yaml: {e}")
    classes = []

# Step 3: Train model
print("\n[3/4] Training YOLOv5 model...")
print("⚠️  This may take 30 minutes to several hours depending on your hardware")
print("   Using GPU will be much faster than CPU")

try:
    # Start with nano model (smallest, fastest)
    model = YOLO('yolov5n.pt')
    
    print(f"\n   Training with {len(classes)} classes")
    print(f"   Dataset: {dataset_yaml}")
    print(f"   Model: yolov5n.pt (nano - fastest)")
    
    results = model.train(
        data=dataset_yaml,
        epochs=100,           # Number of training epochs
        imgsz=640,            # Image size
        batch=16,             # Batch size (reduce if you get memory errors)
        name='distraction_detector',  # Model name
        patience=50,          # Early stopping patience
    )
    
    best_model_path = model.trainer.best
    print(f"\n✅ Training complete!")
    print(f"   Best model saved at: {best_model_path}")
    
except Exception as e:
    print(f"❌ Training failed: {e}")
    print("\nTroubleshooting:")
    print("  - If 'CUDA out of memory': reduce batch size to 8 or 4")
    print("  - If 'module not found': pip install ultralytics")
    print("  - Check that your dataset is valid")
    sys.exit(1)

# Step 4: Convert to ONNX
print("\n[4/4] Converting to ONNX format...")
try:
    # Load the best model
    model = YOLO(best_model_path)
    
    # Export to ONNX
    model.export(format='onnx', imgsz=640)
    
    onnx_path = best_model_path.replace('.pt', '.onnx')
    
    if os.path.exists(onnx_path):
        print(f"✅ ONNX model ready: {onnx_path}")
    else:
        # Sometimes export creates in different location
        onnx_path = best_model_path.replace('weights/best.pt', 'weights/best.onnx')
        if os.path.exists(onnx_path):
            print(f"✅ ONNX model ready: {onnx_path}")
        else:
            print("⚠️  ONNX file not found in expected location")
            print("   Check the runs/detect/distraction_detector/weights/ folder")
    
except Exception as e:
    print(f"❌ ONNX conversion failed: {e}")
    sys.exit(1)

# Summary
print("\n" + "=" * 60)
print("✅ All done! Next steps:")
print("=" * 60)
print(f"\n1. Copy your ONNX model:")
print(f"   cp {onnx_path} trckr/public/models/yolov5.onnx")
print(f"\n2. Open: components/MeetingRoom.tsx")
print(f"   Find line 259: useYOLOv5={{false}}")
print(f"   Change to: useYOLOv5={{true}}")
print(f"\n3. Update class mappings (lines 261-265):")
if classes:
    print(f"   Your classes: {classes}")
    print(f"   Example mapping:")
    print(f"   normal: {[c for c in classes if 'normal' in c.lower() or 'attentive' in c.lower()]}")
    print(f"   distracted: {[c for c in classes if 'distract' in c.lower() or 'phone' in c.lower()]}")
    print(f"   outOfFrame: {[c for c in classes if 'frame' in c.lower() or 'empty' in c.lower()]}")
else:
    print(f"   Check your data.yaml file for class names")
print(f"\n4. Install dependencies and test:")
print(f"   cd trckr")
print(f"   npm install")
print(f"   npm run dev")
print("=" * 60)

