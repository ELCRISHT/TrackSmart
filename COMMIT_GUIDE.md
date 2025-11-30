# 📦 Commit Guide - Only Necessary Files

## ✅ Files to Commit (Core Application)

### Essential Files (MUST commit):
```bash
# Core components
components/DistractionMonitor.tsx
components/DistractionAlert.tsx
components/TeacherMonitor.tsx
components/MeetingRoom.tsx

# Hooks
hooks/useMotionDetection.ts
hooks/useTabSwitching.ts
hooks/useDistractionTimer.ts
hooks/useStudentStatusBroadcast.ts

# Server actions
actions/distraction.actions.ts

# Configuration
package.json
package-lock.json
.gitignore
```

### Documentation (Optional - but recommended):
```bash
# Main documentation
DISTRACTION_MONITORING.md
PURE_HEURISTICS_MODE.md

# Optional guides (you can skip these if you want)
# All other .md files
```

### Training Scripts (Optional):
```bash
# You can skip these if you don't want them in repo
# convert_model.py
# convert_to_onnx.py
# convert_to_tfjs.py
# train_and_convert*.py
# RUN_THIS.py
# check_detection_setup.js
```

## ❌ Files NOT to Commit (Already Ignored)

These are automatically ignored by `.gitignore`:
- `/train/` - Dataset training images (15,564 files)
- `/valid/` - Dataset validation images (1,104 files)
- `/test/` - Dataset test images (1,113 files)
- `*.pt` - Model files
- `*.onnx` - ONNX models
- `/runs/` - Training outputs
- `data.yaml` - Dataset config

## 🚀 Quick Commit Commands

### Option 1: Commit Everything (Recommended)
```bash
# Add all necessary files (dataset already ignored)
git add .

# Check what will be committed
git status

# Commit
git commit -m "Add distraction monitoring system with pure heuristics detection"
```

### Option 2: Commit Only Core Files
```bash
# Add only essential files
git add components/DistractionMonitor.tsx
git add components/DistractionAlert.tsx
git add components/TeacherMonitor.tsx
git add components/MeetingRoom.tsx
git add hooks/useMotionDetection.ts
git add hooks/useTabSwitching.ts
git add hooks/useDistractionTimer.ts
git add hooks/useStudentStatusBroadcast.ts
git add actions/distraction.actions.ts
git add package.json
git add package-lock.json
git add .gitignore

# Optional: Add documentation
git add DISTRACTION_MONITORING.md
git add PURE_HEURISTICS_MODE.md

# Commit
git commit -m "Add distraction monitoring system with pure heuristics detection"
```

### Option 3: Interactive Add (Choose files)
```bash
# Add files interactively
git add -i

# Then commit
git commit -m "Add distraction monitoring system"
```

## ✅ Verify Before Committing

```bash
# See what will be committed
git status

# See file count
git status --short | Measure-Object -Line

# Should show ~30-40 files, NOT 10,000+
```

## 📝 Recommended Commit Message

```
Add distraction monitoring system with pure heuristics detection

Features:
- Motion detection using frame difference analysis
- Tab switching detection with educational content filtering
- Distraction timer with alerts (10s alert, 30s permanent record)
- Teacher monitor dashboard for real-time student status
- Sound alerts for distractions
- Permanent record storage

Uses pure heuristics only - no ML models required.
```

## ⚠️ Important Notes

1. **Dataset is safe** - Already in `.gitignore`, won't be committed
2. **Model files are safe** - Already in `.gitignore`, won't be committed
3. **Only code files** - Only your application code will be committed
4. **~30-40 files** - Not 10,000+ files

## 🎯 Quick Start

Just run:
```bash
git add .
git status  # Verify only ~30-40 files
git commit -m "Add distraction monitoring system with pure heuristics detection"
```

Done! ✅


