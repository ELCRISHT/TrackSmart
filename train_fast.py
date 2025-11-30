"""
Fast YOLOv5 Training Script - 70 epochs, optimized for speed
"""

import os
import subprocess
import sys
import urllib.request
import zipfile
import yaml

print("=" * 60)
print("Fast YOLOv5 Training (70 epochs, optimized for speed)")
print("=" * 60)

# Check if ultralytics is installed
try:
    from ultralytics import YOLO
    print("✅ Ultralytics is installed")
except ImportError:
    print("❌ Error: ultralytics not installed")
    print("\nPlease install it by running:")
    print("   pip install ultralytics")
    sys.exit(1)

# Check for data.yaml
dataset_yaml = 'data.yaml'
if not os.path.exists(dataset_yaml):
    print("❌ Error: data.yaml not found in current directory")
    sys.exit(1)

print(f"✅ Found dataset config: {dataset_yaml}")

# Read classes
classes = []
try:
    with open(dataset_yaml, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
        classes = data.get('names', [])
        print(f"✅ Found {len(classes)} classes: {classes}")
except Exception as e:
    print(f"⚠️  Could not read classes: {e}")

# Fix paths in data.yaml if needed
try:
    with open(dataset_yaml, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    
    # Fix relative paths
    if data.get('train', '').startswith('../'):
        data['train'] = os.path.abspath(data['train'].replace('../', ''))
    if data.get('val', '').startswith('../'):
        data['val'] = os.path.abspath(data['val'].replace('../', ''))
    if data.get('test', '').startswith('../'):
        data['test'] = os.path.abspath(data['test'].replace('../', ''))
    
    with open(dataset_yaml, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, default_flow_style=False)
    print("✅ Fixed paths in data.yaml")
except Exception as e:
    print(f"⚠️  Could not fix paths: {e}")

# Train model
print("\n" + "=" * 60)
print("🚀 Starting FAST training...")
print("=" * 60)
print("\nConfiguration:")
print("  - Model: YOLOv5n (nano - fastest)")
print("  - Epochs: 70 (reduced)")
print("  - Image size: 416 (smaller = 2-3x faster)")
print("  - Batch size: 32 (larger = faster)")
print("  - Mixed precision: Enabled (faster on GPU)")
print("  - Image caching: Enabled (faster loading)")

try:
    model = YOLO('yolov5n.pt')
    
    print("\n⏱️  Training started...")
    print("   This should take 15-45 minutes on GPU, 1-3 hours on CPU")
    
    results = model.train(
        data=dataset_yaml,
        epochs=70,            # Reduced from 100
        imgsz=416,            # Smaller = much faster (was 640)
        batch=32,             # Larger batch = faster
        name='distraction_detector',
        patience=30,          # Early stopping
        workers=8,            # More workers = faster
        device=0,             # GPU if available
        cache=True,           # Cache images = faster
        amp=True,             # Mixed precision = faster
        verbose=True,         # Show progress
    )
    
    best_model_path = model.trainer.best
    print(f"\n✅ Training complete!")
    print(f"   Best model: {best_model_path}")
    
except Exception as e:
    print(f"\n❌ Training failed: {e}")
    print("\nTrying with smaller batch size...")
    
    try:
        model = YOLO('yolov5n.pt')
        results = model.train(
            data=dataset_yaml,
            epochs=70,
            imgsz=416,
            batch=16,          # Smaller batch
            name='distraction_detector',
            patience=30,
            workers=4,
            cache=True,
        )
        best_model_path = model.trainer.best
        print(f"\n✅ Training complete with smaller batch!")
        print(f"   Best model: {best_model_path}")
    except Exception as e2:
        print(f"\n❌ Still failed: {e2}")
        sys.exit(1)

# Convert to ONNX
print("\n" + "=" * 60)
print("Converting to ONNX...")
print("=" * 60)

try:
    model = YOLO(best_model_path)
    model.export(format='onnx', imgsz=416)
    
    onnx_path = best_model_path.replace('.pt', '.onnx')
    if not os.path.exists(onnx_path):
        weights_dir = os.path.dirname(best_model_path)
        onnx_path = os.path.join(weights_dir, 'best.onnx')
    
    if os.path.exists(onnx_path):
        abs_onnx = os.path.abspath(onnx_path)
        abs_target = os.path.abspath("public/models/yolov5.onnx")
        
        print(f"\n✅ ONNX model ready!")
        print(f"\n📋 Next steps:")
        print(f"\n1. Copy model:")
        print(f"   copy \"{abs_onnx}\" \"{abs_target}\"")
        
        print(f"\n2. Open components/MeetingRoom.tsx")
        print(f"   Change line 259: useYOLOv5={{false}} → useYOLOv5={{true}}")
        
        print(f"\n3. Update class mappings (lines 261-265):")
        if classes:
            print(f"   yoloClassMappings={{")
            print(f"     normal: {[c for c in classes if 'normal' in c.lower()] or ['Normal']},")
            print(f"     distracted: {[c for c in classes if 'distract' in c.lower()] or ['Distracted']},")
            print(f"     outOfFrame: {[c for c in classes if 'object' in c.lower()] or ['Object Deteced']},")
            print(f"   }}")
        
        print(f"\n4. Test:")
        print(f"   npm install")
        print(f"   npm run dev")
        
    else:
        print(f"⚠️  ONNX file not found. Check: {os.path.dirname(best_model_path)}")
        
except Exception as e:
    print(f"❌ ONNX conversion failed: {e}")

print("\n" + "=" * 60)
input("\nPress Enter to exit...")

