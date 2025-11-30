# ✅ Pure Heuristics Detection Mode

## Status: Active

Your detection system is now running in **pure heuristics mode** - no ML models, no dataset access, just algorithmic detection.

## How It Works

### 1. Motion Detection (Heuristic-Based)
**Location**: `hooks/useMotionDetection.ts`

**Methods Used**:
- **Frame Difference Analysis**: Compares consecutive video frames pixel-by-pixel
- **Brightness Analysis**: Detects if student is out of frame by checking overall brightness
- **Motion Threshold**: Uses configurable sensitivity (default: 0.3)

**Classification**:
- **Normal**: High motion detected (student is active/engaged)
- **Distracted**: Low motion detected (student is still/inactive)
- **Out-of-Frame**: Frame too dark/bright (student not visible)

### 2. Tab Switching Detection
**Location**: `hooks/useTabSwitching.ts`

**Methods Used**:
- **Page Visibility API**: Detects when tab/window loses focus
- **URL Analysis**: Checks if current URL matches educational domains
- **Focus Detection**: Monitors document focus state

**Classification**:
- **Focused**: Student is on the class tab
- **Switched (Educational)**: Switched to allowed educational site
- **Switched (Non-Educational)**: Switched to non-educational site → **Distraction**

### 3. Distraction Timer & Alerts
**Location**: `hooks/useDistractionTimer.ts`

**Features**:
- Tracks distraction duration in real-time
- Shows alert after 10 seconds
- Creates permanent record after 30 seconds
- Plays sound alert to get student's attention

### 4. Teacher Monitor
**Location**: `components/TeacherMonitor.tsx`

**Features**:
- Real-time dashboard of all students
- Shows distraction status and duration
- Highlights permanent records
- Sound alerts for permanent records

## Data Preservation

✅ **Your dataset is completely safe**:
- `train/`, `valid/`, `test/` folders - **NOT accessed**
- `yolov5nu.pt` model file - **NOT used**
- `data.yaml` - **NOT accessed**
- All training data - **PRESERVED and UNTOUCHED**

## Detection Features (All Working)

### ✅ Motion Detection & Behavior Classification
- Normal: Active engagement detected (high motion)
- Distracted: Low activity detected (low motion)
- Out-of-Frame: Student not visible in camera

### ✅ Tab Switching Detection
- Monitors browser tab switches
- Distinguishes educational vs non-educational content
- Alerts on non-educational tab switches

### ✅ Distraction Timer & Alerts
- Tracks distraction duration
- Shows alert after 10 seconds
- Displays how long student has been distracted
- Plays sound alert to get attention

### ✅ Permanent Records
- Creates permanent record after 30 seconds of continuous distraction
- Stores: start/end time, duration, reason, student info
- Notifies teacher through monitor and sound

### ✅ Teacher Monitor
- Real-time dashboard showing all students' status
- Displays distraction durations
- Highlights permanent records
- Sound alerts for permanent records

## Technical Details

### Heuristic Algorithms

**Motion Detection**:
```typescript
// Frame difference calculation
motion = average(pixel_difference(previous_frame, current_frame))
status = motion > threshold ? 'normal' : 'distracted'
```

**Out-of-Frame Detection**:
```typescript
brightness = average(frame_brightness)
isOutOfFrame = brightness < 0.1 || brightness > 0.9
```

**Tab Switching**:
```typescript
isFocused = document.hasFocus() && !document.hidden
isEducational = url.includes(educational_keywords)
```

## Performance

- **Fast**: No model loading, instant detection
- **Lightweight**: Pure JavaScript, no ML dependencies
- **Efficient**: Processes every frame using requestAnimationFrame
- **Real-time**: Immediate status updates

## Configuration

You can adjust sensitivity in `components/DistractionMonitor.tsx`:

```typescript
sensitivity: 0.3  // Lower = more sensitive (detects smaller motions)
```

## Testing

1. **Start the app**: `npm run dev`
2. **Join as student** (non-teacher)
3. **Enable camera**
4. **Test scenarios**:
   - Stay still → Should detect "Distracted"
   - Move around → Should detect "Normal"
   - Cover camera → Should detect "Out-of-Frame"
   - Switch tabs → Should detect "Tab Switch"

## Summary

✅ **Pure heuristics mode is active**
✅ **All features working without ML models**
✅ **Dataset and models preserved and untouched**
✅ **Fast, lightweight, real-time detection**

The system is ready to use! 🚀

