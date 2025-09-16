import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { reportsAPI, apiUtils } from '../services/api';

const ReportContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.lg};
`;

const Header = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 0.75rem;
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text};
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Subtitle = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: 1rem;
`;

const ScoreSection = styled.div`
  text-align: center;
  min-width: 200px;
`;

const IntegrityScore = styled.div`
  font-size: 3rem;
  font-weight: bold;
  color: ${props => {
    if (props.score >= 90) return props.theme.colors.success;
    if (props.score >= 70) return props.theme.colors.warning;
    return props.theme.colors.error;
  }};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ScoreLabel = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: 0.9rem;
  text-transform: uppercase;
  font-weight: 500;
`;

const InterviewInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.lg};
  border-radius: 0.5rem;
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
  grid-template-columns: 2fr 1fr;
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.desktop}) {
    grid-template-columns: 1fr;
  }
`;

const ReportSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 0.75rem;
  padding: ${props => props.theme.spacing.xl};
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text};
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.lg};
  border-radius: 0.5rem;
  text-align: center;
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.success;
      case 'warning': return props.theme.colors.warning;
      case 'error': return props.theme.colors.error;
      default: return props.theme.colors.primary;
    }
  }};
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: bold;
  color: ${props => {
    switch (props.type) {
      case 'success': return props.theme.colors.success;
      case 'warning': return props.theme.colors.warning;
      case 'error': return props.theme.colors.error;
      default: return props.theme.colors.primary;
    }
  }};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: 500;
`;

const Timeline = styled.div`
  position: relative;
  padding-left: ${props => props.theme.spacing.lg};
`;

const TimelineItem = styled.div`
  position: relative;
  padding-bottom: ${props => props.theme.spacing.lg};
  border-left: 2px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-left: 2px solid transparent;
  }
  
  &::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${props => {
      switch (props.severity) {
        case 'critical': return props.theme.colors.error;
        case 'high': return props.theme.colors.warning;
        case 'medium': return props.theme.colors.primary;
        default: return props.theme.colors.secondary;
      }
    }};
  }
`;

const TimelineContent = styled.div`
  padding-left: ${props => props.theme.spacing.lg};
`;

const TimelineTime = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textLight};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const TimelineEvent = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const TimelineDetails = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textLight};
`;

const RecommendationCard = styled.div`
  background: ${props => {
    switch (props.type) {
      case 'positive': return 'rgba(16, 185, 129, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'critical': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(59, 130, 246, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'positive': return props.theme.colors.success;
      case 'warning': return props.theme.colors.warning;
      case 'critical': return props.theme.colors.error;
      default: return props.theme.colors.primary;
    }
  }};
  border-radius: 0.5rem;
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const RecommendationIcon = styled.div`
  font-size: 1.2rem;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const RecommendationText = styled.div`
  color: ${props => props.theme.colors.text};
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.xl};
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.variant === 'secondary') return props.theme.colors.secondary;
    if (props.variant === 'success') return props.theme.colors.success;
    return props.theme.colors.primary;
  }};
  color: white;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
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

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 1.1rem;
  color: ${props => props.theme.colors.textLight};
`;

const ErrorState = styled.div`
  background: ${props => props.theme.colors.error};
  color: white;
  padding: ${props => props.theme.spacing.lg};
  border-radius: 0.5rem;
  text-align: center;
  margin: ${props => props.theme.spacing.lg} 0;
`;

function ReportViewer() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [interviewId]);

  const loadReportData = async () => {
    try {
      const result = await reportsAPI.getSummary(interviewId);
      setReportData(result.data);
    } catch (err) {
      setError('Failed to load interview report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDFReport = async () => {
    try {
      setDownloadingPDF(true);
      const blob = await reportsAPI.generatePDF(interviewId);
      apiUtils.downloadBlob(blob, `interview-report-${reportData.interview.candidateName}.pdf`);
    } catch (err) {
      alert('Failed to generate PDF report');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const downloadCSVReport = async () => {
    try {
      setDownloadingCSV(true);
      const blob = await reportsAPI.generateCSV(interviewId);
      apiUtils.downloadBlob(blob, `interview-events-${reportData.interview.candidateName}.csv`);
    } catch (err) {
      alert('Failed to generate CSV report');
    } finally {
      setDownloadingCSV(false);
    }
  };

  const formatEventType = (eventType) => {
    return eventType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEventDescription = (event) => {
    const descriptions = {
      'interview-started': 'Interview session began',
      'interview-ended': 'Interview session completed',
      'face-absent': 'No face detected in video feed',
      'multiple-faces': `Multiple people detected (${event.eventData?.faceCount || 'unknown'} faces)`,
      'object-detected': `Unauthorized object detected: ${event.eventData?.objectType || 'unknown'}`,
      'focus-lost': `Candidate stopped looking at screen (${event.eventData?.reason || 'unknown reason'})`,
      'focus-gained': 'Candidate resumed looking at screen',
      'audio-violation': 'Background voices or unauthorized audio detected',
      'eye-closure-detected': 'Prolonged eye closure indicating possible drowsiness'
    };
    
    return descriptions[event.eventType] || event.eventType;
  };

  const getScoreType = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'positive': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <ReportContainer>
        <LoadingState>Loading interview report...</LoadingState>
      </ReportContainer>
    );
  }

  if (error) {
    return (
      <ReportContainer>
        <ErrorState>{error}</ErrorState>
      </ReportContainer>
    );
  }

  if (!reportData) {
    return (
      <ReportContainer>
        <ErrorState>No report data available</ErrorState>
      </ReportContainer>
    );
  }

  const { interview, summary, statistics, timeline, recommendations } = reportData;

  return (
    <ReportContainer>
      <Header>
        <HeaderContent>
          <TitleSection>
            <Title>Interview Proctoring Report</Title>
            <Subtitle>
              Comprehensive analysis of {interview.candidateName}'s interview performance
            </Subtitle>
          </TitleSection>
          
          <ScoreSection>
            <IntegrityScore score={interview.integrityScore || 0}>
              {interview.integrityScore || 0}/100
            </IntegrityScore>
            <ScoreLabel>Integrity Score</ScoreLabel>
          </ScoreSection>
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
            <InfoLabel>Date & Time</InfoLabel>
            <InfoValue>{new Date(interview.scheduledDate).toLocaleString()}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Duration</InfoLabel>
            <InfoValue>{interview.duration} minutes</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Status</InfoLabel>
            <InfoValue style={{ textTransform: 'capitalize' }}>{interview.status}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Report Generated</InfoLabel>
            <InfoValue>{new Date().toLocaleString()}</InfoValue>
          </InfoItem>
        </InterviewInfo>
      </Header>

      <MainGrid>
        <div>
          {/* Performance Summary */}
          <ReportSection>
            <SectionTitle>📊 Performance Summary</SectionTitle>
            <StatsGrid>
              <StatCard type={summary.focusPercentage > 80 ? 'success' : summary.focusPercentage > 60 ? 'warning' : 'error'}>
                <StatValue type={summary.focusPercentage > 80 ? 'success' : summary.focusPercentage > 60 ? 'warning' : 'error'}>
                  {summary.focusPercentage || 0}%
                </StatValue>
                <StatLabel>Focus Percentage</StatLabel>
              </StatCard>
              
              <StatCard type={summary.totalFocusLostEvents === 0 ? 'success' : 'warning'}>
                <StatValue type={summary.totalFocusLostEvents === 0 ? 'success' : 'warning'}>
                  {summary.totalFocusLostEvents || 0}
                </StatValue>
                <StatLabel>Focus Lost Events</StatLabel>
              </StatCard>
              
              <StatCard type={summary.totalObjectDetections === 0 ? 'success' : 'error'}>
                <StatValue type={summary.totalObjectDetections === 0 ? 'success' : 'error'}>
                  {summary.totalObjectDetections || 0}
                </StatValue>
                <StatLabel>Object Detections</StatLabel>
              </StatCard>
              
              <StatCard type={summary.totalMultipleFaceEvents === 0 ? 'success' : 'error'}>
                <StatValue type={summary.totalMultipleFaceEvents === 0 ? 'success' : 'error'}>
                  {summary.totalMultipleFaceEvents || 0}
                </StatValue>
                <StatLabel>Multiple Face Events</StatLabel>
              </StatCard>
              
              <StatCard type={summary.totalAudioViolations === 0 ? 'success' : 'warning'}>
                <StatValue type={summary.totalAudioViolations === 0 ? 'success' : 'warning'}>
                  {summary.totalAudioViolations || 0}
                </StatValue>
                <StatLabel>Audio Violations</StatLabel>
              </StatCard>
              
              <StatCard>
                <StatValue>{statistics.totalEvents || 0}</StatValue>
                <StatLabel>Total Events</StatLabel>
              </StatCard>
            </StatsGrid>
          </ReportSection>

          {/* Event Timeline */}
          <ReportSection>
            <SectionTitle>⏱️ Event Timeline</SectionTitle>
            {timeline && timeline.length > 0 ? (
              <Timeline>
                {timeline.slice(0, 20).map((event, index) => (
                  <TimelineItem key={index} severity={event.severity}>
                    <TimelineContent>
                      <TimelineTime>
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </TimelineTime>
                      <TimelineEvent>
                        {formatEventType(event.eventType)}
                      </TimelineEvent>
                      <TimelineDetails>
                        {getEventDescription(event)}
                      </TimelineDetails>
                    </TimelineContent>
                  </TimelineItem>
                ))}
                {timeline.length > 20 && (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                    ... and {timeline.length - 20} more events
                  </div>
                )}
              </Timeline>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No events recorded during this interview
              </div>
            )}
          </ReportSection>
        </div>

        <div>
          {/* Recommendations */}
          <ReportSection>
            <SectionTitle>💡 Recommendations</SectionTitle>
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <RecommendationCard key={index} type={rec.type}>
                  <RecommendationIcon>
                    {getRecommendationIcon(rec.type)}
                  </RecommendationIcon>
                  <RecommendationText>
                    {rec.message}
                  </RecommendationText>
                </RecommendationCard>
              ))
            ) : (
              <RecommendationCard type="positive">
                <RecommendationIcon>✅</RecommendationIcon>
                <RecommendationText>
                  Excellent interview conduct with no significant violations detected.
                </RecommendationText>
              </RecommendationCard>
            )}
          </ReportSection>

          {/* Actions */}
          <ReportSection>
            <SectionTitle>📁 Export Options</SectionTitle>
            <ActionButtons>
              <ActionButton 
                onClick={downloadPDFReport}
                disabled={downloadingPDF}
              >
                {downloadingPDF ? 'Generating...' : 'Download PDF'}
              </ActionButton>
              <ActionButton 
                variant="secondary"
                onClick={downloadCSVReport}
                disabled={downloadingCSV}
              >
                {downloadingCSV ? 'Generating...' : 'Download CSV'}
              </ActionButton>
            </ActionButtons>
            
            <ActionButtons style={{ marginTop: '1rem' }}>
              <ActionButton 
                variant="success"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </ActionButton>
            </ActionButtons>
          </ReportSection>
        </div>
      </MainGrid>
    </ReportContainer>
  );
}

export default ReportViewer;
