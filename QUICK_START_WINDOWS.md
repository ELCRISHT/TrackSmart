# 🚀 Quick Start: Train YOLOv5 on Windows

## Step 1: Install Ultralytics

Open PowerShell or Command Prompt in your project folder and run:

```powershell
pip install ultralytics
```

If that doesn't work, try:
```powershell
python -m pip install ultralytics
```

Wait for installation to complete.

---

## Step 2: Run the Training Script

In the same terminal, run:

```powershell
python train_and_convert_windows.py
```

**What it does:**
1. ✅ Downloads your Roboflow dataset automatically
2. ✅ Extracts it
3. ✅ Trains a YOLOv5 model (takes 30 min - several hours)
4. ✅ Converts to ONNX format
5. ✅ Shows you where the model is

**Just wait!** The script will show progress and tell you when it's done.

---

## Step 3: Copy Model to Project

After training completes, the script will show you the path to your ONNX model.

**Copy it to:**
```
trckr/public/models/yolov5.onnx
```

**Windows command:**
```powershell
copy "path\to\best.onnx" "public\models\yolov5.onnx"
```

Or just use File Explorer to copy the file.

---

## Step 4: Enable in Code

1. Open `components/MeetingRoom.tsx`
2. Find line 259: `useYOLOv5={false}`
3. Change to: `useYOLOv5={true}`
4. Update class mappings (lines 261-265) with your actual class names
5. Save

---

## Step 5: Test

```powershell
npm install
npm run dev
```

Open browser console (F12) and look for: `"YOLOv5 model loaded successfully"`

---

## ⚠️ Important Notes

- **Training takes time**: 30 minutes to several hours depending on your computer
- **GPU is faster**: If you have an NVIDIA GPU, it will use it automatically
- **CPU works too**: Just slower
- **Don't close the terminal**: Let training finish

---

## 🆘 Troubleshooting

**"ultralytics not installed"**
- Run: `pip install ultralytics`

**"CUDA out of memory"**
- The script will automatically retry with smaller batch size
- Or edit the script and change `batch=16` to `batch=4`

**Training too slow?**
- This is normal on CPU
- Consider using Google Colab (free GPU) for faster training

**Model not found?**
- Check the `runs/detect/distraction_detector/weights/` folder
- Look for `best.onnx` file

---

## ✅ That's It!

Once you see "YOLOv5 model loaded successfully" in the browser console, you're done! 🎉

