# Quick Start: Using Your YOLOv5 Model

## Step 1: Convert Your Model

Convert your trained YOLOv5 `.pt` file to ONNX format:

```python
# Install dependencies
pip install yolov5 onnx

# Convert model
from yolov5 import YOLOv5

model = YOLOv5('path/to/your/model.pt')
model.export(format='onnx', imgsz=640)
```

This will create `yolov5.onnx` in your model directory.

## Step 2: Place Model in Project

1. Copy `yolov5.onnx` to `public/models/yolov5.onnx`

## Step 3: Install Dependencies

```bash
npm install onnxruntime-web
```

## Step 4: Enable YOLOv5 in MeetingRoom

Edit `components/MeetingRoom.tsx` and change:

```typescript
useYOLOv5={false}  // Change to true
```

## Step 5: Configure Class Mappings

Update the class mappings in `components/MeetingRoom.tsx` to match your model's classes:

```typescript
yoloClassMappings={{
  normal: ['person', 'attentive'], // Your normal classes
  distracted: ['phone', 'looking_away'], // Your distraction classes
  outOfFrame: ['no_person'], // Your out-of-frame classes
}}
```

## Step 6: Test

1. Start the dev server: `npm run dev`
2. Join a meeting as a student
3. Check browser console for "YOLOv5 model loaded successfully"
4. The system will now use your trained model for detection!

## Troubleshooting

### Model Not Loading
- Check that `public/models/yolov5.onnx` exists
- Check browser console for errors
- Verify model was converted correctly

### Wrong Detections
- Update class mappings to match your model
- Adjust confidence threshold (default: 0.5)
- Verify your model was trained correctly

### Performance Issues
- Model processes every 5 frames (already optimized)
- Consider using quantized model for better performance
- Enable GPU acceleration (WebGL) - already configured

