const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs').promises;
const path = require('path');
const Interview = require('../models/Interview');
const Event = require('../models/Event');
const aiAnalytics = require('../services/aiAnalytics');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../reports');

const ensureReportsDir = async () => {
  try {
    await fs.access(reportsDir);
  } catch {
    await fs.mkdir(reportsDir, { recursive: true });
  }
};

// Generate PDF report
router.get('/interview/:interviewId/pdf', async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Get events and statistics
    await interview.updateSummary();
    const events = await Event.find({ interviewId }).sort({ timestamp: 1 });
    const stats = await Event.getInterviewStats(interviewId);

    await ensureReportsDir();

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const filename = `interview-report-${interviewId}-${Date.now()}.pdf`;
    const filepath = path.join(reportsDir, filename);

    // Pipe PDF to file
    doc.pipe(require('fs').createWriteStream(filepath));

    // Header
    doc.fontSize(20).text('Video Proctoring Report', { align: 'center' });
    doc.moveDown();

    // Interview Details
    doc.fontSize(16).text('Interview Details', { underline: true });
    doc.fontSize(12)
       .text(`Candidate: ${interview.candidateName}`)
       .text(`Position: ${interview.position}`)
       .text(`Date: ${interview.scheduledDate.toDateString()}`)
       .text(`Duration: ${interview.actualDuration || interview.duration} minutes`)
       .text(`Status: ${interview.status}`)
       .text(`Integrity Score: ${interview.integrityScore || 'N/A'}/100`);
    
    doc.moveDown();

    // Summary Statistics
    doc.fontSize(16).text('Proctoring Summary', { underline: true });
    doc.fontSize(12)
       .text(`Focus Lost Events: ${interview.summary.totalFocusLostEvents}`)
       .text(`Object Detections: ${interview.summary.totalObjectDetections}`)
       .text(`Multiple Face Events: ${interview.summary.totalMultipleFaceEvents}`)
       .text(`Audio Violations: ${interview.summary.totalAudioViolations}`)
       .text(`Focus Percentage: ${interview.summary.focusPercentage}%`);

    doc.moveDown();

    // Event Details
    doc.fontSize(16).text('Event Log', { underline: true });
    doc.fontSize(10);

    if (events.length > 0) {
      events.forEach((event, index) => {
        if (index > 0 && index % 20 === 0) {
          doc.addPage();
        }
        
        const timeStr = event.timestamp.toLocaleTimeString();
        const description = event.description || event.eventType;
        
        doc.text(`${timeStr} - ${description} (${event.severity})`);
        
        if (event.eventData && Object.keys(event.eventData).length > 0) {
          doc.text(`   Details: ${JSON.stringify(event.eventData, null, 2)}`);
        }
      });
    } else {
      doc.text('No events recorded during this interview.');
    }

    doc.moveDown();

    // Recommendations
    doc.addPage();
    doc.fontSize(16).text('Recommendations', { underline: true });
    doc.fontSize(12);

    let recommendations = [];
    
    if (interview.integrityScore >= 90) {
      recommendations.push('• Excellent conduct throughout the interview');
      recommendations.push('• No significant violations detected');
    } else if (interview.integrityScore >= 70) {
      recommendations.push('• Generally good conduct with minor issues');
      recommendations.push('• Consider follow-up if needed');
    } else {
      recommendations.push('• Multiple violations detected');
      recommendations.push('• Recommend detailed review of the session');
      recommendations.push('• Consider re-interview if violations are significant');
    }

    if (interview.summary.totalObjectDetections > 0) {
      recommendations.push('• Unauthorized objects were detected during the interview');
    }

    if (interview.summary.totalMultipleFaceEvents > 0) {
      recommendations.push('• Multiple faces were detected - possible assistance');
    }

    if (interview.summary.focusPercentage < 70) {
      recommendations.push('• Low focus percentage - candidate was frequently distracted');
    }

    recommendations.forEach(rec => {
      doc.text(rec);
    });

    // Footer
    doc.fontSize(10)
       .text(`Report generated on ${new Date().toISOString()}`, 50, doc.page.height - 50);

    doc.end();

    // Wait for PDF to be written
    setTimeout(() => {
      res.download(filepath, `interview-report-${interview.candidateName.replace(/\s+/g, '-')}.pdf`, (err) => {
        if (err) {
          console.error('Error downloading PDF:', err);
          res.status(500).json({
            success: false,
            error: 'Failed to download PDF report'
          });
        }
        
        // Cleanup file after download
        fs.unlink(filepath).catch(console.error);
      });
    }, 1000);

    // Update interview report status
    interview.reportGenerated = true;
    interview.reportPath = filepath;
    await interview.save();

  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF report',
      message: error.message
    });
  }
});

// Generate CSV report
router.get('/interview/:interviewId/csv', async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const events = await Event.find({ interviewId }).sort({ timestamp: 1 });

    await ensureReportsDir();

    const filename = `interview-events-${interviewId}-${Date.now()}.csv`;
    const filepath = path.join(reportsDir, filename);

    // Prepare CSV data
    const csvData = events.map(event => ({
      timestamp: event.timestamp.toISOString(),
      eventType: event.eventType,
      severity: event.severity,
      duration: event.duration || '',
      confidence: event.confidence || '',
      description: event.description,
      objectType: event.eventData?.objectType || '',
      faceCount: event.eventData?.faceCount || '',
      audioLevel: event.eventData?.audioLevel || '',
      resolved: event.resolved,
      notes: event.notes || ''
    }));

    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'eventType', title: 'Event Type' },
        { id: 'severity', title: 'Severity' },
        { id: 'duration', title: 'Duration (s)' },
        { id: 'confidence', title: 'Confidence' },
        { id: 'description', title: 'Description' },
        { id: 'objectType', title: 'Object Type' },
        { id: 'faceCount', title: 'Face Count' },
        { id: 'audioLevel', title: 'Audio Level' },
        { id: 'resolved', title: 'Resolved' },
        { id: 'notes', title: 'Notes' }
      ]
    });

    await csvWriter.writeRecords(csvData);

    res.download(filepath, `interview-events-${interview.candidateName.replace(/\s+/g, '-')}.csv`, (err) => {
      if (err) {
        console.error('Error downloading CSV:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to download CSV report'
        });
      }
      
      // Cleanup file after download
      fs.unlink(filepath).catch(console.error);
    });

  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSV report',
      message: error.message
    });
  }
});

// Get report summary data
router.get('/interview/:interviewId/summary', async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Update summary statistics
    await interview.updateSummary();
    interview.calculateIntegrityScore();
    await interview.save();

    const events = await Event.find({ interviewId }).sort({ timestamp: 1 });
    const stats = await Event.getInterviewStats(interviewId);
    const timeline = await Event.getEventTimeline(interviewId);

    // 🧠 AI-POWERED ANALYSIS
    const aiAnalysis = aiAnalytics.analyzeBehaviorPattern(events, (interview.actualDuration || interview.duration) * 60);
    const aiReport = aiAnalytics.generateAIReport(events, (interview.actualDuration || interview.duration) * 60, interview.candidateName);

    // Calculate additional metrics
    const totalDuration = interview.actualDuration || interview.duration;
    const eventFrequency = events.length / (totalDuration || 1);
    
    // Get severity breakdown
    const severityBreakdown = {
      low: events.filter(e => e.severity === 'low').length,
      medium: events.filter(e => e.severity === 'medium').length,
      high: events.filter(e => e.severity === 'high').length,
      critical: events.filter(e => e.severity === 'critical').length
    };

    // Get hourly distribution
    const hourlyDistribution = {};
    events.forEach(event => {
      const hour = event.timestamp.getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        interview: {
          id: interview._id,
          candidateName: interview.candidateName,
          position: interview.position,
          scheduledDate: interview.scheduledDate,
          duration: totalDuration,
          status: interview.status,
          integrityScore: aiAnalysis.integrityScore || interview.integrityScore // Use AI score if available
        },
        summary: interview.summary,
        statistics: {
          totalEvents: events.length,
          eventFrequency: Math.round(eventFrequency * 100) / 100,
          severityBreakdown,
          hourlyDistribution
        },
        eventStats: stats,
        timeline: timeline.slice(0, 100), // Limit timeline for performance
        recommendations: aiAnalysis.recommendedActions.length > 0 ? aiAnalysis.recommendedActions : generateRecommendations(interview),
        // 🧠 AI-POWERED INSIGHTS
        aiInsights: {
          behaviorAnalysis: aiAnalysis,
          riskLevel: aiAnalysis.riskLevel,
          confidenceLevel: aiAnalysis.confidenceLevel,
          behaviorInsights: aiAnalysis.behaviorInsights,
          aiRecommendations: aiAnalysis.recommendedActions,
          modelVersion: aiReport.modelVersion,
          processingTimestamp: aiReport.timestamp
        }
      }
    });

  } catch (error) {
    console.error('Error generating report summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report summary',
      message: error.message
    });
  }
});

// Batch report generation for multiple interviews
router.post('/batch', async (req, res) => {
  try {
    const { interviewIds, format = 'csv' } = req.body;

    if (!Array.isArray(interviewIds) || interviewIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Interview IDs array is required'
      });
    }

    const interviews = await Interview.find({ _id: { $in: interviewIds } });
    
    if (interviews.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No interviews found'
      });
    }

    await ensureReportsDir();

    if (format === 'csv') {
      // Generate batch CSV report
      const filename = `batch-report-${Date.now()}.csv`;
      const filepath = path.join(reportsDir, filename);

      const batchData = [];
      
      for (const interview of interviews) {
        await interview.updateSummary();
        interview.calculateIntegrityScore();
        
        batchData.push({
          interviewId: interview._id,
          candidateName: interview.candidateName,
          candidateEmail: interview.candidateEmail,
          position: interview.position,
          scheduledDate: interview.scheduledDate.toISOString(),
          duration: interview.actualDuration || interview.duration,
          status: interview.status,
          integrityScore: interview.integrityScore,
          focusLostEvents: interview.summary.totalFocusLostEvents,
          objectDetections: interview.summary.totalObjectDetections,
          multipleFaceEvents: interview.summary.totalMultipleFaceEvents,
          audioViolations: interview.summary.totalAudioViolations,
          focusPercentage: interview.summary.focusPercentage
        });
      }

      const csvWriter = createCsvWriter({
        path: filepath,
        header: [
          { id: 'interviewId', title: 'Interview ID' },
          { id: 'candidateName', title: 'Candidate Name' },
          { id: 'candidateEmail', title: 'Candidate Email' },
          { id: 'position', title: 'Position' },
          { id: 'scheduledDate', title: 'Scheduled Date' },
          { id: 'duration', title: 'Duration (min)' },
          { id: 'status', title: 'Status' },
          { id: 'integrityScore', title: 'Integrity Score' },
          { id: 'focusLostEvents', title: 'Focus Lost Events' },
          { id: 'objectDetections', title: 'Object Detections' },
          { id: 'multipleFaceEvents', title: 'Multiple Face Events' },
          { id: 'audioViolations', title: 'Audio Violations' },
          { id: 'focusPercentage', title: 'Focus Percentage' }
        ]
      });

      await csvWriter.writeRecords(batchData);

      res.download(filepath, `batch-interview-report.csv`, (err) => {
        if (err) {
          console.error('Error downloading batch CSV:', err);
          res.status(500).json({
            success: false,
            error: 'Failed to download batch report'
          });
        }
        
        fs.unlink(filepath).catch(console.error);
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Unsupported format. Only CSV is supported for batch reports.'
      });
    }

  } catch (error) {
    console.error('Error generating batch report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch report',
      message: error.message
    });
  }
});

// Helper function to generate recommendations
function generateRecommendations(interview) {
  const recommendations = [];
  
  if (interview.integrityScore >= 90) {
    recommendations.push({
      type: 'positive',
      message: 'Excellent interview conduct with minimal violations'
    });
  } else if (interview.integrityScore >= 70) {
    recommendations.push({
      type: 'warning',
      message: 'Good overall conduct with some minor issues to review'
    });
  } else {
    recommendations.push({
      type: 'critical',
      message: 'Multiple violations detected - detailed review recommended'
    });
  }

  if (interview.summary.totalObjectDetections > 3) {
    recommendations.push({
      type: 'warning',
      message: 'Multiple unauthorized objects detected during interview'
    });
  }

  if (interview.summary.totalMultipleFaceEvents > 0) {
    recommendations.push({
      type: 'critical',
      message: 'Additional people detected in video feed - possible external assistance'
    });
  }

  if (interview.summary.focusPercentage < 60) {
    recommendations.push({
      type: 'warning',
      message: 'Low focus percentage indicates frequent distractions'
    });
  }

  if (interview.summary.totalAudioViolations > 2) {
    recommendations.push({
      type: 'warning',
      message: 'Background voices detected - ensure interview environment is secure'
    });
  }

  return recommendations;
}

module.exports = router;
