# 📁 Dataset Information

## Your Dataset Location

Your dataset is stored in these folders:
- `train/` - Training images and labels (15,564 images)
- `valid/` - Validation images and labels (1,104 images)  
- `test/` - Test images and labels (1,113 images)
- `data.yaml` - Dataset configuration file

## Important Notes

✅ **Your dataset is SAFE** - It will NOT be removed by any script
✅ **Dataset is only used for training** - Not needed for detection/inference
✅ **Keep it for future training** - You can retrain or fine-tune anytime

## What Gets Used for Detection?

For **detection/inference** (when the app is running), you only need:
- ✅ The trained model file: `yolov5nu.pt`
- ✅ The converted TensorFlow.js model: `public/models/yolov5/model.json`

The dataset folders (`train/`, `valid/`, `test/`) are **NOT used** during detection.
They are only needed when training a new model.

## File Structure

```
trckr/
├── train/          ← Dataset (KEEP THIS - used for training only)
├── valid/          ← Dataset (KEEP THIS - used for training only)
├── test/           ← Dataset (KEEP THIS - used for training only)
├── data.yaml       ← Dataset config (KEEP THIS)
├── yolov5nu.pt     ← Trained model (used for conversion)
└── public/
    └── models/
        └── yolov5/  ← TensorFlow.js model (used for detection)
            ├── model.json
            └── *.bin files
```

## What Scripts Do

### `convert_to_tfjs.py`
- ✅ Converts `yolov5nu.pt` → TensorFlow.js format
- ✅ Copies converted model to `public/models/yolov5/`
- ❌ Does NOT touch your dataset folders
- ❌ Does NOT remove anything

### Training Scripts
- ✅ Use your dataset for training
- ✅ Create new model files
- ❌ Do NOT remove your original dataset

## Summary

**Your dataset is completely safe!** 
- All scripts preserve your dataset
- Dataset is only used for training (not detection)
- You can keep it for future use
- No script will delete it

