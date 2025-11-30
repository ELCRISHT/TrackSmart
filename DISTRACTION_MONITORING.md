# Distraction Monitoring System

This document describes the motion detection and distraction monitoring system integrated into the online class tracking application.

## Features

### 1. **Motion Detection & Behavior Classification**
- **Normal**: Student is actively engaged (detected motion/activity)
- **Distracted**: Low activity detected (minimal motion)
- **Out-of-Frame**: Student is not visible in camera frame

### 2. **Tab Switching Detection**
- Monitors when students switch browser tabs
- Distinguishes between educational and non-educational content
- Alerts on non-educational tab switches

### 3. **Distraction Timer & Alerts**
- Tracks how long a student has been distracted
- Shows alert after 10 seconds of distraction
- Displays distraction duration to the student
- Plays sound alert to get student's attention

### 4. **Permanent Records**
- Creates permanent record after 30 seconds of continuous distraction
- Records include:
  - Start/end time
  - Duration
  - Reason (motion, tab-switch, or out-of-frame)
  - Student information

### 5. **Teacher Monitor**
- Real-time view of all students' status
- Shows which students are distracted
- Displays distraction duration
- Highlights permanent records
- Sound alerts for permanent records

## Architecture

### Components

1. **`DistractionMonitor`** (`components/DistractionMonitor.tsx`)
   - Main monitoring component for students
   - Integrates motion detection, tab switching, and frame detection
   - Manages alerts and permanent records

2. **`TeacherMonitor`** (`components/TeacherMonitor.tsx`)
   - Dashboard for teachers to monitor all students
   - Shows real-time status updates
   - Displays permanent records

3. **`DistractionAlert`** (`components/DistractionAlert.tsx`)
   - Alert component shown to distracted students
   - Displays distraction duration and reason

### Hooks

1. **`useMotionDetection`** (`hooks/useMotionDetection.ts`)
   - Analyzes video frames for motion
   - Detects if student is out of frame
   - Classifies behavior as Normal/Distracted/Out-of-Frame

2. **`useTabSwitching`** (`hooks/useTabSwitching.ts`)
   - Monitors browser tab visibility
   - Detects tab switches
   - Classifies URLs as educational or non-educational

3. **`useDistractionTimer`** (`hooks/useDistractionTimer.ts`)
   - Tracks distraction duration
   - Manages alert and permanent record thresholds
   - Handles distraction start/stop events

4. **`useStudentStatusBroadcast`** (`hooks/useStudentStatusBroadcast.ts`)
   - Broadcasts student status to teacher
   - Uses localStorage as fallback for status sharing

### Server Actions

1. **`distraction.actions.ts`**
   - `createDistractionRecord`: Creates permanent distraction records
   - `getDistractionRecords`: Retrieves distraction records
   - `getPermanentDistractionRecords`: Gets only permanent records

## Configuration

### Educational URLs
The system recognizes educational content based on keywords. To add more educational domains, edit `hooks/useTabSwitching.ts`:

```typescript
const EDUCATIONAL_KEYWORDS = [
  'google.com',
  'youtube.com',
  'khanacademy.org',
  // Add more domains here
];
```

### Thresholds
Adjust distraction thresholds in `components/DistractionMonitor.tsx`:

```typescript
distractionThreshold: 30, // seconds before permanent record
alertThreshold: 10, // seconds before showing alert
```

### Motion Sensitivity
Adjust motion detection sensitivity in `components/DistractionMonitor.tsx`:

```typescript
sensitivity: 0.3, // Lower = more sensitive (0-1)
```

## Usage

### For Students
The distraction monitoring is automatically active when joining a meeting as a student (non-teacher). Students will:
- See alerts when distracted
- Hear sound alerts
- Have their behavior tracked

### For Teachers
Teachers (meeting creators) will see the Teacher Monitor panel showing:
- All students' current status
- Distraction durations
- Permanent records
- Sound alerts for permanent records

## Extending the System

### Multi-Student Status Sharing
Currently, status sharing uses localStorage as a fallback. For production, consider:

1. **Stream.io Custom Events**: Use Stream's event system for real-time updates
2. **Backend API**: Create an API endpoint to store and retrieve student statuses
3. **WebSocket**: Implement WebSocket connection for real-time status updates
4. **Stream Reactions**: Use Stream's reaction system to broadcast status

### Database Integration
The current implementation uses in-memory storage. To persist records:

1. Set up a database (PostgreSQL, MongoDB, etc.)
2. Update `actions/distraction.actions.ts` to use database queries
3. Add database schema for distraction records

### Advanced Motion Detection
For more accurate detection, consider:

1. **TensorFlow.js**: Use ML models for pose detection
2. **MediaPipe**: Use Google's MediaPipe for face/pose detection
3. **Cloud Vision API**: Use cloud-based vision APIs for analysis

## Browser Compatibility

- Requires camera/microphone permissions
- Uses Web Audio API for sound alerts
- Uses Canvas API for video frame analysis
- Modern browsers (Chrome, Firefox, Safari, Edge)

## Privacy Considerations

- All monitoring happens client-side
- No video data is sent to servers (only status metadata)
- Students are notified when being monitored
- Permanent records only store metadata, not video

## Troubleshooting

### Video Element Not Found
If motion detection isn't working:
1. Ensure camera is enabled
2. Check browser permissions
3. Verify video element exists in DOM
4. Check browser console for errors

### Tab Switching Not Detected
- Ensure page visibility API is supported
- Check browser permissions
- Verify educational URL list is correct

### Status Not Updating for Teacher
- Check localStorage is enabled
- Verify student is broadcasting status
- Check browser console for errors
- Consider implementing backend solution for production

