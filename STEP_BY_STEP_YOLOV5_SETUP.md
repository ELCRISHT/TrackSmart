# Step-by-Step Guide: Adding Your YOLOv5 Model

## Prerequisites
- You have a trained YOLOv5 model file (`.pt` format)
- Python installed on your computer
- Basic knowledge of terminal/command prompt

---

## Step 1: Install Python Dependencies

Open your terminal/command prompt and run:

```bash
pip install yolov5 onnx torch
```

If you get permission errors, try:
```bash
pip install --user yolov5 onnx torch
```

---

## Step 2: Convert Your Model to ONNX Format

### Option A: Using Python Script (Recommended)

1. Create a new file called `convert_model.py` in any folder (like your Desktop)

2. Copy this code into the file:

```python
from yolov5 import YOLOv5

# Replace 'path/to/your/model.pt' with the actual path to your YOLOv5 model
model_path = 'path/to/your/model.pt'  # CHANGE THIS!

# Load your model
print("Loading model...")
model = YOLOv5(model_path)

# Export to ONNX format
print("Converting to ONNX...")
model.export(format='onnx', imgsz=640)

print("Conversion complete! Check the same folder as your .pt file for yolov5.onnx")
```

3. Edit the file and replace `'path/to/your/model.pt'` with the actual path to your model file.

   For example:
   - Windows: `model_path = r'C:\Users\ASUS\Desktop\my_model.pt'`
   - Mac/Linux: `model_path = '/Users/username/Desktop/my_model.pt'`

4. Run the script:
   ```bash
   python convert_model.py
   ```

5. The converted file `yolov5.onnx` will be created in the same folder as your original `.pt` file.

### Option B: Using Python Interactive Mode

1. Open terminal/command prompt
2. Navigate to the folder containing your model:
   ```bash
   cd path/to/your/model/folder
   ```
3. Run Python:
   ```bash
   python
   ```
4. In Python, type these commands one by one:
   ```python
   from yolov5 import YOLOv5
   model = YOLOv5('your_model.pt')  # Replace with your actual filename
   model.export(format='onnx', imgsz=640)
   exit()
   ```

---

## Step 3: Find Your Converted Model

After conversion, you should have a file named `yolov5.onnx` in the same folder as your original `.pt` file.

**Note the location of this file** - you'll need it in the next step.

---

## Step 4: Place Model in Your Project

1. **Open your project folder** (`trckr`)

2. **Navigate to the `public` folder**:
   - If it doesn't exist, create it in the root of your project
   - Inside `public`, create a folder called `models`

3. **Copy the `yolov5.onnx` file**:
   - Copy your converted `yolov5.onnx` file
   - Paste it into `trckr/public/models/`
   - The full path should be: `trckr/public/models/yolov5.onnx`

### Visual Guide:
```
trckr/
├── public/
│   └── models/
│       └── yolov5.onnx  ← Your model goes here!
├── components/
├── hooks/
└── ...
```

---

## Step 5: Install Project Dependencies

In your project folder (`trckr`), open terminal and run:

```bash
npm install
```

This will install `onnxruntime-web` and other dependencies.

---

## Step 6: Enable YOLOv5 in Your Code

1. **Open** `components/MeetingRoom.tsx`

2. **Find this line** (around line 210):
   ```typescript
   useYOLOv5={false}  // Set to true to use your YOLOv5 model
   ```

3. **Change it to**:
   ```typescript
   useYOLOv5={true}  // Now using your YOLOv5 model
   ```

4. **Update class mappings** (if needed):
   Find the `yoloClassMappings` section and update it to match your model's classes:

   ```typescript
   yoloClassMappings={{
     normal: ['person', 'attentive', 'focused'], // Your normal classes
     distracted: ['phone', 'looking_away', 'distracted'], // Your distraction classes
     outOfFrame: ['no_person', 'empty'], // Your out-of-frame classes
   }}
   ```

   **Important**: Replace these with the actual class names from your trained model!

---

## Step 7: Test It

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and go to your meeting page

3. **Open browser console** (F12 or Right-click → Inspect → Console tab)

4. **Look for this message**:
   ```
   YOLOv5 model loaded successfully
   ```

   If you see this, your model is working! 🎉

---

## Troubleshooting

### Problem: "Cannot find module 'yolov5'"
**Solution**: Install yolov5:
```bash
pip install yolov5
```

### Problem: "Model not loading" in browser
**Solutions**:
1. Check that `public/models/yolov5.onnx` exists
2. Check browser console for errors
3. Make sure the file name is exactly `yolov5.onnx` (case-sensitive)
4. Try clearing browser cache (Ctrl+Shift+Delete)

### Problem: "Failed to load YOLOv5 model"
**Solutions**:
1. Verify the model was converted correctly
2. Check that the model file is not corrupted
3. Try converting again with a different method
4. Check browser console for specific error messages

### Problem: Wrong detections
**Solutions**:
1. Update `yoloClassMappings` to match your model's actual classes
2. Adjust `confidenceThreshold` (try 0.3, 0.5, or 0.7)
3. Verify your model was trained correctly

### Problem: Model too slow
**Solutions**:
1. The system already processes every 5 frames (optimized)
2. Consider using a quantized/smaller model
3. Check if WebGL is enabled (should be automatic)

---

## Quick Checklist

- [ ] Installed Python dependencies (`yolov5`, `onnx`, `torch`)
- [ ] Converted `.pt` model to `.onnx` format
- [ ] Copied `yolov5.onnx` to `public/models/` folder
- [ ] Ran `npm install` in project folder
- [ ] Changed `useYOLOv5={false}` to `useYOLOv5={true}` in `MeetingRoom.tsx`
- [ ] Updated class mappings to match your model
- [ ] Started dev server and checked browser console for success message

---

## Need Help?

If you're stuck:
1. Check the browser console for error messages
2. Verify all file paths are correct
3. Make sure your model was trained with YOLOv5 (not YOLOv8 or other versions)
4. Check that the model input size matches (should be 640x640)

---

## Example: Complete File Structure

After setup, your project should look like:

```
trckr/
├── public/
│   └── models/
│       └── yolov5.onnx          ← Your converted model
├── components/
│   ├── MeetingRoom.tsx          ← Enable YOLOv5 here
│   └── ...
├── hooks/
│   ├── useYOLOv5Detection.ts    ← Detection logic
│   └── ...
└── package.json                  ← Dependencies
```

Good luck! 🚀

