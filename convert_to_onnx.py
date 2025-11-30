"""
Quick script to convert your trained YOLOv5 model to ONNX
"""

from ultralytics import YOLO
import os

print("=" * 60)
print("Converting Trained Model to ONNX")
print("=" * 60)

# Your trained model
model_path = 'yolov5nu.pt'

if not os.path.exists(model_path):
    print(f"❌ Model not found: {model_path}")
    input("Press Enter to exit...")
    exit(1)

print(f"✅ Found model: {model_path}")
print("\n📦 Converting to ONNX...")

try:
    # Load your trained model
    model = YOLO(model_path)
    
    # Export to ONNX
    # Use imgsz=640 (standard) or check what size you trained with
    model.export(format='onnx', imgsz=640)
    
    # Find the ONNX file
    onnx_path = model_path.replace('.pt', '.onnx')
    
    if os.path.exists(onnx_path):
        print(f"✅ ONNX model created: {onnx_path}")
        
        # Copy to public/models
        import shutil
        target_dir = 'public/models'
        os.makedirs(target_dir, exist_ok=True)
        target_path = os.path.join(target_dir, 'yolov5.onnx')
        
        shutil.copy2(onnx_path, target_path)
        print(f"✅ Copied to: {target_path}")
        
        print("\n" + "=" * 60)
        print("✅ Conversion complete!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. ✅ Model is ready at: public/models/yolov5.onnx")
        print("2. Open components/MeetingRoom.tsx")
        print("3. Change useYOLOv5={false} to useYOLOv5={true}")
        print("4. Update class mappings (see below)")
        print("\nYour classes:")
        print("  - Distracted")
        print("  - Normal")
        print("  - Object Deteced")
        print("\nUpdate yoloClassMappings to:")
        print("  yoloClassMappings={{")
        print("    normal: ['Normal'],")
        print("    distracted: ['Distracted'],")
        print("    outOfFrame: ['Object Deteced'],")
        print("  }}")
        
    else:
        print(f"⚠️  ONNX file not found at: {onnx_path}")
        print("   Check the current directory for .onnx files")
        
except Exception as e:
    print(f"❌ Conversion failed: {e}")
    import traceback
    traceback.print_exc()

input("\nPress Enter to exit...")

