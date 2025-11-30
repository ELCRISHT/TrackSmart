"""
YOLOv5 Model Converter Script
Converts your trained YOLOv5 .pt model to ONNX format for use in the browser.

Usage:
1. Install dependencies: pip install yolov5 onnx torch
2. Edit the model_path below to point to your .pt file
3. Run: python convert_model.py
4. Find yolov5.onnx in the same folder as your .pt file
5. Copy it to trckr/public/models/yolov5.onnx
"""

from yolov5 import YOLOv5

# ============================================
# EDIT THIS: Path to your YOLOv5 model file
# ============================================
model_path = 'path/to/your/model.pt'  # CHANGE THIS!

# Example paths:
# Windows: model_path = r'C:\Users\ASUS\Desktop\my_model.pt'
# Mac/Linux: model_path = '/Users/username/Desktop/my_model.pt'

# ============================================
# Don't edit below unless you know what you're doing
# ============================================

def convert_model():
    try:
        print("=" * 50)
        print("YOLOv5 Model Converter")
        print("=" * 50)
        print(f"\nLoading model from: {model_path}")
        
        # Load your model
        model = YOLOv5(model_path)
        
        print("Model loaded successfully!")
        print("\nConverting to ONNX format...")
        print("This may take a few minutes...")
        
        # Export to ONNX format
        model.export(format='onnx', imgsz=640)
        
        print("\n" + "=" * 50)
        print("✅ Conversion complete!")
        print("=" * 50)
        print(f"\nYour ONNX model should be in the same folder as: {model_path}")
        print("Look for a file named: yolov5.onnx")
        print("\nNext steps:")
        print("1. Copy yolov5.onnx to: trckr/public/models/yolov5.onnx")
        print("2. Enable YOLOv5 in components/MeetingRoom.tsx")
        print("3. Update class mappings to match your model")
        
    except FileNotFoundError:
        print(f"\n❌ Error: Could not find model file at: {model_path}")
        print("Please check the path and try again.")
    except Exception as e:
        print(f"\n❌ Error during conversion: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Make sure yolov5 is installed: pip install yolov5")
        print("2. Check that your model file exists")
        print("3. Verify the model is a valid YOLOv5 .pt file")

if __name__ == "__main__":
    if model_path == 'path/to/your/model.pt':
        print("⚠️  Please edit this script and set the model_path variable!")
        print("   Open convert_model.py and change line 15")
    else:
        convert_model()

