import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

class AIDetectionService {
  constructor() {
    this.objectModel = null;
    this.faceMesh = null;
    this.isInitialized = false;
    this.lastFaceDetectionTime = 0;
    this.lastObjectDetectionTime = 0;
    this.focusTrackingActive = false;
    
    // Detection thresholds
    this.faceConfidenceThreshold = 0.5;
    this.objectConfidenceThreshold = 0.6;
    this.focusTimeoutThreshold = 5000; // 5 seconds
    this.faceAbsenceThreshold = 10000; // 10 seconds
    
    // State tracking
    this.currentFaceCount = 0;
    this.isFacePresent = false;
    this.isFocused = true;
    this.lastFocusLossTime = 0;
    this.lastFaceDetectedTime = Date.now();
    
    // Detected objects cache
    this.detectedObjects = [];
    this.suspiciousObjects = ['cell phone', 'book', 'laptop', 'tablet'];
  }

  async initialize() {
    try {
      console.log('Initializing AI Detection Service...');
      
      // Initialize TensorFlow.js
      await tf.ready();
      console.log('TensorFlow.js initialized');

      // Load COCO-SSD model for object detection
      this.objectModel = await cocoSsd.load();
      console.log('Object detection model loaded');

      // Initialize MediaPipe Face Mesh
      this.faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      this.faceMesh.setOptions({
        maxNumFaces: 3,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.isInitialized = true;
      console.log('AI Detection Service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize AI Detection Service:', error);
      throw error;
    }
  }

  // Face Detection using MediaPipe
  async detectFaces(videoElement, onResults) {
    if (!this.isInitialized || !this.faceMesh) {
      console.warn('AI Detection Service not initialized');
      return { faceCount: 0, isFacePresent: false };
    }

    try {
      this.faceMesh.onResults((results) => {
        const faceCount = results.multiFaceLandmarks?.length || 0;
        const isFacePresent = faceCount > 0;
        
        this.currentFaceCount = faceCount;
        this.isFacePresent = isFacePresent;
        
        if (isFacePresent) {
          this.lastFaceDetectedTime = Date.now();
        }

        // Call the callback with results
        if (onResults) {
          onResults({
            faceCount,
            isFacePresent,
            landmarks: results.multiFaceLandmarks,
            timestamp: Date.now()
          });
        }
      });

      // Send frame to MediaPipe
      await this.faceMesh.send({ image: videoElement });
      
      return {
        faceCount: this.currentFaceCount,
        isFacePresent: this.isFacePresent
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return { faceCount: 0, isFacePresent: false };
    }
  }

  // Object Detection using COCO-SSD
  async detectObjects(videoElement) {
    if (!this.isInitialized || !this.objectModel) {
      console.warn('Object detection model not loaded');
      return [];
    }

    try {
      const predictions = await this.objectModel.detect(videoElement);
      
      // Filter for suspicious objects
      const suspiciousDetections = predictions.filter(prediction => {
        return this.suspiciousObjects.some(suspicious => 
          prediction.class.toLowerCase().includes(suspicious.toLowerCase())
        ) && prediction.score >= this.objectConfidenceThreshold;
      });

      this.detectedObjects = suspiciousDetections.map(detection => ({
        object: detection.class,
        confidence: detection.score,
        bbox: detection.bbox,
        timestamp: Date.now()
      }));

      return this.detectedObjects;
    } catch (error) {
      console.error('Object detection error:', error);
      return [];
    }
  }

  // Focus Detection based on face orientation and eye tracking
  detectFocus(faceLandmarks) {
    if (!faceLandmarks || faceLandmarks.length === 0) {
      return { isFocused: false, reason: 'no_face' };
    }

    try {
      // Use first face for focus detection
      const landmarks = faceLandmarks[0];
      
      // Key landmark indices for focus detection
      const noseTip = landmarks[1]; // Nose tip
      const leftEye = landmarks[33]; // Left eye outer corner
      const rightEye = landmarks[263]; // Right eye outer corner
      const chin = landmarks[18]; // Chin
      const forehead = landmarks[10]; // Forehead

      // Calculate face orientation
      const faceWidth = Math.abs(rightEye.x - leftEye.x);
      const faceHeight = Math.abs(forehead.y - chin.y);
      
      // Detect if face is turned away (side profile)
      const isProfileView = faceWidth < 0.03; // Threshold for profile detection
      
      // Calculate eye aspect ratio for eye closure detection
      const leftEyeTop = landmarks[159];
      const leftEyeBottom = landmarks[145];
      const rightEyeTop = landmarks[386];
      const rightEyeBottom = landmarks[374];
      
      const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
      const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
      const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
      
      // Eye closure threshold (lower means more closed)
      const eyeClosureThreshold = 0.015;
      const areEyesClosed = avgEyeHeight < eyeClosureThreshold;

      // Determine focus state
      let isFocused = true;
      let reason = 'focused';

      if (isProfileView) {
        isFocused = false;
        reason = 'looking_away';
      } else if (areEyesClosed) {
        isFocused = false;
        reason = 'eyes_closed';
      }

      this.isFocused = isFocused;
      
      return {
        isFocused,
        reason,
        metrics: {
          faceWidth,
          faceHeight,
          avgEyeHeight,
          isProfileView,
          areEyesClosed
        }
      };
    } catch (error) {
      console.error('Focus detection error:', error);
      return { isFocused: false, reason: 'detection_error' };
    }
  }

  // Eye closure detection for drowsiness
  detectEyeClosure(faceLandmarks) {
    if (!faceLandmarks || faceLandmarks.length === 0) {
      return { eyesClosed: false, duration: 0 };
    }

    try {
      const landmarks = faceLandmarks[0];
      
      // Eye landmarks for closure detection
      const leftEyePoints = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
      const rightEyePoints = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

      // Calculate eye aspect ratios
      const leftEAR = this.calculateEyeAspectRatio(landmarks, leftEyePoints);
      const rightEAR = this.calculateEyeAspectRatio(landmarks, rightEyePoints);
      const avgEAR = (leftEAR + rightEAR) / 2;

      // Threshold for eye closure (tune based on testing)
      const EAR_THRESHOLD = 0.25;
      const eyesClosed = avgEAR < EAR_THRESHOLD;

      return {
        eyesClosed,
        eyeAspectRatio: avgEAR,
        leftEAR,
        rightEAR,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Eye closure detection error:', error);
      return { eyesClosed: false, duration: 0 };
    }
  }

  // Calculate Eye Aspect Ratio for drowsiness detection
  calculateEyeAspectRatio(landmarks, eyePoints) {
    try {
      // Get eye landmarks
      const eyeLandmarks = eyePoints.map(point => landmarks[point]);
      
      // Calculate distances between specific eye points
      // This is a simplified EAR calculation
      const p1 = eyeLandmarks[1];
      const p2 = eyeLandmarks[5];
      const p3 = eyeLandmarks[2];
      const p4 = eyeLandmarks[4];
      const p5 = eyeLandmarks[0];
      const p6 = eyeLandmarks[3];

      // Vertical distances
      const v1 = Math.sqrt(Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2));
      const v2 = Math.sqrt(Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2));
      
      // Horizontal distance
      const h = Math.sqrt(Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2));

      // Calculate EAR
      const ear = (v1 + v2) / (2.0 * h);
      return ear;
    } catch (error) {
      console.error('EAR calculation error:', error);
      return 0.3; // Default value
    }
  }

  // Audio level monitoring for background noise detection
  setupAudioMonitoring(stream, onAudioViolation) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      microphone.connect(analyser);

      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average audio level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avgLevel = sum / bufferLength;
        
        // Detect unusually high audio levels (possible background conversation)
        const AUDIO_THRESHOLD = 50; // Adjust based on testing
        if (avgLevel > AUDIO_THRESHOLD) {
          if (onAudioViolation) {
            onAudioViolation({
              level: avgLevel,
              timestamp: Date.now(),
              type: 'high_audio_level'
            });
          }
        }

        // Continue monitoring
        requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();
      return audioContext;
    } catch (error) {
      console.error('Audio monitoring setup error:', error);
      return null;
    }
  }

  // Get current detection status
  getDetectionStatus() {
    const now = Date.now();
    const timeSinceLastFace = now - this.lastFaceDetectedTime;
    
    return {
      isFacePresent: this.isFacePresent,
      faceCount: this.currentFaceCount,
      isFocused: this.isFocused,
      timeSinceLastFace,
      detectedObjects: this.detectedObjects,
      isInitialized: this.isInitialized
    };
  }

  // Cleanup resources
  cleanup() {
    try {
      if (this.faceMesh) {
        this.faceMesh.close();
      }
      
      if (this.objectModel) {
        this.objectModel.dispose();
      }
      
      this.isInitialized = false;
      console.log('AI Detection Service cleaned up');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Export singleton instance
export const aiDetectionService = new AIDetectionService();
export default aiDetectionService;
