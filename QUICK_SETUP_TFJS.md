# 🚀 Quick Setup: TensorFlow.js (FASTER!)

## Step 1: Convert Your Model

Run this command:

```powershell
python convert_to_tfjs.py
```

This will:
- Convert `yolov5nu.pt` to TensorFlow.js format
- Copy it to `public/models/yolov5/`
- Much faster than ONNX!

## Step 2: Install Dependencies

```powershell
npm install
```

This installs `@tensorflow/tfjs` (replaces ONNX).

## Step 3: Test

```powershell
npm run dev
```

Open browser console (F12) and look for:
```
✅ TensorFlow.js model loaded successfully
   Backend: webgl
```

## ✅ Done!

Your model is now using TensorFlow.js which is:
- ⚡ **Faster** than ONNX
- 🎮 **GPU accelerated** (WebGL backend)
- 🚀 **Optimized** for browser inference

## What Changed

- ✅ Switched from ONNX Runtime to TensorFlow.js
- ✅ Updated detection hook to use TF.js
- ✅ Enabled GPU acceleration (WebGL)
- ✅ Updated class mappings to your classes:
  - Normal → `['Normal']`
  - Distracted → `['Distracted']`
  - Out of Frame → `['Object Deteced']`

## Troubleshooting

**Model not loading?**
- Check: `public/models/yolov5/model.json` exists
- Check: All `.bin` files are in the same folder
- Check: Browser console for errors

**Still slow?**
- Make sure WebGL backend is enabled (check console)
- Reduce inference frequency (already set to every 3 frames)
- Check GPU is available

**Wrong detections?**
- Verify class mappings in `MeetingRoom.tsx` match your model
- Adjust confidence threshold if needed

