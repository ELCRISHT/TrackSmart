# 🎯 START HERE: Add Your YOLOv5 Model

## Quick 3-Step Process

### Step 1: Convert Model (2 minutes)

**Install Python tools:**
```bash
pip install yolov5 onnx torch
```

**Convert your model:**
- Open `convert_model.py` in this project
- Edit line 15: Put your model file path
- Run: `python convert_model.py`
- You'll get `yolov5.onnx` file

**OR use Python directly:**
```python
from yolov5 import YOLOv5
model = YOLOv5('your_model_file.pt')
model.export(format='onnx', imgsz=640)
```

---

### Step 2: Copy File (30 seconds)

Copy `yolov5.onnx` to:
```
trckr/public/models/yolov5.onnx
```

✅ The `models` folder already exists, just copy your file there!

---

### Step 3: Enable It (1 minute)

1. Open `components/MeetingRoom.tsx`
2. Find line 259: `useYOLOv5={false}`
3. Change to: `useYOLOv5={true}`
4. Update the class names (lines 261-265) to match YOUR model
5. Save file
6. Run: `npm install` then `npm run dev`

---

## ✅ Test It

Open browser console (F12) and look for:
```
YOLOv5 model loaded successfully
```

If you see this, it's working! 🎉

---

## 📚 Need More Details?

- **Simple guide:** `SIMPLE_GUIDE.md`
- **Detailed guide:** `STEP_BY_STEP_YOLOV5_SETUP.md`
- **Full documentation:** `README_YOLOV5.md`

---

## 🆘 Quick Help

**Model not loading?**
- Check: `public/models/yolov5.onnx` exists
- Check: Browser console for errors
- Check: File name is exactly `yolov5.onnx`

**Wrong detections?**
- Update class mappings in `MeetingRoom.tsx`
- Make sure class names match your trained model

