# PowerShell script to commit only necessary files
# Run with: .\commit_changes.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Committing Distraction Monitoring System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Add core components
Write-Host "Adding core components..." -ForegroundColor Yellow
git add components/DistractionMonitor.tsx
git add components/DistractionAlert.tsx
git add components/TeacherMonitor.tsx
git add components/MeetingRoom.tsx

# Step 2: Add hooks
Write-Host "Adding hooks..." -ForegroundColor Yellow
git add hooks/useMotionDetection.ts
git add hooks/useTabSwitching.ts
git add hooks/useDistractionTimer.ts
git add hooks/useStudentStatusBroadcast.ts

# Step 3: Add actions
Write-Host "Adding server actions..." -ForegroundColor Yellow
git add actions/distraction.actions.ts

# Step 4: Add config files
Write-Host "Adding configuration..." -ForegroundColor Yellow
git add package.json
git add package-lock.json
git add .gitignore

# Step 5: Add main documentation (optional)
Write-Host "Adding documentation..." -ForegroundColor Yellow
git add DISTRACTION_MONITORING.md
git add PURE_HEURISTICS_MODE.md

# Step 6: Show what will be committed
Write-Host ""
Write-Host "Files to be committed:" -ForegroundColor Green
git status --short

# Step 7: Ask for confirmation
Write-Host ""
$confirm = Read-Host "Commit these files? (y/n)"
if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    git commit -m "Add distraction monitoring system with pure heuristics detection

Features:
- Motion detection using frame difference analysis
- Tab switching detection with educational content filtering
- Distraction timer with alerts (10s alert, 30s permanent record)
- Teacher monitor dashboard for real-time student status
- Sound alerts for distractions
- Permanent record storage

Uses pure heuristics only - no ML models required."
    Write-Host ""
    Write-Host "✅ Commit successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Commit cancelled" -ForegroundColor Red
}


