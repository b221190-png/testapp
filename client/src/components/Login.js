import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { authAPI, apiUtils } from '../services/api';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.primaryDark} 100%);
  padding: ${props => props.theme.spacing.md};
`;

const LoginCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 1rem;
  padding: ${props => props.theme.spacing.xxl};
  box-shadow: 0 20px 40px ${props => props.theme.colors.shadow};
  width: 100%;
  max-width: 400px;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const LogoIcon = styled.div`
  width: 60px;
  height: 60px;
  background: ${props => props.theme.colors.primary};
  border-radius: 1rem;
  margin: 0 auto ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
`;

const Title = styled.h1`
  text-align: center;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: 1.5rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.textLight};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text};
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  &:invalid {
    border-color: ${props => props.theme.colors.error};
  }
`;

const Button = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryDark};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.error};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
  text-align: center;
  font-size: 0.9rem;
`;

const SuccessMessage = styled.div`
  background: ${props => props.theme.colors.success};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
  text-align: center;
  font-size: 0.9rem;
`;

const ToggleMode = styled.div`
  text-align: center;
  margin-top: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.textLight};
`;

const ToggleLink = styled.button`
  background: none;
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
  text-decoration: underline;
  
  &:hover {
    color: ${props => props.theme.colors.primaryDark};
  }
`;

const DemoCredentials = styled.div`
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
  margin-top: ${props => props.theme.spacing.lg};
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textLight};
`;

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: ''
  });

  useEffect(() => {
    // Redirect if already authenticated
    if (apiUtils.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;
      
      if (isLogin) {
        result = await authAPI.login(formData.email, formData.password);
      } else {
        result = await authAPI.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          organization: formData.organization
        });
      }

      if (result.success) {
        // Store auth data
        apiUtils.setAuthData(result.data.token, result.data.user);
        
        if (isLogin) {
          navigate('/dashboard');
        } else {
          setSuccess('Registration successful! You can now login.');
          setIsLogin(true);
          setFormData({
            name: '',
            email: '',
            password: '',
            organization: ''
          });
        }
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setFormData({
      ...formData,
      email: 'demo@proctoring.com',
      password: 'demo123'
    });
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <LogoIcon>VP</LogoIcon>
          <Title>Video Proctoring</Title>
          <Subtitle>AI-Powered Interview Monitoring</Subtitle>
        </Logo>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <Form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <FormGroup>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Input
                  id="organization"
                  name="organization"
                  type="text"
                  value={formData.organization}
                  onChange={handleInputChange}
                  placeholder="Enter your organization"
                />
              </FormGroup>
            </>
          )}

          <FormGroup>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </FormGroup>

          <Button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
        </Form>

        <ToggleMode>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <ToggleLink
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
              setFormData({
                name: '',
                email: '',
                password: '',
                organization: ''
              });
            }}
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </ToggleLink>
        </ToggleMode>

        {isLogin && (
          <DemoCredentials>
            <strong>Demo Credentials:</strong><br />
            Email: demo@proctoring.com<br />
            Password: demo123<br />
            <ToggleLink type="button" onClick={fillDemoCredentials}>
              Use Demo Credentials
            </ToggleLink>
          </DemoCredentials>
        )}
      </LoginCard>
    </LoginContainer>
  );
}

export default Login;
