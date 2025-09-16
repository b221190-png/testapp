const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Interview = require('../models/Interview');

// Log a new event
router.post('/', async (req, res) => {
  try {
    const {
      interviewId,
      eventType,
      duration,
      confidence,
      eventData,
      sessionId,
      sourceDevice
    } = req.body;

    // Validate that the interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Create the event
    const event = new Event({
      interviewId,
      eventType,
      timestamp: new Date(),
      duration,
      confidence,
      eventData,
      sessionId,
      sourceDevice
    });

    await event.save();

    // Emit real-time event via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`interview-${interviewId}`).emit('real-time-alert', {
        eventId: event._id,
        eventType: event.eventType,
        timestamp: event.timestamp,
        severity: event.severity,
        description: event.description,
        eventData: event.eventData
      });
    }

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error logging event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log event',
      message: error.message
    });
  }
});

// Get events for an interview
router.get('/interview/:interviewId', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { 
      eventType, 
      severity, 
      page = 1, 
      limit = 50, 
      startTime, 
      endTime,
      resolved
    } = req.query;

    // Build query
    const query = { interviewId };
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    if (severity) {
      query.severity = severity;
    }
    
    if (resolved !== undefined) {
      query.resolved = resolved === 'true';
    }
    
    if (startTime && endTime) {
      query.timestamp = {
        $gte: new Date(startTime),
        $lte: new Date(endTime)
      };
    }

    const events = await Event.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: events,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: events.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate('interviewId', 'candidateName position scheduledDate')
      .select('-__v');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event',
      message: error.message
    });
  }
});

// Mark event as resolved
router.patch('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolvedBy, notes } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    await event.resolve(resolvedBy, notes);

    res.json({
      success: true,
      data: event,
      message: 'Event marked as resolved'
    });
  } catch (error) {
    console.error('Error resolving event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve event',
      message: error.message
    });
  }
});

// Get critical events for an interview
router.get('/interview/:interviewId/critical', async (req, res) => {
  try {
    const { interviewId } = req.params;

    const criticalEvents = await Event.getCriticalEvents(interviewId);

    res.json({
      success: true,
      data: criticalEvents
    });
  } catch (error) {
    console.error('Error fetching critical events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch critical events',
      message: error.message
    });
  }
});

// Get event statistics for an interview
router.get('/interview/:interviewId/stats', async (req, res) => {
  try {
    const { interviewId } = req.params;

    const stats = await Event.getInterviewStats(interviewId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event statistics',
      message: error.message
    });
  }
});

// Get event timeline for an interview
router.get('/interview/:interviewId/timeline', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { startTime, endTime } = req.query;

    const timeline = await Event.getEventTimeline(interviewId, startTime, endTime);

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Error fetching event timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event timeline',
      message: error.message
    });
  }
});

// Bulk log events (for batch processing)
router.post('/bulk', async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Events array is required and cannot be empty'
      });
    }

    // Validate that all interviews exist
    const interviewIds = [...new Set(events.map(e => e.interviewId))];
    const interviews = await Interview.find({ _id: { $in: interviewIds } });
    
    if (interviews.length !== interviewIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more interviews not found'
      });
    }

    // Add timestamp to all events
    const eventsWithTimestamp = events.map(event => ({
      ...event,
      timestamp: event.timestamp || new Date()
    }));

    const savedEvents = await Event.insertMany(eventsWithTimestamp);

    // Emit real-time events for all interviews
    const io = req.app.get('io');
    if (io) {
      savedEvents.forEach(event => {
        io.to(`interview-${event.interviewId}`).emit('real-time-alert', {
          eventId: event._id,
          eventType: event.eventType,
          timestamp: event.timestamp,
          severity: event.severity,
          description: event.description,
          eventData: event.eventData
        });
      });
    }

    res.status(201).json({
      success: true,
      data: savedEvents,
      count: savedEvents.length
    });
  } catch (error) {
    console.error('Error bulk logging events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk log events',
      message: error.message
    });
  }
});

// Delete old events (cleanup endpoint)
router.delete('/cleanup', async (req, res) => {
  try {
    const { olderThanDays = 30 } = req.query;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));

    const result = await Event.deleteMany({
      timestamp: { $lt: cutoffDate },
      severity: { $in: ['low', 'medium'] } // Only delete non-critical events
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old events`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup events',
      message: error.message
    });
  }
});

module.exports = router;
