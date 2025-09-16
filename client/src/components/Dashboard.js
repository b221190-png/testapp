import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { authAPI, interviewAPI, apiUtils } from '../services/api';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const Header = styled.header`
  background: ${props => props.theme.colors.surface};
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  box-shadow: 0 2px 4px ${props => props.theme.colors.shadow};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.h1`
  color: ${props => props.theme.colors.text};
  font-size: 1.5rem;
  font-weight: 600;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const UserName = styled.span`
  color: ${props => props.theme.colors.text};
  font-weight: 500;
`;

const LogoutButton = styled.button`
  background: ${props => props.theme.colors.error};
  color: white;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
  font-size: 0.9rem;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const Content = styled.main`
  padding: ${props => props.theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.surface};
  padding: ${props => props.theme.spacing.lg};
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: 0.9rem;
`;

const ActionsSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text};
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.colors.primaryDark};
    transform: translateY(-1px);
  }
`;

const InterviewsList = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 0.75rem;
  padding: ${props => props.theme.spacing.lg};
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};
`;

const InterviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const InterviewInfo = styled.div`
  flex: 1;
`;

const CandidateName = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const InterviewDetails = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textLight};
`;

const StatusBadge = styled.span`
  background: ${props => {
    switch (props.status) {
      case 'completed': return props.theme.colors.success;
      case 'in-progress': return props.theme.colors.warning;
      case 'scheduled': return props.theme.colors.primary;
      default: return props.theme.colors.secondary;
    }
  }};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
`;

const InterviewActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const SmallButton = styled.button`
  background: ${props => props.variant === 'danger' ? props.theme.colors.error : props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: 0.25rem;
  font-size: 0.8rem;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.textLight};
`;

function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = apiUtils.getUserData();
      setUserData(user);

      // Load user statistics
      const statsResult = await authAPI.getStats();
      setStats(statsResult.data);

      // Load recent interviews
      const interviewsResult = await interviewAPI.getByInterviewer(user.email, { limit: 10 });
      setInterviews(interviewsResult.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiUtils.clearAuthData();
      navigate('/login');
    }
  };

  const handleViewReport = (interviewId) => {
    navigate(`/report/${interviewId}`);
  };

  const handleMonitorInterview = (interviewId) => {
    navigate(`/monitor/${interviewId}`);
  };

  if (loading) {
    return (
      <DashboardContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading dashboard...
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <HeaderTitle>Video Proctoring Dashboard</HeaderTitle>
        <UserInfo>
          <UserName>Welcome, {userData?.name}</UserName>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </UserInfo>
      </Header>

      <Content>
        {/* Statistics */}
        <StatsGrid>
          <StatCard>
            <StatValue>{stats?.totalInterviews || 0}</StatValue>
            <StatLabel>Total Interviews</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats?.scheduledInterviews || 0}</StatValue>
            <StatLabel>Scheduled</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats?.inProgressInterviews || 0}</StatValue>
            <StatLabel>In Progress</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats?.completedInterviews || 0}</StatValue>
            <StatLabel>Completed</StatLabel>
          </StatCard>
        </StatsGrid>

        {/* Quick Actions */}
        <ActionsSection>
          <SectionTitle>Quick Actions</SectionTitle>
          <ActionButtons>
            <ActionButton onClick={() => navigate('/interview-setup')}>
              Schedule New Interview
            </ActionButton>
            <ActionButton onClick={() => window.open('/api/health', '_blank')}>
              System Health Check
            </ActionButton>
          </ActionButtons>
        </ActionsSection>

        {/* Recent Interviews */}
        <InterviewsList>
          <SectionTitle>Recent Interviews</SectionTitle>
          
          {interviews.length === 0 ? (
            <EmptyState>
              No interviews found. Schedule your first interview to get started!
            </EmptyState>
          ) : (
            interviews.map((interview) => (
              <InterviewItem key={interview._id}>
                <InterviewInfo>
                  <CandidateName>{interview.candidateName}</CandidateName>
                  <InterviewDetails>
                    {interview.position} • {new Date(interview.scheduledDate).toLocaleDateString()} • {interview.duration} min
                    {interview.integrityScore && ` • Score: ${interview.integrityScore}/100`}
                  </InterviewDetails>
                </InterviewInfo>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <StatusBadge status={interview.status}>
                    {interview.status}
                  </StatusBadge>
                  
                  <InterviewActions>
                    {interview.status === 'in-progress' && (
                      <SmallButton onClick={() => handleMonitorInterview(interview._id)}>
                        Monitor
                      </SmallButton>
                    )}
                    {interview.status === 'completed' && (
                      <SmallButton onClick={() => handleViewReport(interview._id)}>
                        View Report
                      </SmallButton>
                    )}
                    {interview.status === 'scheduled' && (
                      <SmallButton onClick={() => navigate(`/interview-setup?edit=${interview._id}`)}>
                        Edit
                      </SmallButton>
                    )}
                  </InterviewActions>
                </div>
              </InterviewItem>
            ))
          )}
        </InterviewsList>
      </Content>
    </DashboardContainer>
  );
}

export default Dashboard;
