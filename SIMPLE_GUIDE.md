# 🚀 Simple Guide: Add Your YOLOv5 Model (3 Steps)

## Step 1: Convert Your Model ⚙️

1. **Open terminal/command prompt**

2. **Install Python tools** (one time only):
   ```bash
   pip install yolov5 onnx torch
   ```

3. **Use the converter script I created for you**:
   - Open `convert_model.py` (in your project root)
   - Edit line 15: Change `'path/to/your/model.pt'` to your actual model path
   - Save the file
   - Run: `python convert_model.py`

   **OR** use Python directly:
   ```python
   from yolov5 import YOLOv5
   model = YOLOv5('your_model.pt')  # Your model file
   model.export(format='onnx', imgsz=640)
   ```

4. **Find the new file**: `yolov5.onnx` (in same folder as your .pt file)

---

## Step 2: Copy Model to Project 📁

1. **Create folder** (if it doesn't exist):
   ```
   trckr/public/models/
   ```

2. **Copy your `yolov5.onnx` file** to:
   ```
   trckr/public/models/yolov5.onnx
   ```

   ✅ That's it! The file should be at: `trckr/public/models/yolov5.onnx`

---

## Step 3: Enable It in Code 💻

1. **Open**: `components/MeetingRoom.tsx`

2. **Find line ~248** (look for `useYOLOv5={false}`)

3. **Change**:
   ```typescript
   // BEFORE:
   useYOLOv5={false}
   
   // AFTER:
   useYOLOv5={true}
   ```

4. **Update class names** (around line 250):
   ```typescript
   yoloClassMappings={{
     normal: ['person', 'attentive'],        // Your normal classes
     distracted: ['phone', 'looking_away'],  // Your distraction classes  
     outOfFrame: ['no_person'],             // Your out-of-frame classes
   }}
   ```
   
   ⚠️ **Important**: Replace these with YOUR model's actual class names!

5. **Save the file**

6. **Install dependencies** (if you haven't):
   ```bash
   npm install
   ```

7. **Test it**:
   ```bash
   npm run dev
   ```
   
   Open browser console (F12) and look for: `"YOLOv5 model loaded successfully"`

---

## ✅ Done!

Your YOLOv5 model is now integrated! The system will use it for detection instead of basic motion detection.

---

## 🆘 Quick Troubleshooting

**Model not loading?**
- Check: `public/models/yolov5.onnx` exists
- Check: File name is exactly `yolov5.onnx` (not `YOLOv5.onnx` or `yolov5.ONNX`)
- Check: Browser console for errors

**Wrong detections?**
- Update `yoloClassMappings` with your actual class names
- Check your model was trained correctly

**Still confused?**
- Read the detailed guide: `STEP_BY_STEP_YOLOV5_SETUP.md`

