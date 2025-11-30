"""
Convert your trained YOLOv5 model to TensorFlow.js format
Much faster than ONNX!

NOTE: This script only converts the model file.
It does NOT remove or modify your dataset (train/valid/test folders).
Your dataset will remain untouched and can be used for future training.
"""

from ultralytics import YOLO
import os
import shutil

print("=" * 60)
print("Converting to TensorFlow.js (FASTER!)")
print("=" * 60)
print("\n⚠️  NOTE: Your dataset (train/valid/test folders) will NOT be removed.")
print("   Only the model file is being converted.\n")

# Your trained model
model_path = 'yolov5nu.pt'

if not os.path.exists(model_path):
    print(f"❌ Model not found: {model_path}")
    input("Press Enter to exit...")
    exit(1)

print(f"✅ Found model: {model_path}")
print("\n📦 Converting to TensorFlow.js...")
print("   This format is faster than ONNX!")

try:
    # Load your trained model
    model = YOLO(model_path)
    
    # Export to TensorFlow.js format
    model.export(format='tfjs', imgsz=640)
    
    # Find the TensorFlow.js model folder
    # Ultralytics creates a folder with model.json and shards
    tfjs_folder = model_path.replace('.pt', '_tfjs')
    
    if not os.path.exists(tfjs_folder):
        # Try alternative naming
        tfjs_folder = model_path.replace('.pt', '_web_model')
    
    if os.path.exists(tfjs_folder):
        print(f"✅ TensorFlow.js model created: {tfjs_folder}")
        
        # Copy to public/models/yolov5
        target_dir = 'public/models/yolov5'
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)
        os.makedirs(target_dir, exist_ok=True)
        
        # Copy all files from tfjs_folder to target_dir
        for item in os.listdir(tfjs_folder):
            s = os.path.join(tfjs_folder, item)
            d = os.path.join(target_dir, item)
            if os.path.isdir(s):
                shutil.copytree(s, d, dirs_exist_ok=True)
            else:
                shutil.copy2(s, d)
        
        print(f"✅ Copied to: {target_dir}")
        print(f"   Model file: {target_dir}/model.json")
        
        print("\n" + "=" * 60)
        print("✅ Conversion complete!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. ✅ Model is ready at: public/models/yolov5/model.json")
        print("2. Run: npm install")
        print("3. The code is already updated to use TensorFlow.js!")
        print("4. Test with: npm run dev")
        
    else:
        print(f"⚠️  TensorFlow.js folder not found")
        print(f"   Looking for: {tfjs_folder}")
        print("   Check current directory for *_tfjs or *_web_model folders")
        
except Exception as e:
    print(f"❌ Conversion failed: {e}")
    import traceback
    traceback.print_exc()

input("\nPress Enter to exit...")

