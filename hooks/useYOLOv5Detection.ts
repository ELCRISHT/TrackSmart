'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { BehaviorStatus } from './useMotionDetection';

// YOLOv5 Detection Result Interface
interface YOLODetection {
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

interface YOLODetectionResult {
  status: BehaviorStatus;
  confidence: number;
  detections: YOLODetection[];
  timestamp: number;
}

interface UseYOLOv5DetectionOptions {
  enabled: boolean;
  videoElement?: HTMLVideoElement | null;
  modelPath?: string; // Path to your converted YOLOv5 model
  confidenceThreshold?: number; // Minimum confidence for detections
  onStatusChange?: (status: BehaviorStatus) => void;
  // Class mappings - adjust based on your YOLOv5 model classes
  classMappings?: {
    normal?: string[]; // Classes that indicate normal behavior
    distracted?: string[]; // Classes that indicate distraction
    outOfFrame?: string[]; // Classes that indicate out of frame
  };
}

// Default class mappings - adjust these based on your trained model
const DEFAULT_CLASS_MAPPINGS = {
  normal: ['person', 'sitting', 'attentive', 'focused'],
  distracted: ['phone', 'looking_away', 'distracted', 'not_paying_attention'],
  outOfFrame: ['no_person', 'empty'],
};

export const useYOLOv5Detection = ({
  enabled,
  videoElement,
  modelPath = '/models/yolov5.onnx', // Default path - update with your model path
  confidenceThreshold = 0.5,
  onStatusChange,
  classMappings = DEFAULT_CLASS_MAPPINGS,
}: UseYOLOv5DetectionOptions) => {
  const [result, setResult] = useState<YOLODetectionResult>({
    status: 'normal',
    confidence: 1,
    detections: [],
    timestamp: Date.now(),
  });

  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const modelRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastStatusRef = useRef<BehaviorStatus>('normal');

  // Load YOLOv5 model (ONNX format)
  useEffect(() => {
    if (!enabled || modelLoaded || modelLoading) return;

    const loadModel = async () => {
      setModelLoading(true);
      try {
        // Option 1: Using ONNX Runtime (recommended for YOLOv5)
        if (typeof window !== 'undefined') {
          // Dynamically import onnxruntime-web
          const ort = await import('onnxruntime-web');
          
          // Set up WASM backend for better performance
          ort.env.wasm.wasmPaths = '/wasm/';
          
          // Load the model
          const session = await ort.InferenceSession.create(modelPath, {
            executionProviders: ['wasm'], // or 'webgl' for GPU acceleration
          });
          
          modelRef.current = session;
          setModelLoaded(true);
          console.log('YOLOv5 model loaded successfully');
        }
      } catch (error) {
        console.error('Failed to load YOLOv5 model:', error);
        console.log('Falling back to basic motion detection');
        // Fallback: model will remain null, system will use basic detection
      } finally {
        setModelLoading(false);
      }
    };

    loadModel();
  }, [enabled, modelPath, modelLoaded, modelLoading]);

  // Preprocess image for YOLOv5 input
  const preprocessImage = useCallback(
    (canvas: HTMLCanvasElement): Float32Array => {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // YOLOv5 expects input size of 640x640
      const inputSize = 640;
      const tensor = new Float32Array(3 * inputSize * inputSize);

      // Resize and normalize (0-1 range, RGB channels)
      for (let i = 0; i < inputSize * inputSize; i++) {
        const x = Math.floor((i % inputSize) * (canvas.width / inputSize));
        const y = Math.floor((i / inputSize) * (canvas.height / inputSize));
        const idx = (y * canvas.width + x) * 4;

        // Normalize to 0-1 and convert RGB
        tensor[i] = data[idx] / 255.0; // R
        tensor[i + inputSize * inputSize] = data[idx + 1] / 255.0; // G
        tensor[i + 2 * inputSize * inputSize] = data[idx + 2] / 255.0; // B
      }

      return tensor;
    },
    []
  );

  // Postprocess YOLOv5 output
  const postprocessOutput = useCallback(
    (output: any, imgWidth: number, imgHeight: number): YOLODetection[] => {
      const detections: YOLODetection[] = [];
      
      // ONNX Runtime output is a Tensor object
      const outputData = output.data || (output as Float32Array);
      const outputDims = output.dims || output.shape || [];

      // YOLOv5 output format: [batch, num_detections, 85] or [1, 25200, 85]
      // 85 = 4 (bbox) + 1 (objectness) + 80 (classes) or custom classes
      // Adjust based on your model's output shape
      const numDetections = outputDims[1] || 25200; // Default YOLOv5 output
      const numClasses = outputDims[2] ? outputDims[2] - 5 : 80;

      // If output is flat array, reshape it
      const isFlat = outputDims.length === 1;
      const totalElements = numDetections * (5 + numClasses);

      for (let i = 0; i < numDetections && i * (5 + numClasses) < totalElements; i++) {
        const offset = i * (5 + numClasses);
        if (offset + 4 >= outputData.length) break;

        const x = outputData[offset];
        const y = outputData[offset + 1];
        const w = outputData[offset + 2];
        const h = outputData[offset + 3];
        const objectness = outputData[offset + 4];

        if (objectness < confidenceThreshold) continue;

        // Find class with highest confidence
        let maxConf = 0;
        let maxClass = 0;
        for (let j = 0; j < numClasses && (offset + 5 + j) < outputData.length; j++) {
          const conf = outputData[offset + 5 + j] * objectness;
          if (conf > maxConf) {
            maxConf = conf;
            maxClass = j;
          }
        }

        if (maxConf < confidenceThreshold) continue;

        // Convert normalized coordinates to pixel coordinates
        // YOLOv5 outputs center x, center y, width, height (normalized 0-1)
        const bbox: [number, number, number, number] = [
          (x - w / 2) * imgWidth, // x (left)
          (y - h / 2) * imgHeight, // y (top)
          w * imgWidth, // width
          h * imgHeight, // height
        ];

        detections.push({
          class: `class_${maxClass}`, // You'll need to map this to your class names
          confidence: maxConf,
          bbox,
        });
      }

      return detections;
    },
    [confidenceThreshold]
  );

  // Classify behavior based on detections
  const classifyBehavior = useCallback(
    (detections: YOLODetection[]): BehaviorStatus => {
      if (detections.length === 0) {
        return 'out-of-frame';
      }

      // Check for out-of-frame indicators
      const outOfFrameDetections = detections.filter((d) =>
        classMappings.outOfFrame?.some((cls) =>
          d.class.toLowerCase().includes(cls.toLowerCase())
        )
      );
      if (outOfFrameDetections.length > 0) {
        return 'out-of-frame';
      }

      // Check for distraction indicators
      const distractedDetections = detections.filter((d) =>
        classMappings.distracted?.some((cls) =>
          d.class.toLowerCase().includes(cls.toLowerCase())
        )
      );
      if (distractedDetections.length > 0) {
        return 'distracted';
      }

      // Check for normal behavior indicators
      const normalDetections = detections.filter((d) =>
        classMappings.normal?.some((cls) =>
          d.class.toLowerCase().includes(cls.toLowerCase())
        )
      );
      if (normalDetections.length > 0) {
        return 'normal';
      }

      // Default: if person detected but no specific class, assume normal
      const personDetected = detections.some((d) =>
        d.class.toLowerCase().includes('person')
      );
      return personDetected ? 'normal' : 'distracted';
    },
    [classMappings]
  );

  // Run YOLOv5 inference on video frame
  const analyzeFrame = useCallback(async () => {
    if (
      !videoElement ||
      !enabled ||
      !modelRef.current ||
      !modelLoaded ||
      videoElement.readyState < 2
    ) {
      return;
    }

    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = videoElement.videoWidth || 640;
      canvasRef.current.height = videoElement.videoHeight || 480;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) return;

    // Update canvas size if video size changed
    if (
      canvas.width !== videoElement.videoWidth ||
      canvas.height !== videoElement.videoHeight
    ) {
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
    }

    // Draw current frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    try {
      // Preprocess image
      const inputTensor = preprocessImage(canvas);

      // Run inference
      const inputName = modelRef.current.inputNames[0];
      const outputName = modelRef.current.outputNames[0];

      // Create tensor using ONNX Runtime
      const ort = await import('onnxruntime-web');
      const tensor = new ort.Tensor(
        'float32',
        inputTensor,
        [1, 3, 640, 640] // [batch, channels, height, width]
      );

      const results = await modelRef.current.run({
        [inputName]: tensor,
      });

      const output = results[outputName];

      // Postprocess output
      const detections = postprocessOutput(output, canvas.width, canvas.height);

      // Classify behavior
      const status = classifyBehavior(detections);
      const avgConfidence =
        detections.length > 0
          ? detections.reduce((sum, d) => sum + d.confidence, 0) /
            detections.length
          : 0;

      const newResult: YOLODetectionResult = {
        status,
        confidence: avgConfidence,
        detections,
        timestamp: Date.now(),
      };

      setResult(newResult);

      if (lastStatusRef.current !== status && onStatusChange) {
        onStatusChange(status);
      }
      lastStatusRef.current = status;
    } catch (error) {
      console.error('YOLOv5 inference error:', error);
      // Fallback to normal status on error
      setResult({
        status: 'normal',
        confidence: 0.5,
        detections: [],
        timestamp: Date.now(),
      });
    }
  }, [
    videoElement,
    enabled,
    modelLoaded,
    preprocessImage,
    postprocessOutput,
    classifyBehavior,
    onStatusChange,
  ]);

  // Process frames
  useEffect(() => {
    if (!enabled || !videoElement || !modelLoaded) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Process every 5 frames (reduce frequency for performance)
    let frameCount = 0;
    const processFrame = async () => {
      frameCount++;
      if (frameCount % 5 === 0) {
        await analyzeFrame();
      }
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, videoElement, modelLoaded, analyzeFrame]);

  return {
    ...result,
    modelLoaded,
    modelLoading,
  };
};

