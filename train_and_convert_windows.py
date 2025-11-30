"""
Windows-compatible script to download Roboflow dataset, train YOLOv5, and convert to ONNX
"""

import os
import subprocess
import sys
import urllib.request
import zipfile
import shutil

print("=" * 60)
print("YOLOv5 Training from Roboflow Dataset (Windows)")
print("=" * 60)

# Check if ultralytics is installed
try:
    from ultralytics import YOLO
    print("✅ Ultralytics is installed")
except ImportError:
    print("❌ Error: ultralytics not installed")
    print("\nPlease install it by running:")
    print("   pip install ultralytics")
    print("\nOr if that doesn't work:")
    print("   python -m pip install ultralytics")
    input("\nPress Enter after installing ultralytics, then run this script again...")
    sys.exit(1)

# Step 1: Download dataset
print("\n[1/4] Downloading dataset from Roboflow...")
try:
    url = "https://app.roboflow.com/ds/UJzZwNvixz?key=q7OCUvAdOK"
    zip_path = "roboflow.zip"
    
    print(f"   Downloading from: {url}")
    print("   This may take a few minutes...")
    
    urllib.request.urlretrieve(url, zip_path)
    print("✅ Download complete")
except Exception as e:
    print(f"❌ Download failed: {e}")
    print("   Make sure you have internet connection")
    input("\nPress Enter to exit...")
    sys.exit(1)

# Step 2: Extract dataset
print("\n[2/4] Extracting dataset...")
try:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall('.')
    
    # Remove zip file
    os.remove(zip_path)
    print("✅ Extraction complete")
except Exception as e:
    print(f"❌ Extraction failed: {e}")
    input("\nPress Enter to exit...")
    sys.exit(1)

# Find data.yaml file
print("\n   Looking for data.yaml...")
dataset_yaml = None

# Check root directory first (Roboflow often extracts here)
if os.path.exists('data.yaml'):
    dataset_yaml = 'data.yaml'
    print("✅ Found data.yaml in root directory")
else:
    # Check in subdirectories
    for item in os.listdir('.'):
        if os.path.isdir(item):
            yaml_path = os.path.join(item, 'data.yaml')
            if os.path.exists(yaml_path):
                dataset_yaml = yaml_path
                print(f"✅ Found data.yaml in: {item}")
                break

if not dataset_yaml or not os.path.exists(dataset_yaml):
    print("❌ Error: Could not find data.yaml")
    print("\n   Available files and folders:")
    items = [d for d in os.listdir('.') if os.path.isdir(d) or d.endswith('.yaml')]
    for item in items[:20]:  # Show first 20
        print(f"     - {item}")
    input("\nPress Enter to exit...")
    sys.exit(1)

print(f"✅ Using dataset config: {dataset_yaml}")

# Fix paths in data.yaml if they're relative
try:
    import yaml
    with open(dataset_yaml, 'r', encoding='utf-8') as f:
        data_content = f.read()
    
    # Check if paths are relative and fix them
    if '../' in data_content or './' in data_content:
        print("   Fixing relative paths in data.yaml...")
        with open(dataset_yaml, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        # Convert relative paths to absolute
        base_dir = os.path.dirname(os.path.abspath(dataset_yaml))
        if data.get('train', '').startswith('../'):
            data['train'] = os.path.abspath(data['train'].replace('../', ''))
        if data.get('val', '').startswith('../'):
            data['val'] = os.path.abspath(data['val'].replace('../', ''))
        if data.get('test', '').startswith('../'):
            data['test'] = os.path.abspath(data['test'].replace('../', ''))
        
        # Save fixed version
        with open(dataset_yaml, 'w', encoding='utf-8') as f:
            yaml.dump(data, f, default_flow_style=False)
        print("   ✅ Paths fixed")
except Exception as e:
    print(f"   ⚠️  Could not fix paths: {e}")
    print("   Continuing anyway...")

# Read classes from data.yaml
classes = []
try:
    import yaml
    with open(dataset_yaml, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
        classes = data.get('names', [])
        print(f"✅ Found {len(classes)} classes: {classes}")
except Exception as e:
    print(f"⚠️  Could not read classes from data.yaml: {e}")
    print("   You'll need to check data.yaml manually for class names")

# Step 3: Train model
print("\n[3/4] Training YOLOv5 model...")
print("⚠️  This may take 30 minutes to several hours depending on your hardware")
print("   Using GPU will be much faster than CPU")
print("\n   Starting training...")

try:
    # Start with nano model (smallest, fastest)
    print("\n   Loading YOLOv5n (nano) model...")
    model = YOLO('yolov5n.pt')
    
    print(f"\n   Training configuration (OPTIMIZED FOR SPEED):")
    print(f"   - Classes: {len(classes)}")
    print(f"   - Dataset: {dataset_yaml}")
    print(f"   - Model: yolov5n.pt (nano - fastest)")
    print(f"   - Epochs: 70 (reduced for faster training)")
    print(f"   - Image size: 416 (smaller = faster)")
    print(f"   - Batch size: 32 (larger = faster, if memory allows)")
    print("\n   Training started! This will be faster than before...")
    
    results = model.train(
        data=dataset_yaml,
        epochs=70,            # Reduced epochs for faster training
        imgsz=416,            # Smaller image size = much faster
        batch=32,             # Larger batch = faster (will auto-reduce if memory error)
        name='distraction_detector',  # Model name
        patience=30,          # Early stopping patience (reduced)
        workers=8,            # More workers = faster data loading
        device=0,             # Use GPU if available (0), CPU if not (-1)
        cache=True,           # Cache images in RAM for faster training
        amp=True,             # Automatic Mixed Precision = faster on GPU
    )
    
    best_model_path = model.trainer.best
    print(f"\n✅ Training complete!")
    print(f"   Best model saved at: {best_model_path}")
    
except Exception as e:
    print(f"\n❌ Training failed: {e}")
    print("\nTroubleshooting:")
    print("  - If 'CUDA out of memory': The script will try with smaller batch size")
    print("  - If 'module not found': pip install ultralytics")
    print("  - Check that your dataset is valid")
    
    # Try with smaller batch size
    try:
        print("\n   Retrying with smaller batch size (16)...")
        model = YOLO('yolov5n.pt')
        results = model.train(
            data=dataset_yaml,
            epochs=70,        # Reduced epochs
            imgsz=416,       # Smaller image size
            batch=16,        # Smaller batch
            name='distraction_detector',
            patience=30,     # Reduced patience
            workers=4,       # Fewer workers
            cache=True,
        )
        best_model_path = model.trainer.best
        print(f"\n✅ Training complete with smaller batch!")
        print(f"   Best model saved at: {best_model_path}")
    except Exception as e2:
        print(f"\n❌ Retry also failed: {e2}")
        input("\nPress Enter to exit...")
        sys.exit(1)

# Step 4: Convert to ONNX
print("\n[4/4] Converting to ONNX format...")
try:
    # Load the best model
    print(f"   Loading best model: {best_model_path}")
    model = YOLO(best_model_path)
    
    # Export to ONNX
    print("   Exporting to ONNX...")
    model.export(format='onnx', imgsz=416)  # Match training size
    
    # Find the ONNX file
    onnx_path = best_model_path.replace('.pt', '.onnx')
    
    if not os.path.exists(onnx_path):
        # Try alternative path
        weights_dir = os.path.dirname(best_model_path)
        onnx_path = os.path.join(weights_dir, 'best.onnx')
        if not os.path.exists(onnx_path):
            # List files in weights directory
            if os.path.exists(weights_dir):
                print(f"\n   Files in {weights_dir}:")
                for f in os.listdir(weights_dir):
                    print(f"     - {f}")
    
    if os.path.exists(onnx_path):
        print(f"✅ ONNX model ready: {onnx_path}")
    else:
        print("⚠️  ONNX file not found in expected location")
        print(f"   Check the folder: {os.path.dirname(best_model_path)}")
        onnx_path = None
    
except Exception as e:
    print(f"❌ ONNX conversion failed: {e}")
    input("\nPress Enter to exit...")
    sys.exit(1)

# Summary
print("\n" + "=" * 60)
print("✅ All done! Next steps:")
print("=" * 60)

if onnx_path and os.path.exists(onnx_path):
    # Get absolute path
    abs_onnx_path = os.path.abspath(onnx_path)
    abs_target = os.path.abspath("public/models/yolov5.onnx")
    
    print(f"\n1. Copy your ONNX model:")
    print(f"   From: {abs_onnx_path}")
    print(f"   To:   {abs_target}")
    print(f"\n   Windows command:")
    print(f"   copy \"{abs_onnx_path}\" \"{abs_target}\"")
    print(f"\n   Or manually copy the file using File Explorer")
else:
    print(f"\n1. Find your ONNX model in: {os.path.dirname(best_model_path)}")
    print(f"   Copy it to: public/models/yolov5.onnx")

print(f"\n2. Open: components/MeetingRoom.tsx")
print(f"   Find line 259: useYOLOv5={{false}}")
print(f"   Change to: useYOLOv5={{true}}")

print(f"\n3. Update class mappings (lines 261-265):")
if classes:
    print(f"   Your classes: {classes}")
    print(f"\n   Suggested mapping:")
    
    normal_classes = [c for c in classes if any(x in c.lower() for x in ['normal', 'attentive', 'focused', 'person'])]
    distracted_classes = [c for c in classes if any(x in c.lower() for x in ['distract', 'phone', 'away'])]
    out_frame_classes = [c for c in classes if any(x in c.lower() for x in ['frame', 'empty', 'no'])]
    
    print(f"   normal: {normal_classes if normal_classes else classes[:1]}")
    print(f"   distracted: {distracted_classes if distracted_classes else classes[1:2] if len(classes) > 1 else []}")
    print(f"   outOfFrame: {out_frame_classes if out_frame_classes else classes[-1:] if classes else []}")
else:
    print(f"   Check your data.yaml file for class names")
    print(f"   Update the yoloClassMappings in MeetingRoom.tsx")

print(f"\n4. Install dependencies and test:")
print(f"   npm install")
print(f"   npm run dev")
print("\n" + "=" * 60)
input("\nPress Enter to exit...")

