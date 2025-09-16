const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Interview = require('../models/Interview');
const Event = require('../models/Event');

// Create a new interview
router.post('/', async (req, res) => {
  try {
    const {
      candidateName,
      candidateEmail,
      interviewerName,
      interviewerEmail,
      position,
      scheduledDate,
      duration,
      settings
    } = req.body;

    // Generate unique interview link
    const interviewLink = uuidv4();

    const interview = new Interview({
      candidateName,
      candidateEmail,
      interviewerName,
      interviewerEmail,
      position,
      scheduledDate: new Date(scheduledDate),
      duration,
      interviewLink,
      settings: {
        enableFaceDetection: settings?.enableFaceDetection ?? true,
        enableObjectDetection: settings?.enableObjectDetection ?? true,
        enableAudioMonitoring: settings?.enableAudioMonitoring ?? true,
        focusTimeoutThreshold: settings?.focusTimeoutThreshold ?? 5,
        faceAbsenceThreshold: settings?.faceAbsenceThreshold ?? 10,
        recordSession: settings?.recordSession ?? true
      }
    });

    await interview.save();

    res.status(201).json({
      success: true,
      data: interview,
      interviewUrl: `${process.env.CLIENT_URL}/interview/${interviewLink}`
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create interview',
      message: error.message
    });
  }
});

// Get all interviews for an interviewer
router.get('/interviewer/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { interviewerEmail: email.toLowerCase() };
    if (status) {
      query.status = status;
    }

    const interviews = await Interview.find(query)
      .sort({ scheduledDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Interview.countDocuments(query);

    res.json({
      success: true,
      data: interviews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: interviews.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interviews',
      message: error.message
    });
  }
});

// Get interview by link (for candidates)
router.get('/link/:interviewLink', async (req, res) => {
  try {
    const { interviewLink } = req.params;

    const interview = await Interview.findOne({ interviewLink })
      .select('-__v');

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found',
        message: 'Invalid interview link'
      });
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('Error fetching interview by link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview',
      message: error.message
    });
  }
});

// Get interview by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findById(id)
      .select('-__v');

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview',
      message: error.message
    });
  }
});

// Start an interview
router.patch('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    if (interview.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'Interview cannot be started',
        message: `Interview is currently ${interview.status}`
      });
    }

    interview.status = 'in-progress';
    interview.startTime = new Date();
    await interview.save();

    // Log interview start event
    const startEvent = new Event({
      interviewId: interview._id,
      eventType: 'interview-started',
      timestamp: interview.startTime,
      severity: 'low'
    });
    await startEvent.save();

    res.json({
      success: true,
      data: interview,
      message: 'Interview started successfully'
    });
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start interview',
      message: error.message
    });
  }
});

// End an interview
router.patch('/:id/end', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    if (interview.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: 'Interview cannot be ended',
        message: `Interview is currently ${interview.status}`
      });
    }

    interview.status = 'completed';
    interview.endTime = new Date();
    
    if (interview.startTime) {
      interview.actualDuration = Math.round(
        (interview.endTime - interview.startTime) / (1000 * 60)
      ); // Duration in minutes
    }

    if (notes) {
      interview.notes = notes;
    }

    // Update summary statistics
    await interview.updateSummary();
    
    // Calculate integrity score
    interview.calculateIntegrityScore();
    
    await interview.save();

    // Log interview end event
    const endEvent = new Event({
      interviewId: interview._id,
      eventType: 'interview-ended',
      timestamp: interview.endTime,
      duration: interview.actualDuration * 60, // Convert to seconds
      severity: 'low'
    });
    await endEvent.save();

    res.json({
      success: true,
      data: interview,
      message: 'Interview ended successfully'
    });
  } catch (error) {
    console.error('Error ending interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end interview',
      message: error.message
    });
  }
});

// Update interview settings
router.patch('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    const { settings } = req.body;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    interview.settings = { ...interview.settings, ...settings };
    await interview.save();

    res.json({
      success: true,
      data: interview,
      message: 'Interview settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating interview settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update interview settings',
      message: error.message
    });
  }
});

// Delete an interview
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Don't allow deletion of in-progress interviews
    if (interview.status === 'in-progress') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete interview in progress'
      });
    }

    // Delete associated events
    await Event.deleteMany({ interviewId: id });

    // Delete the interview
    await Interview.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Interview deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete interview',
      message: error.message
    });
  }
});

// Get interview statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const eventStats = await Event.getInterviewStats(id);
    const timeline = await Event.getEventTimeline(id);
    const criticalEvents = await Event.getCriticalEvents(id);

    res.json({
      success: true,
      data: {
        interview: interview.toObject(),
        eventStatistics: eventStats,
        timeline,
        criticalEvents,
        summary: interview.summary
      }
    });
  } catch (error) {
    console.error('Error fetching interview statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview statistics',
      message: error.message
    });
  }
});

module.exports = router;
