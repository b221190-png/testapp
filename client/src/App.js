import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import InterviewSetup from './components/InterviewSetup';
import InterviewSession from './components/InterviewSession';
import InterviewerMonitor from './components/InterviewerMonitor';
import ReportViewer from './components/ReportViewer';
import ProtectedRoute from './components/ProtectedRoute';

// Global Styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    line-height: 1.6;
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    font-family: inherit;
  }

  input, textarea {
    font-family: inherit;
    outline: none;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`;

// Theme
const theme = {
  colors: {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textLight: '#64748b',
    border: '#e2e8f0',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1200px'
  }
};

// App Container
const AppContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/interview/:interviewLink" element={<InterviewSession />} />
            
            {/* Protected Routes - Interviewer */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/interview-setup" element={
              <ProtectedRoute>
                <InterviewSetup />
              </ProtectedRoute>
            } />
            
            <Route path="/monitor/:interviewId" element={
              <ProtectedRoute>
                <InterviewerMonitor />
              </ProtectedRoute>
            } />
            
            <Route path="/report/:interviewId" element={
              <ProtectedRoute>
                <ReportViewer />
              </ProtectedRoute>
            } />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AppContainer>
    </ThemeProvider>
  );
}

// 404 Component
const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
`;

const NotFoundTitle = styled.h1`
  font-size: 4rem;
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const NotFoundText = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme.colors.textLight};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const NotFoundButton = styled.button`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.primaryDark};
  }
`;

function NotFound() {
  return (
    <NotFoundContainer>
      <NotFoundTitle>404</NotFoundTitle>
      <NotFoundText>The page you're looking for doesn't exist.</NotFoundText>
      <NotFoundButton onClick={() => window.location.href = '/login'}>
        Go to Login
      </NotFoundButton>
    </NotFoundContainer>
  );
}

export default App;
