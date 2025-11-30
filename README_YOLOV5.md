# 📦 How to Add Your YOLOv5 Model - Visual Guide

## 🎯 What You Need
- Your trained YOLOv5 model file (`.pt` format)
- Python installed
- 5 minutes

---

## 📋 Step-by-Step Instructions

### 1️⃣ Convert Your Model

**Option A: Use the Script I Made for You**

1. Open `convert_model.py` in your project
2. Find this line (around line 15):
   ```python
   model_path = 'path/to/your/model.pt'  # CHANGE THIS!
   ```
3. Replace it with your actual model path, for example:
   ```python
   model_path = r'C:\Users\ASUS\Desktop\my_model.pt'  # Windows
   # OR
   model_path = '/Users/username/Desktop/my_model.pt'  # Mac/Linux
   ```
4. Save the file
5. Open terminal in your project folder and run:
   ```bash
   python convert_model.py
   ```
6. You'll get a file called `yolov5.onnx` - remember where it is!

**Option B: Quick Python Method**

Open terminal and type:
```bash
python
```

Then type these commands:
```python
from yolov5 import YOLOv5
model = YOLOv5('C:/path/to/your/model.pt')  # Your actual path
model.export(format='onnx', imgsz=640)
exit()
```

---

### 2️⃣ Copy Model to Project

**Visual Guide:**

```
Your Computer:
📁 Desktop (or wherever your model is)
  └── yolov5.onnx  ← Copy this file

Your Project:
📁 trckr/
  └── 📁 public/
      └── 📁 models/
          └── yolov5.onnx  ← Paste it here!
```

**Steps:**
1. Find your `yolov5.onnx` file (from step 1)
2. Create folder: `trckr/public/models/` (if it doesn't exist)
3. Copy `yolov5.onnx` into `trckr/public/models/`
4. Make sure the full path is: `trckr/public/models/yolov5.onnx`

---

### 3️⃣ Enable It in Code

**Open:** `components/MeetingRoom.tsx`

**Find this section (around line 259):**
```typescript
<DistractionMonitor
  onStatusUpdate={handleStatusUpdate}
  onPermanentRecord={handlePermanentRecord}
  enabled={true}
  useYOLOv5={false}  // ← CHANGE THIS LINE
  yoloModelPath="/models/yolov5.onnx"
  yoloClassMappings={{
    normal: ['person', 'attentive', 'focused'],
    distracted: ['phone', 'looking_away', 'distracted'],
    outOfFrame: ['no_person', 'empty'],
  }}
/>
```

**Change:**
```typescript
useYOLOv5={false}  // BEFORE
```
to:
```typescript
useYOLOv5={true}   // AFTER
```

**Update class names** to match YOUR model:
```typescript
yoloClassMappings={{
  normal: ['your_normal_class1', 'your_normal_class2'],      // Your classes
  distracted: ['your_distraction_class1', 'phone'],        // Your classes
  outOfFrame: ['no_person', 'empty'],                       // Your classes
}}
```

**Save the file!**

---

### 4️⃣ Install & Test

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the app:**
   ```bash
   npm run dev
   ```

3. **Check if it works:**
   - Open browser (go to your meeting page)
   - Press F12 (open developer console)
   - Look for: `"YOLOv5 model loaded successfully"` ✅

---

## ✅ Checklist

Before testing, make sure:

- [ ] Model converted to `.onnx` format
- [ ] File copied to `trckr/public/models/yolov5.onnx`
- [ ] Changed `useYOLOv5={false}` to `useYOLOv5={true}`
- [ ] Updated class mappings with your model's classes
- [ ] Ran `npm install`
- [ ] Started dev server with `npm run dev`

---

## 🆘 Common Issues

### "Cannot find module 'yolov5'"
**Fix:** Install it first
```bash
pip install yolov5
```

### "Model not loading" in browser
**Check:**
- File exists at `public/models/yolov5.onnx`
- File name is exactly `yolov5.onnx` (lowercase, correct extension)
- Browser console for specific errors

### Wrong detections
**Fix:**
- Update `yoloClassMappings` with your actual class names
- Check your model was trained correctly

---

## 📞 Still Need Help?

1. Check browser console (F12) for error messages
2. Verify file paths are correct
3. Make sure model was converted successfully
4. Read detailed guide: `STEP_BY_STEP_YOLOV5_SETUP.md`

---

## 🎉 You're Done!

Once you see "YOLOv5 model loaded successfully" in the console, your model is working! The system will now use your trained YOLOv5 model for accurate distraction detection.

