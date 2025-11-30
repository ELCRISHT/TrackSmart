/**
 * Check if detection setup is correct
 * Run with: node check_detection_setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('Detection Setup Check');
console.log('='.repeat(60));

let allGood = true;

// Check 1: Model file exists
console.log('\n[1] Checking trained model...');
const modelPath = path.join(__dirname, 'yolov5nu.pt');
if (fs.existsSync(modelPath)) {
  console.log('✅ Found: yolov5nu.pt');
} else {
  console.log('❌ Missing: yolov5nu.pt');
  allGood = false;
}

// Check 2: TensorFlow.js model exists
console.log('\n[2] Checking TensorFlow.js model...');
const tfjsModelPath = path.join(__dirname, 'public', 'models', 'yolov5', 'model.json');
if (fs.existsSync(tfjsModelPath)) {
  console.log('✅ Found: public/models/yolov5/model.json');
  
  // Check for .bin files
  const modelDir = path.dirname(tfjsModelPath);
  const files = fs.readdirSync(modelDir);
  const binFiles = files.filter(f => f.endsWith('.bin'));
  if (binFiles.length > 0) {
    console.log(`✅ Found ${binFiles.length} weight file(s)`);
  } else {
    console.log('⚠️  No .bin weight files found');
  }
} else {
  console.log('❌ Missing: public/models/yolov5/model.json');
  console.log('   Run: python convert_to_tfjs.py');
  allGood = false;
}

// Check 3: Package.json has TensorFlow.js
console.log('\n[3] Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.dependencies['@tensorflow/tfjs']) {
  console.log('✅ @tensorflow/tfjs is in package.json');
} else {
  console.log('❌ @tensorflow/tfjs not found in package.json');
  console.log('   Run: npm install');
  allGood = false;
}

// Check 4: Code configuration
console.log('\n[4] Checking code configuration...');
const meetingRoomPath = path.join(__dirname, 'components', 'MeetingRoom.tsx');
const meetingRoomCode = fs.readFileSync(meetingRoomPath, 'utf8');
if (meetingRoomCode.includes('useYOLOv5={true}')) {
  console.log('✅ YOLOv5 is enabled in MeetingRoom.tsx');
} else {
  console.log('❌ YOLOv5 is not enabled');
  allGood = false;
}

if (meetingRoomCode.includes('/models/yolov5/model.json')) {
  console.log('✅ Model path is correct');
} else {
  console.log('⚠️  Model path might be incorrect');
}

// Check 5: Class mappings
if (meetingRoomCode.includes("normal: ['Normal']")) {
  console.log('✅ Class mappings look correct');
} else {
  console.log('⚠️  Check class mappings');
}

// Summary
console.log('\n' + '='.repeat(60));
if (allGood) {
  console.log('✅ All checks passed! Detection should work.');
  console.log('\nNext steps:');
  console.log('1. npm install (if not done)');
  console.log('2. npm run dev');
  console.log('3. Open browser console and look for:');
  console.log('   "✅ TensorFlow.js model loaded successfully"');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  console.log('\nQuick fixes:');
  if (!fs.existsSync(tfjsModelPath)) {
    console.log('- Convert model: python convert_to_tfjs.py');
  }
  if (!packageJson.dependencies['@tensorflow/tfjs']) {
    console.log('- Install: npm install');
  }
}
console.log('='.repeat(60));

