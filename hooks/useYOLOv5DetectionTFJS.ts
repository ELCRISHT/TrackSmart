'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl'; // GPU acceleration
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
  modelPath?: string; // Path to your TensorFlow.js model
  confidenceThreshold?: number; // Minimum confidence for detections
  onStatusChange?: (status: BehaviorStatus) => void;
  classMappings?: {
    normal?: string[];
    distracted?: string[];
    outOfFrame?: string[];
  };
}

// Default class mappings
const DEFAULT_CLASS_MAPPINGS = {
  normal: ['Normal'],
  distracted: ['Distracted'],
  outOfFrame: ['Object Deteced'],
};

export const useYOLOv5DetectionTFJS = ({
  enabled,
  videoElement,
  modelPath = '/models/yolov5/model.json', // TensorFlow.js model path
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
  const modelRef = useRef<tf.GraphModel | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastStatusRef = useRef<BehaviorStatus>('normal');
  const processingRef = useRef(false);

  // Load TensorFlow.js model
  useEffect(() => {
    if (!enabled || modelLoaded || modelLoading) return;

    const loadModel = async () => {
      setModelLoading(true);
      try {
        // Set backend to WebGL for GPU acceleration
        await tf.setBackend('webgl');
        await tf.ready();
        
        console.log('Loading TensorFlow.js model...');
        
        // Load the model
        modelRef.current = await tf.loadGraphModel(modelPath);
        
        setModelLoaded(true);
        console.log('✅ TensorFlow.js model loaded successfully');
        console.log(`   Backend: ${tf.getBackend()}`);
      } catch (error) {
        console.error('Failed to load TensorFlow.js model:', error);
        console.log('Falling back to basic motion detection');
        setModelLoaded(false);
      } finally {
        setModelLoading(false);
      }
    };

    loadModel();
  }, [enabled, modelPath, modelLoaded, modelLoading]);

  // Preprocess image for YOLOv5 input
  const preprocessImage = useCallback(
    (canvas: HTMLCanvasElement): tf.Tensor => {
      // YOLOv5 expects input size of 640x640
      const inputSize = 640;
      
      // Resize and normalize
      return tf.tidy(() => {
        // Convert canvas to tensor
        const image = tf.browser.fromPixels(canvas);
        
        // Resize to 640x640
        const resized = tf.image.resizeBilinear(image, [inputSize, inputSize]);
        
        // Normalize to 0-1 range
        const normalized = resized.div(255.0);
        
        // Convert to [1, 640, 640, 3] format
        const batched = normalized.expandDims(0);
        
        // Convert to [1, 3, 640, 640] format (NCHW)
        const transposed = batched.transpose([0, 3, 1, 2]);
        
        return transposed;
      });
    },
    []
  );

  // Postprocess YOLOv5 output
  const postprocessOutput = useCallback(
    (output: tf.Tensor, imgWidth: number, imgHeight: number): YOLODetection[] => {
      const detections: YOLODetection[] = [];
      
      // Get output data
      const outputData = output.dataSync();
      const outputShape = output.shape;
      
      // YOLOv5 output format: [batch, num_detections, 85]
      // 85 = 4 (bbox) + 1 (objectness) + 80 (classes) or custom classes
      const numDetections = outputShape[1] || 25200;
      const numClasses = outputShape[2] ? outputShape[2] - 5 : 80;

      for (let i = 0; i < numDetections && i < 1000; i++) { // Limit to 1000 for performance
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
        const bbox: [number, number, number, number] = [
          (x - w / 2) * imgWidth,
          (y - h / 2) * imgHeight,
          w * imgWidth,
          h * imgHeight,
        ];

        detections.push({
          class: `class_${maxClass}`, // Will be mapped to actual class names
          confidence: maxConf,
          bbox,
        });
      }

      return detections;
    },
    [confidenceThreshold]
  );

  // Map class index to class name based on your model
  const getClassName = useCallback((classIndex: number): string => {
    // Your model classes from data.yaml: ['Distracted', 'Normal', 'Object Deteced']
    const classNames = ['Distracted', 'Normal', 'Object Deteced'];
    if (classIndex >= 0 && classIndex < classNames.length) {
      return classNames[classIndex];
    }
    return `class_${classIndex}`;
  }, []);

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
      return 'normal';
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
      videoElement.readyState < 2 ||
      processingRef.current
    ) {
      return;
    }

    processingRef.current = true;

    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = videoElement.videoWidth || 640;
      canvasRef.current.height = videoElement.videoHeight || 480;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      processingRef.current = false;
      return;
    }

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
      const outputs = modelRef.current.execute(inputTensor) as tf.Tensor;
      
      // Postprocess output
      const detections = postprocessOutput(outputs, canvas.width, canvas.height);
      
      // Map class indices to names
      const detectionsWithNames = detections.map(d => ({
        ...d,
        class: getClassName(parseInt(d.class.replace('class_', ''))),
      }));

      // Classify behavior
      const status = classifyBehavior(detectionsWithNames);
      const avgConfidence =
        detectionsWithNames.length > 0
          ? detectionsWithNames.reduce((sum, d) => sum + d.confidence, 0) /
            detectionsWithNames.length
          : 0;

      const newResult: YOLODetectionResult = {
        status,
        confidence: avgConfidence,
        detections: detectionsWithNames,
        timestamp: Date.now(),
      };

      setResult(newResult);

      if (lastStatusRef.current !== status && onStatusChange) {
        onStatusChange(status);
      }
      lastStatusRef.current = status;

      // Clean up tensors
      inputTensor.dispose();
      outputs.dispose();
    } catch (error) {
      console.error('TensorFlow.js inference error:', error);
      setResult({
        status: 'normal',
        confidence: 0.5,
        detections: [],
        timestamp: Date.now(),
      });
    } finally {
      processingRef.current = false;
    }
  }, [
    videoElement,
    enabled,
    modelLoaded,
    preprocessImage,
    postprocessOutput,
    getClassName,
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

    // Process every 3 frames (reduce frequency for performance)
    let frameCount = 0;
    const processFrame = async () => {
      frameCount++;
      if (frameCount % 3 === 0) {
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

