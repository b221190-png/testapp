import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import Webcam from 'react-webcam';
import io from 'socket.io-client';
import { interviewAPI, eventsAPI, apiUtils } from '../services/api';
import aiDetectionService from '../services/aiDetection';

const SessionContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background: rgba(0, 0, 0, 0.3);
  padding: ${props => props.theme.spacing.lg};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const InterviewInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const InterviewTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const InterviewDetails = styled.div`
  opacity: 0.8;
  font-size: 0.9rem;
`;

const TimerDisplay = styled.div`
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: bold;
  color: ${props => props.isWarning ? '#f59e0b' : '#10b981'};
`;

const MainContent = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  
  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const VideoSection = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  padding: ${props => props.theme.spacing.lg};
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const VideoContainer = styled.div`
  position: relative;
  border-radius: 0.75rem;
  overflow: hidden;
  margin-bottom: ${props => props.theme.spacing.lg};
  background: #000;
`;

const WebcamComponent = styled(Webcam)`
  width: 100%;
  height: auto;
  display: block;
`;

const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
`;

const DetectionBox = styled.div`
  position: absolute;
  border: 2px solid ${props => props.color || '#10b981'};
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.1);
  
  &::before {
    content: '${props => props.label}';
    position: absolute;
    top: -24px;
    left: 0;
    background: ${props => props.color || '#10b981'};
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
`;

const StatusPanel = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  padding: ${props => props.theme.spacing.lg};
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: fit-content;
`;

const StatusTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const StatusItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.sm} 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatusLabel = styled.span`
  font-size: 0.9rem;
  opacity: 0.8;
`;

const StatusValue = styled.span`
  font-weight: 500;
  color: ${props => {
    if (props.status === 'good') return '#10b981';
    if (props.status === 'warning') return '#f59e0b';
    if (props.status === 'error') return '#ef4444';
    return 'inherit';
  }};
`;

const AlertsPanel = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  max-height: 300px;
  overflow-y: auto;
`;

const AlertItem = styled.div`
  background: ${props => {
    switch (props.severity) {
      case 'critical': return 'rgba(239, 68, 68, 0.2)';
      case 'high': return 'rgba(245, 158, 11, 0.2)';
      default: return 'rgba(59, 130, 246, 0.2)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      default: return '#3b82f6';
    }
  }};
  border-radius: 0.5rem;
  padding: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: 0.8rem;
`;

const AlertTime = styled.div`
  opacity: 0.6;
  font-size: 0.7rem;
  margin-top: ${props => props.theme.spacing.xs};
`;

const ControlButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const ControlButton = styled.button`
  background: ${props => {
    if (props.variant === 'danger') return '#ef4444';
    if (props.variant === 'warning') return '#f59e0b';
    return '#3b82f6';
  }};
  color: white;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.2s;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SystemMessage = styled.div`
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: ${props => props.theme.spacing.lg};
  border-radius: 0.75rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: center;
`;

function InterviewSession() {
  const { interviewLink } = useParams();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  
  // State management
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [detectionStatus, setDetectionStatus] = useState({
    faceDetected: false,
    isFocused: true,
    objectsDetected: [],
    audioLevel: 0
  });
  const [alerts, setAlerts] = useState([]);
  const [isAiInitialized, setIsAiInitialized] = useState(false);
  
  // Load interview data on mount
  useEffect(() => {
    loadInterviewData();
    return () => cleanup();
  }, [interviewLink]);

  // Initialize AI detection when permissions are granted
  useEffect(() => {
    if (hasPermissions && !isAiInitialized) {
      initializeAI();
    }
  }, [hasPermissions, isAiInitialized]);

  // Timer effect
  useEffect(() => {
    let timerInterval;
    if (isInterviewStarted) {
      timerInterval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isInterviewStarted]);

  const loadInterviewData = async () => {
    try {
      const result = await interviewAPI.getByLink(interviewLink);
      setInterview(result.data);
      
      // Connect to socket for real-time communication
      socketRef.current = io(process.env.REACT_APP_API_URL || window.location.origin);
      socketRef.current.emit('join-interview', result.data._id);
      
    } catch (err) {
      setError('Interview not found or invalid link');
    } finally {
      setLoading(false);
    }
  };

  const initializeAI = async () => {
    try {
      await aiDetectionService.initialize();
      setIsAiInitialized(true);
      addAlert('AI monitoring system initialized', 'low');
    } catch (err) {
      console.error('AI initialization failed:', err);
      addAlert('AI monitoring system failed to initialize', 'high');
    }
  };

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      setHasPermissions(true);
      addAlert('Camera and microphone access granted', 'low');
      
      // Set up audio monitoring
      if (interview?.settings?.enableAudioMonitoring) {
        aiDetectionService.setupAudioMonitoring(stream, handleAudioViolation);
      }
      
    } catch (err) {
      setError('Camera and microphone access is required for this interview');
      logEvent('camera-permission-denied', { error: err.message });
    }
  };

  const startInterview = async () => {
    try {
      await interviewAPI.start(interview._id);
      setIsInterviewStarted(true);
      addAlert('Interview started', 'low');
      logEvent('interview-started');
      
      // Start AI detection loop
      startDetectionLoop();
    } catch (err) {
      addAlert('Failed to start interview', 'high');
    }
  };

  const endInterview = async () => {
    try {
      await interviewAPI.end(interview._id);
      setIsInterviewStarted(false);
      addAlert('Interview ended', 'low');
      logEvent('interview-ended');
      
      // Stop detection loop
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      
      // Show completion message
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      addAlert('Failed to end interview properly', 'high');
    }
  };

  const startDetectionLoop = () => {
    detectionIntervalRef.current = setInterval(async () => {
      if (!webcamRef.current || !isAiInitialized) return;
      
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;
      
      try {
        // Face detection and focus tracking
        if (interview?.settings?.enableFaceDetection) {
          await aiDetectionService.detectFaces(video, handleFaceResults);
        }
        
        // Object detection
        if (interview?.settings?.enableObjectDetection) {
          const objects = await aiDetectionService.detectObjects(video);
          if (objects.length > 0) {
            handleObjectDetection(objects);
          }
        }
        
      } catch (err) {
        console.error('Detection error:', err);
      }
    }, 1000); // Run detection every second
  };

  const handleFaceResults = (results) => {
    const { faceCount, isFacePresent, landmarks } = results;
    
    setDetectionStatus(prev => ({
      ...prev,
      faceDetected: isFacePresent,
      faceCount
    }));

    // Check for violations
    if (faceCount === 0) {
      logEvent('face-absent');
      addAlert('No face detected in video', 'high');
    } else if (faceCount > 1) {
      logEvent('multiple-faces', { faceCount });
      addAlert(`Multiple faces detected (${faceCount})`, 'critical');
    }

    // Focus detection
    if (landmarks && landmarks.length > 0) {
      const focusResult = aiDetectionService.detectFocus(landmarks);
      setDetectionStatus(prev => ({
        ...prev,
        isFocused: focusResult.isFocused
      }));

      if (!focusResult.isFocused) {
        logEvent('focus-lost', { reason: focusResult.reason });
        addAlert(`Focus lost: ${focusResult.reason}`, 'warning');
      }

      // Eye closure detection
      const eyeResult = aiDetectionService.detectEyeClosure(landmarks);
      if (eyeResult.eyesClosed) {
        logEvent('eye-closure-detected', { duration: eyeResult.duration });
        addAlert('Prolonged eye closure detected', 'warning');
      }
    }
  };

  const handleObjectDetection = (objects) => {
    setDetectionStatus(prev => ({
      ...prev,
      objectsDetected: objects
    }));

    objects.forEach(obj => {
      logEvent('object-detected', {
        objectType: obj.object,
        confidence: obj.confidence,
        coordinates: obj.bbox
      });
      addAlert(`Unauthorized object detected: ${obj.object}`, 'critical');
    });
  };

  const handleAudioViolation = (audioData) => {
    logEvent('audio-violation', {
      audioLevel: audioData.level,
      type: audioData.type
    });
    addAlert('Background audio detected', 'warning');
  };

  const logEvent = async (eventType, eventData = {}) => {
    if (!interview) return;
    
    try {
      await eventsAPI.log({
        interviewId: interview._id,
        eventType,
        eventData,
        timestamp: new Date().toISOString()
      });
      
      // Emit real-time event
      if (socketRef.current) {
        socketRef.current.emit('detection-event', {
          interviewId: interview._id,
          eventType,
          eventData,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to log event:', err);
    }
  };

  const addAlert = (message, severity = 'medium') => {
    const alert = {
      id: Date.now(),
      message,
      severity,
      timestamp: new Date()
    };
    
    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep only last 10 alerts
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanup = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    aiDetectionService.cleanup();
  };

  if (loading) {
    return (
      <SessionContainer>
        <SystemMessage>Loading interview session...</SystemMessage>
      </SessionContainer>
    );
  }

  if (error) {
    return (
      <SessionContainer>
        <SystemMessage>Error: {error}</SystemMessage>
      </SessionContainer>
    );
  }

  if (!hasPermissions) {
    return (
      <SessionContainer>
        <SystemMessage>
          <h2>Camera & Microphone Access Required</h2>
          <p>This interview requires access to your camera and microphone for proctoring purposes.</p>
          <ControlButton onClick={requestPermissions} style={{ marginTop: '1rem' }}>
            Grant Permissions
          </ControlButton>
        </SystemMessage>
      </SessionContainer>
    );
  }

  return (
    <SessionContainer>
      <Header>
        <InterviewInfo>
          <div>
            <InterviewTitle>{interview.position} Interview</InterviewTitle>
            <InterviewDetails>
              Candidate: {interview.candidateName} • Duration: {interview.duration} minutes
            </InterviewDetails>
          </div>
          <TimerDisplay isWarning={elapsedTime > interview.duration * 60 * 0.9}>
            {formatTime(elapsedTime)} / {formatTime(interview.duration * 60)}
          </TimerDisplay>
        </InterviewInfo>
      </Header>

      <MainContent>
        <VideoSection>
          <VideoContainer>
            <WebcamComponent
              ref={webcamRef}
              audio={true}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: "user"
              }}
            />
            <VideoOverlay>
              {detectionStatus.objectsDetected.map((obj, index) => (
                <DetectionBox
                  key={index}
                  color="#ef4444"
                  label={obj.object}
                  style={{
                    left: `${obj.bbox[0]}px`,
                    top: `${obj.bbox[1]}px`,
                    width: `${obj.bbox[2]}px`,
                    height: `${obj.bbox[3]}px`
                  }}
                />
              ))}
            </VideoOverlay>
          </VideoContainer>

          <ControlButtons>
            {!isInterviewStarted ? (
              <ControlButton onClick={startInterview} disabled={!isAiInitialized}>
                {isAiInitialized ? 'Start Interview' : 'Initializing AI...'}
              </ControlButton>
            ) : (
              <ControlButton variant="danger" onClick={endInterview}>
                End Interview
              </ControlButton>
            )}
          </ControlButtons>
        </VideoSection>

        <StatusPanel>
          <StatusTitle>Monitoring Status</StatusTitle>
          
          <StatusItem>
            <StatusLabel>Face Detection</StatusLabel>
            <StatusValue status={detectionStatus.faceDetected ? 'good' : 'error'}>
              {detectionStatus.faceDetected ? 'Active' : 'No Face'}
            </StatusValue>
          </StatusItem>
          
          <StatusItem>
            <StatusLabel>Focus Status</StatusLabel>
            <StatusValue status={detectionStatus.isFocused ? 'good' : 'warning'}>
              {detectionStatus.isFocused ? 'Focused' : 'Distracted'}
            </StatusValue>
          </StatusItem>
          
          <StatusItem>
            <StatusLabel>Objects Detected</StatusLabel>
            <StatusValue status={detectionStatus.objectsDetected.length === 0 ? 'good' : 'error'}>
              {detectionStatus.objectsDetected.length}
            </StatusValue>
          </StatusItem>
          
          <StatusItem>
            <StatusLabel>AI Monitoring</StatusLabel>
            <StatusValue status={isAiInitialized ? 'good' : 'warning'}>
              {isAiInitialized ? 'Active' : 'Initializing'}
            </StatusValue>
          </StatusItem>

          <AlertsPanel>
            <h4 style={{ marginBottom: '0.5rem', opacity: 0.8 }}>Recent Alerts</h4>
            {alerts.length === 0 ? (
              <div style={{ opacity: 0.6, fontSize: '0.8rem' }}>No alerts</div>
            ) : (
              alerts.map(alert => (
                <AlertItem key={alert.id} severity={alert.severity}>
                  {alert.message}
                  <AlertTime>
                    {alert.timestamp.toLocaleTimeString()}
                  </AlertTime>
                </AlertItem>
              ))
            )}
          </AlertsPanel>
        </StatusPanel>
      </MainContent>
    </SessionContainer>
  );
}

export default InterviewSession;
