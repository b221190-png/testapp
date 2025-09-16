const express = require('express');
const router = express.Router();
const aiAnalytics = require('../services/aiAnalytics');
const Event = require('../models/Event');
const Interview = require('../models/Interview');

// Real-time AI prediction endpoint
router.get('/predict/:interviewId', async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Get recent events for prediction
    const recentEvents = await Event.find({ interviewId })
      .sort({ timestamp: -1 })
      .limit(10);

    // AI-powered next violation prediction
    const prediction = aiAnalytics.predictNextViolation(recentEvents, Date.now());
    
    // Real-time behavior analysis
    const behaviorAnalysis = aiAnalytics.analyzeBehaviorPattern(
      recentEvents, 
      (Date.now() - new Date(interview.startedAt || interview.scheduledDate).getTime()) / 1000
    );

    res.json({
      success: true,
      data: {
        interviewId,
        prediction,
        currentRiskLevel: behaviorAnalysis.riskLevel,
        confidenceLevel: behaviorAnalysis.confidenceLevel,
        recentInsights: behaviorAnalysis.behaviorInsights.slice(0, 3),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating AI prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI prediction',
      message: error.message
    });
  }
});

// Live AI monitoring endpoint
router.get('/monitor/:interviewId/live', async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Get all events for comprehensive analysis
    const events = await Event.find({ interviewId }).sort({ timestamp: 1 });
    
    // Generate comprehensive AI report
    const aiReport = aiAnalytics.generateAIReport(
      events, 
      (interview.actualDuration || interview.duration) * 60, 
      interview.candidateName
    );

    // Real-time risk assessment
    const currentRisk = aiAnalytics.assessRiskLevel(
      aiReport.aiAnalysis.integrityScore, 
      events
    );

    res.json({
      success: true,
      data: {
        interviewId,
        aiReport,
        liveMetrics: {
          currentRiskLevel: currentRisk,
          totalEvents: events.length,
          integrityScore: aiReport.aiAnalysis.integrityScore,
          behaviorInsights: aiReport.aiAnalysis.behaviorInsights,
          recommendations: aiReport.aiAnalysis.recommendedActions
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating live AI monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate live AI monitoring',
      message: error.message
    });
  }
});

// AI health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      aiModelStatus: 'operational',
      modelVersion: '1.0.0',
      capabilities: [
        'Behavioral Pattern Analysis',
        'Risk Assessment',
        'Violation Prediction',
        'Intelligent Recommendations',
        'Real-time Monitoring'
      ],
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
