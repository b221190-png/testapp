const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'interview-started',
      'interview-ended',
      'focus-lost',
      'focus-gained',
      'face-absent',
      'face-detected',
      'multiple-faces',
      'object-detected',
      'audio-violation',
      'eye-closure-detected',
      'drowsiness-detected',
      'system-alert',
      'camera-permission-denied',
      'microphone-permission-denied',
      'connection-lost',
      'connection-restored'
    ]
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number, // Duration in seconds for events that have duration
    min: 0
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  confidence: {
    type: Number, // AI detection confidence score (0-1)
    min: 0,
    max: 1
  },
  eventData: {
    // Flexible object to store event-specific data
    objectType: String, // For object-detected events (phone, book, etc.)
    objectCount: Number,
    faceCount: Number, // For multiple-faces events
    audioLevel: Number, // For audio-violation events
    eyeClosureDuration: Number, // For eye-closure events
    coordinates: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: String // 'system' or 'interviewer'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  sessionId: {
    type: String, // For grouping related events in a session
    index: true
  },
  sourceDevice: {
    userAgent: String,
    platform: String,
    browser: String,
    screenResolution: String,
    deviceType: String // 'desktop', 'mobile', 'tablet'
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
eventSchema.index({ interviewId: 1, timestamp: 1 });
eventSchema.index({ interviewId: 1, eventType: 1 });
eventSchema.index({ eventType: 1, timestamp: 1 });
eventSchema.index({ severity: 1, resolved: 1 });

// Static method to get event statistics for an interview
eventSchema.statics.getInterviewStats = async function(interviewId) {
  const stats = await this.aggregate([
    { $match: { interviewId: new mongoose.Types.ObjectId(interviewId) } },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        maxDuration: { $max: '$duration' },
        avgConfidence: { $avg: '$confidence' },
        severityDistribution: {
          $push: '$severity'
        }
      }
    }
  ]);

  // Calculate severity distribution
  const processedStats = stats.map(stat => ({
    ...stat,
    severityCount: {
      low: stat.severityDistribution.filter(s => s === 'low').length,
      medium: stat.severityDistribution.filter(s => s === 'medium').length,
      high: stat.severityDistribution.filter(s => s === 'high').length,
      critical: stat.severityDistribution.filter(s => s === 'critical').length
    }
  }));

  return processedStats;
};

// Static method to get timeline of events
eventSchema.statics.getEventTimeline = async function(interviewId, startTime, endTime) {
  const query = { interviewId: new mongoose.Types.ObjectId(interviewId) };
  
  if (startTime && endTime) {
    query.timestamp = {
      $gte: new Date(startTime),
      $lte: new Date(endTime)
    };
  }

  return this.find(query)
    .sort({ timestamp: 1 })
    .select('eventType timestamp duration severity eventData confidence')
    .lean();
};

// Static method to get critical events
eventSchema.statics.getCriticalEvents = async function(interviewId) {
  return this.find({
    interviewId: new mongoose.Types.ObjectId(interviewId),
    severity: { $in: ['high', 'critical'] },
    resolved: false
  })
  .sort({ timestamp: -1 })
  .lean();
};

// Instance method to mark event as resolved
eventSchema.methods.resolve = function(resolvedBy = 'system', notes = '') {
  this.resolved = true;
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

// Virtual for getting human-readable event description
eventSchema.virtual('description').get(function() {
  const descriptions = {
    'interview-started': 'Interview session started',
    'interview-ended': 'Interview session ended',
    'focus-lost': 'Candidate stopped looking at screen',
    'focus-gained': 'Candidate resumed looking at screen',
    'face-absent': 'No face detected in video feed',
    'face-detected': 'Face detected in video feed',
    'multiple-faces': `Multiple faces detected (${this.eventData?.faceCount || 'unknown'} faces)`,
    'object-detected': `Unauthorized object detected: ${this.eventData?.objectType || 'unknown object'}`,
    'audio-violation': 'Background voices or unauthorized audio detected',
    'eye-closure-detected': 'Prolonged eye closure detected',
    'drowsiness-detected': 'Signs of drowsiness detected',
    'system-alert': 'System generated alert',
    'camera-permission-denied': 'Camera access permission denied',
    'microphone-permission-denied': 'Microphone access permission denied',
    'connection-lost': 'Network connection lost',
    'connection-restored': 'Network connection restored'
  };

  return descriptions[this.eventType] || 'Unknown event type';
});

// Pre-save middleware to set severity based on event type
eventSchema.pre('save', function(next) {
  if (!this.severity) {
    const severityMap = {
      'interview-started': 'low',
      'interview-ended': 'low',
      'focus-lost': 'medium',
      'focus-gained': 'low',
      'face-absent': 'high',
      'face-detected': 'low',
      'multiple-faces': 'critical',
      'object-detected': 'high',
      'audio-violation': 'medium',
      'eye-closure-detected': 'medium',
      'drowsiness-detected': 'high',
      'system-alert': 'medium',
      'camera-permission-denied': 'critical',
      'microphone-permission-denied': 'high',
      'connection-lost': 'high',
      'connection-restored': 'low'
    };

    this.severity = severityMap[this.eventType] || 'medium';
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
