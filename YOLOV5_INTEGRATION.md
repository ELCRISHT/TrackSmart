# YOLOv5 Integration Guide

This guide explains how to integrate your trained YOLOv5 model into the distraction monitoring system.

## Prerequisites

1. **Trained YOLOv5 Model**: Your `.pt` (PyTorch) model file
2. **Model Conversion**: Convert to ONNX format for browser use

## Step 1: Convert YOLOv5 Model to ONNX

### Option A: Using Python Script

```python
import torch
from yolov5 import YOLOv5

# Load your trained model
model = torch.load('path/to/your/model.pt', map_location='cpu')

# Export to ONNX
model.model.model[-1].export = True  # Enable export mode
torch.onnx.export(
    model,
    torch.zeros(1, 3, 640, 640),  # Dummy input
    'yolov5.onnx',
    opset_version=12,
    input_names=['images'],
    output_names=['output'],
    dynamic_axes={
        'images': {0: 'batch'},
        'output': {0: 'batch'}
    }
)
```

### Option B: Using YOLOv5 Export Function

```python
from yolov5 import YOLOv5

# Load model
model = YOLOv5('path/to/your/model.pt')

# Export to ONNX
model.export(format='onnx', imgsz=640)
```

## Step 2: Install Dependencies

```bash
npm install onnxruntime-web
```

Or if you prefer TensorFlow.js:

```bash
npm install @tensorflow/tfjs
```

## Step 3: Place Model Files

1. Create a `public/models/` directory
2. Place your `yolov5.onnx` file in `public/models/`
3. If using ONNX Runtime, download WASM files:

```bash
# Download ONNX Runtime WASM files
mkdir -p public/wasm
# Download from: https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/
```

## Step 4: Configure Class Mappings

Update the class mappings in `hooks/useYOLOv5Detection.ts` to match your trained model's classes:

```typescript
const DEFAULT_CLASS_MAPPINGS = {
  normal: ['person', 'sitting', 'attentive', 'focused'], // Your normal classes
  distracted: ['phone', 'looking_away', 'distracted'], // Your distraction classes
  outOfFrame: ['no_person', 'empty'], // Your out-of-frame classes
};
```

## Step 5: Update DistractionMonitor

Update `components/DistractionMonitor.tsx` to use YOLOv5 instead of basic motion detection:

```typescript
import { useYOLOv5Detection } from '@/hooks/useYOLOv5Detection';

// Replace useMotionDetection with:
const yoloResult = useYOLOv5Detection({
  enabled,
  videoElement: videoRef.current || undefined,
  modelPath: '/models/yolov5.onnx', // Your model path
  confidenceThreshold: 0.5,
  classMappings: {
    normal: ['person', 'attentive'],
    distracted: ['phone', 'looking_away'],
    outOfFrame: ['no_person'],
  },
  onStatusChange: (status) => {
    // Handle status changes
  },
});
```

## Step 6: Model Optimization (Optional)

For better performance, consider:

1. **Quantization**: Reduce model size
```python
# Quantize model
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

quantize_dynamic(
    'yolov5.onnx',
    'yolov5_quantized.onnx',
    weight_type=QuantType.QUInt8
)
```

2. **Model Pruning**: Remove unnecessary weights
3. **Use GPU**: Enable WebGL backend for faster inference

## Alternative: TensorFlow.js Conversion

If you prefer TensorFlow.js:

```python
import tensorflowjs as tfjs

# Convert ONNX to TensorFlow.js
tfjs.converters.convert_onnx('yolov5.onnx', 'public/models/yolov5_tfjs')
```

Then update the hook to use TensorFlow.js instead of ONNX Runtime.

## Performance Tips

1. **Reduce Inference Frequency**: Process every 5-10 frames instead of every frame
2. **Lower Input Resolution**: Use 416x416 instead of 640x640 if acceptable
3. **Use Web Workers**: Run inference in a separate thread
4. **Enable GPU**: Use WebGL backend for ONNX Runtime

## Troubleshooting

### Model Not Loading
- Check model path is correct
- Ensure ONNX Runtime WASM files are available
- Check browser console for errors

### Low Performance
- Reduce inference frequency
- Use quantized model
- Enable GPU acceleration
- Reduce input resolution

### Incorrect Detections
- Adjust confidence threshold
- Update class mappings
- Verify model was trained correctly
- Check preprocessing matches training

## Example Model Structure

Your YOLOv5 model should detect classes like:
- `person` - Normal student presence
- `phone` - Phone usage (distraction)
- `looking_away` - Not paying attention (distraction)
- `no_person` - Out of frame
- `attentive` - Normal, engaged behavior

Adjust these based on your specific training data.

