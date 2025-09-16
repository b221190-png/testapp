import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import io from 'socket.io-client';
import { interviewAPI, eventsAPI } from '../services/api';

const MonitorContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.lg};
`;

const Header = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 0.75rem;
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text};
  font-size: 1.5rem;
  font-weight: 600;
`;

const StatusBadge = styled.span`
  background: ${props => {
    switch (props.status) {
      case 'in-progress': return props.theme.colors.success;
      case 'scheduled': return props.theme.colors.warning;
      case 'completed': return props.theme.colors.secondary;
      default: return props.theme.colors.primary;
    }
  }};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
`;

const InterviewInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const InfoLabel = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 1rem;
  color: ${props => props.theme.colors.text};
  font-weight: 500;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const EventsPanel = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 0.75rem;
  padding: ${props => props.theme.spacing.lg};
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};
`;

const MonitoringPanel = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 0.75rem;
  padding: ${props => props.theme.spacing.lg};
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const LiveIndicator = styled.div`
  width: 8px;
  height: 8px;
  background: ${props => props.theme.colors.success};
  border-radius: 50%;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const EventsList = styled.div`
  max-height: 600px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const EventItem = styled.div`
  background: ${props => {
    switch (props.severity) {
      case 'critical': return 'rgba(239, 68, 68, 0.1)';
      case 'high': return 'rgba(245, 158, 11, 0.1)';
      case 'medium': return 'rgba(59, 130, 246, 0.1)';
      default: return 'rgba(100, 116, 139, 0.1)';
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      default: return '#64748b';
    }
  }};
  padding: ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
  position: relative;
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const EventType = styled.span`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  text-transform: capitalize;
`;

const EventTime = styled.span`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textLight};
  margin-left: auto;
`;

const EventDescription = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textLight};
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const MetricCard = styled.div`
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => {
    if (props.status === 'good') return props.theme.colors.success;
    if (props.status === 'warning') return props.theme.colors.warning;
    if (props.status === 'error') return props.theme.colors.error;
    return props.theme.colors.primary;
  }};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textLight};
  text-transform: uppercase;
  font-weight: 500;
`;

const AlertsSection = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
`;

const CriticalAlert = styled.div`
  background: ${props => props.theme.colors.error};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
  margin-bottom: ${props => props.theme.spacing.sm};
  font-weight: 500;
  animation: shake 0.5s ease-in-out;
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.variant === 'danger') return props.theme.colors.error;
    if (props.variant === 'secondary') return props.theme.colors.secondary;
    return props.theme.colors.primary;
  }};
  color: white;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
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

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.textLight};
`;

function InterviewerMonitor() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  
  const [interview, setInterview] = useState(null);
  const [events, setEvents] = useState([]);
  const [realTimeAlerts, setRealTimeAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    criticalEvents: 0,
    focusPercentage: 100,
    violationsCount: 0
  });

  useEffect(() => {
    loadInterviewData();
    setupRealTimeConnection();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [interviewId]);

  const loadInterviewData = async () => {
    try {
      // Load interview details
      const interviewResult = await interviewAPI.getById(interviewId);
      setInterview(interviewResult.data);

      // Load events
      const eventsResult = await eventsAPI.getByInterview(interviewId, { limit: 50 });
      setEvents(eventsResult.data);

      // Calculate metrics
      calculateMetrics(eventsResult.data);
    } catch (error) {
      console.error('Error loading interview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeConnection = () => {
    socketRef.current = io(process.env.REACT_APP_API_URL || window.location.origin);
    
    // Join interview room for real-time updates
    socketRef.current.emit('join-interview', interviewId);
    
    // Listen for real-time alerts
    socketRef.current.on('real-time-alert', (alertData) => {
      const newAlert = {
        id: Date.now(),
        ...alertData,
        timestamp: new Date(alertData.timestamp)
      };
      
      setRealTimeAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // Keep only 5 latest alerts
      
      // Add to events list
      setEvents(prev => [newAlert, ...prev]);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalEvents: prev.totalEvents + 1,
        criticalEvents: alertData.severity === 'critical' ? prev.criticalEvents + 1 : prev.criticalEvents,
        violationsCount: ['object-detected', 'multiple-faces', 'audio-violation'].includes(alertData.eventType) 
          ? prev.violationsCount + 1 : prev.violationsCount
      }));
    });

    // Listen for focus status updates
    socketRef.current.on('focus-status', (focusData) => {
      // Update focus percentage based on real-time data
      console.log('Focus status update:', focusData);
    });
  };

  const calculateMetrics = (eventsList) => {
    const totalEvents = eventsList.length;
    const criticalEvents = eventsList.filter(e => e.severity === 'critical').length;
    const violations = eventsList.filter(e => 
      ['object-detected', 'multiple-faces', 'audio-violation'].includes(e.eventType)
    ).length;
    
    // Calculate focus percentage (simplified)
    const focusEvents = eventsList.filter(e => e.eventType.includes('focus'));
    const focusLostEvents = focusEvents.filter(e => e.eventType === 'focus-lost');
    const focusPercentage = focusEvents.length > 0 
      ? Math.max(0, 100 - (focusLostEvents.length / focusEvents.length) * 100)
      : 100;

    setMetrics({
      totalEvents,
      criticalEvents,
      focusPercentage: Math.round(focusPercentage),
      violationsCount: violations
    });
  };

  const formatEventType = (eventType) => {
    return eventType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEventDescription = (event) => {
    const descriptions = {
      'face-absent': 'No face detected in video feed',
      'multiple-faces': `Multiple people detected (${event.eventData?.faceCount || 'unknown'} faces)`,
      'object-detected': `Unauthorized object: ${event.eventData?.objectType || 'unknown'}`,
      'focus-lost': `Candidate not looking at screen (${event.eventData?.reason || 'unknown reason'})`,
      'audio-violation': 'Background voices or unauthorized audio detected',
      'eye-closure-detected': 'Prolonged eye closure indicating possible drowsiness'
    };
    
    return descriptions[event.eventType] || event.eventType;
  };

  const endInterview = async () => {
    if (window.confirm('Are you sure you want to end this interview?')) {
      try {
        await interviewAPI.end(interviewId);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error ending interview:', error);
      }
    }
  };

  const viewReport = () => {
    navigate(`/report/${interviewId}`);
  };

  if (loading) {
    return (
      <MonitorContainer>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading interview monitor...
        </div>
      </MonitorContainer>
    );
  }

  if (!interview) {
    return (
      <MonitorContainer>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Interview not found
        </div>
      </MonitorContainer>
    );
  }

  return (
    <MonitorContainer>
      <Header>
        <HeaderContent>
          <Title>Interview Monitor</Title>
          <StatusBadge status={interview.status}>
            {interview.status}
          </StatusBadge>
        </HeaderContent>
        
        <InterviewInfo>
          <InfoItem>
            <InfoLabel>Candidate</InfoLabel>
            <InfoValue>{interview.candidateName}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Position</InfoLabel>
            <InfoValue>{interview.position}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Scheduled Date</InfoLabel>
            <InfoValue>{new Date(interview.scheduledDate).toLocaleString()}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Duration</InfoLabel>
            <InfoValue>{interview.duration} minutes</InfoValue>
          </InfoItem>
        </InterviewInfo>
      </Header>

      <MainGrid>
        <EventsPanel>
          <SectionTitle>
            <LiveIndicator />
            Live Event Feed
          </SectionTitle>
          
          {/* Critical Alerts */}
          {realTimeAlerts.filter(alert => alert.severity === 'critical').map(alert => (
            <CriticalAlert key={alert.id}>
              🚨 CRITICAL: {getEventDescription(alert)}
            </CriticalAlert>
          ))}
          
          <EventsList>
            {events.length === 0 ? (
              <EmptyState>No events detected yet</EmptyState>
            ) : (
              events.map((event, index) => (
                <EventItem key={event._id || index} severity={event.severity}>
                  <EventHeader>
                    <EventType>{formatEventType(event.eventType)}</EventType>
                    <EventTime>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </EventTime>
                  </EventHeader>
                  <EventDescription>
                    {getEventDescription(event)}
                  </EventDescription>
                </EventItem>
              ))
            )}
          </EventsList>
        </EventsPanel>

        <MonitoringPanel>
          <SectionTitle>Real-time Metrics</SectionTitle>
          
          <MetricsGrid>
            <MetricCard>
              <MetricValue status={metrics.totalEvents < 10 ? 'good' : 'warning'}>
                {metrics.totalEvents}
              </MetricValue>
              <MetricLabel>Total Events</MetricLabel>
            </MetricCard>
            
            <MetricCard>
              <MetricValue status={metrics.criticalEvents === 0 ? 'good' : 'error'}>
                {metrics.criticalEvents}
              </MetricValue>
              <MetricLabel>Critical Issues</MetricLabel>
            </MetricCard>
            
            <MetricCard>
              <MetricValue status={metrics.focusPercentage > 80 ? 'good' : metrics.focusPercentage > 60 ? 'warning' : 'error'}>
                {metrics.focusPercentage}%
              </MetricValue>
              <MetricLabel>Focus Score</MetricLabel>
            </MetricCard>
            
            <MetricCard>
              <MetricValue status={metrics.violationsCount === 0 ? 'good' : 'error'}>
                {metrics.violationsCount}
              </MetricValue>
              <MetricLabel>Violations</MetricLabel>
            </MetricCard>
          </MetricsGrid>

          <AlertsSection>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Interview Controls</h3>
            <ActionButtons>
              <ActionButton onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </ActionButton>
              {interview.status === 'completed' ? (
                <ActionButton onClick={viewReport}>
                  View Report
                </ActionButton>
              ) : (
                <ActionButton variant="danger" onClick={endInterview}>
                  End Interview
                </ActionButton>
              )}
            </ActionButtons>
          </AlertsSection>
        </MonitoringPanel>
      </MainGrid>
    </MonitorContainer>
  );
}

export default InterviewerMonitor;
