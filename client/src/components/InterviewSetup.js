import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { interviewAPI, apiUtils } from '../services/api';

const SetupContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.xl};
`;

const Header = styled.div`
  max-width: 800px;
  margin: 0 auto ${props => props.theme.spacing.xl};
  text-align: center;
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text};
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textLight};
  font-size: 1.1rem;
`;

const FormCard = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: ${props => props.theme.colors.surface};
  border-radius: 0.75rem;
  padding: ${props => props.theme.spacing.xxl};
  box-shadow: 0 4px 12px ${props => props.theme.colors.shadow};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || '1fr'};
  gap: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
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

const Select = styled.select`
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 0.5rem;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const SettingsSection = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: 0.5rem;
  padding: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.lg};
`;

const SettingsTitle = styled.h3`
  color: ${props => props.theme.colors.text};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: ${props => props.theme.colors.primary};
`;

const CheckboxLabel = styled.label`
  color: ${props => props.theme.colors.text};
  font-size: 0.9rem;
  cursor: pointer;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.xl};
`;

const Button = styled.button`
  background: ${props => {
    if (props.variant === 'secondary') return props.theme.colors.secondary;
    if (props.variant === 'danger') return props.theme.colors.error;
    return props.theme.colors.primary;
  }};
  color: white;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    opacity: 0.9;
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
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SuccessMessage = styled.div`
  background: ${props => props.theme.colors.success};
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const InterviewUrl = styled.div`
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.md};
  border-radius: 0.5rem;
  border: 2px dashed ${props => props.theme.colors.primary};
  margin-top: ${props => props.theme.spacing.md};
`;

const UrlLabel = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const UrlText = styled.div`
  font-family: monospace;
  color: ${props => props.theme.colors.primary};
  word-break: break-all;
  padding: ${props => props.theme.spacing.sm};
  background: white;
  border-radius: 0.25rem;
`;

function InterviewSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [interviewUrl, setInterviewUrl] = useState('');
  
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    position: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    settings: {
      enableFaceDetection: true,
      enableObjectDetection: true,
      enableAudioMonitoring: true,
      focusTimeoutThreshold: 5,
      faceAbsenceThreshold: 10,
      recordSession: true
    }
  });

  useEffect(() => {
    if (editId) {
      loadInterviewForEdit(editId);
    }
  }, [editId]);

  const loadInterviewForEdit = async (id) => {
    try {
      setLoading(true);
      const result = await interviewAPI.getById(id);
      const interview = result.data;
      
      const scheduledDate = new Date(interview.scheduledDate);
      const dateStr = scheduledDate.toISOString().split('T')[0];
      const timeStr = scheduledDate.toTimeString().substr(0, 5);
      
      setFormData({
        candidateName: interview.candidateName,
        candidateEmail: interview.candidateEmail,
        position: interview.position,
        scheduledDate: dateStr,
        scheduledTime: timeStr,
        duration: interview.duration,
        settings: interview.settings
      });
    } catch (err) {
      setError('Failed to load interview for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingName = name.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
      }));
    }
    
    // Clear messages when user makes changes
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      
      const interviewData = {
        candidateName: formData.candidateName,
        candidateEmail: formData.candidateEmail,
        interviewerName: apiUtils.getUserData().name,
        interviewerEmail: apiUtils.getUserData().email,
        position: formData.position,
        scheduledDate: scheduledDateTime.toISOString(),
        duration: formData.duration,
        settings: formData.settings
      };

      let result;
      if (editId) {
        result = await interviewAPI.updateSettings(editId, formData.settings);
        setSuccess('Interview updated successfully!');
      } else {
        result = await interviewAPI.create(interviewData);
        setSuccess('Interview scheduled successfully!');
        setInterviewUrl(result.interviewUrl);
      }
      
      // Reset form for new interviews
      if (!editId) {
        setFormData({
          candidateName: '',
          candidateEmail: '',
          position: '',
          scheduledDate: '',
          scheduledTime: '',
          duration: 60,
          settings: {
            enableFaceDetection: true,
            enableObjectDetection: true,
            enableAudioMonitoring: true,
            focusTimeoutThreshold: 5,
            faceAbsenceThreshold: 10,
            recordSession: true
          }
        });
      }
    } catch (err) {
      setError(`Failed to ${editId ? 'update' : 'schedule'} interview. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Interview URL copied to clipboard!');
    });
  };

  return (
    <SetupContainer>
      <Header>
        <Title>{editId ? 'Edit Interview' : 'Schedule New Interview'}</Title>
        <Subtitle>
          {editId ? 'Update interview settings' : 'Set up a new proctored interview session'}
        </Subtitle>
      </Header>

      <FormCard>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <Form onSubmit={handleSubmit}>
          <FormRow columns="1fr 1fr">
            <FormGroup>
              <Label htmlFor="candidateName">Candidate Name *</Label>
              <Input
                id="candidateName"
                name="candidateName"
                type="text"
                value={formData.candidateName}
                onChange={handleInputChange}
                required
                disabled={editId} // Can't change candidate in edit mode
                placeholder="Enter candidate's full name"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="candidateEmail">Candidate Email *</Label>
              <Input
                id="candidateEmail"
                name="candidateEmail"
                type="email"
                value={formData.candidateEmail}
                onChange={handleInputChange}
                required
                disabled={editId} // Can't change candidate in edit mode
                placeholder="candidate@example.com"
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              name="position"
              type="text"
              value={formData.position}
              onChange={handleInputChange}
              required
              disabled={editId} // Can't change position in edit mode
              placeholder="e.g., Software Engineer, Product Manager"
            />
          </FormGroup>

          <FormRow columns="1fr 1fr 1fr">
            <FormGroup>
              <Label htmlFor="scheduledDate">Interview Date *</Label>
              <Input
                id="scheduledDate"
                name="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={handleInputChange}
                required
                disabled={editId} // Can't change date in edit mode
                min={new Date().toISOString().split('T')[0]}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="scheduledTime">Interview Time *</Label>
              <Input
                id="scheduledTime"
                name="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={handleInputChange}
                required
                disabled={editId} // Can't change time in edit mode
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                disabled={editId} // Can't change duration in edit mode
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
                <option value={180}>180 minutes</option>
              </Select>
            </FormGroup>
          </FormRow>

          <SettingsSection>
            <SettingsTitle>Proctoring Settings</SettingsTitle>
            
            <CheckboxGroup>
              <CheckboxRow>
                <Checkbox
                  id="enableFaceDetection"
                  name="settings.enableFaceDetection"
                  type="checkbox"
                  checked={formData.settings.enableFaceDetection}
                  onChange={handleInputChange}
                />
                <CheckboxLabel htmlFor="enableFaceDetection">
                  Enable Face Detection & Focus Monitoring
                </CheckboxLabel>
              </CheckboxRow>

              <CheckboxRow>
                <Checkbox
                  id="enableObjectDetection"
                  name="settings.enableObjectDetection"
                  type="checkbox"
                  checked={formData.settings.enableObjectDetection}
                  onChange={handleInputChange}
                />
                <CheckboxLabel htmlFor="enableObjectDetection">
                  Enable Object Detection (phones, books, etc.)
                </CheckboxLabel>
              </CheckboxRow>

              <CheckboxRow>
                <Checkbox
                  id="enableAudioMonitoring"
                  name="settings.enableAudioMonitoring"
                  type="checkbox"
                  checked={formData.settings.enableAudioMonitoring}
                  onChange={handleInputChange}
                />
                <CheckboxLabel htmlFor="enableAudioMonitoring">
                  Enable Audio Monitoring (background voices)
                </CheckboxLabel>
              </CheckboxRow>

              <CheckboxRow>
                <Checkbox
                  id="recordSession"
                  name="settings.recordSession"
                  type="checkbox"
                  checked={formData.settings.recordSession}
                  onChange={handleInputChange}
                />
                <CheckboxLabel htmlFor="recordSession">
                  Record Interview Session
                </CheckboxLabel>
              </CheckboxRow>
            </CheckboxGroup>

            <FormRow columns="1fr 1fr" style={{ marginTop: '1rem' }}>
              <FormGroup>
                <Label htmlFor="focusTimeoutThreshold">Focus Loss Threshold (seconds)</Label>
                <Input
                  id="focusTimeoutThreshold"
                  name="settings.focusTimeoutThreshold"
                  type="number"
                  min="3"
                  max="30"
                  value={formData.settings.focusTimeoutThreshold}
                  onChange={handleInputChange}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="faceAbsenceThreshold">Face Absence Threshold (seconds)</Label>
                <Input
                  id="faceAbsenceThreshold"
                  name="settings.faceAbsenceThreshold"
                  type="number"
                  min="5"
                  max="60"
                  value={formData.settings.faceAbsenceThreshold}
                  onChange={handleInputChange}
                />
              </FormGroup>
            </FormRow>
          </SettingsSection>

          <ButtonRow>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : (editId ? 'Update Interview' : 'Schedule Interview')}
            </Button>
          </ButtonRow>
        </Form>

        {interviewUrl && (
          <InterviewUrl>
            <UrlLabel>Interview URL (share with candidate):</UrlLabel>
            <UrlText>{interviewUrl}</UrlText>
            <Button 
              type="button" 
              style={{ marginTop: '0.5rem' }}
              onClick={() => copyToClipboard(interviewUrl)}
            >
              Copy URL
            </Button>
          </InterviewUrl>
        )}
      </FormCard>
    </SetupContainer>
  );
}

export default InterviewSetup;
