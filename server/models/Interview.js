const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  candidateEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  interviewerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  interviewerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  position: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    required: true,
    min: 15,
    max: 180
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  actualDuration: {
    type: Number // Actual duration in minutes
  },
  interviewLink: {
    type: String,
    unique: true,
    required: true
  },
  settings: {
    enableFaceDetection: {
      type: Boolean,
      default: true
    },
    enableObjectDetection: {
      type: Boolean,
      default: true
    },
    enableAudioMonitoring: {
      type: Boolean,
      default: true
    },
    focusTimeoutThreshold: {
      type: Number,
      default: 5 // seconds
    },
    faceAbsenceThreshold: {
      type: Number,
      default: 10 // seconds
    },
    recordSession: {
      type: Boolean,
      default: true
    }
  },
  integrityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  summary: {
    totalFocusLostEvents: {
      type: Number,
      default: 0
    },
    totalObjectDetections: {
      type: Number,
      default: 0
    },
    totalMultipleFaceEvents: {
      type: Number,
      default: 0
    },
    totalAudioViolations: {
      type: Number,
      default: 0
    },
    focusPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    maxConsecutiveFocusLoss: {
      type: Number,
      default: 0
    }
  },
  videoRecordingPath: {
    type: String
  },
  reportGenerated: {
    type: Boolean,
    default: false
  },
  reportPath: {
    type: String
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Index for efficient querying
interviewSchema.index({ candidateEmail: 1 });
interviewSchema.index({ interviewerEmail: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ scheduledDate: 1 });
interviewSchema.index({ interviewLink: 1 });

// Virtual for getting interview URL
interviewSchema.virtual('interviewUrl').get(function() {
  return `${process.env.CLIENT_URL}/interview/${this.interviewLink}`;
});

// Method to calculate integrity score
interviewSchema.methods.calculateIntegrityScore = function() {
  let score = 100;
  
  // Deductions based on violations
  score -= Math.min(this.summary.totalFocusLostEvents * 2, 30); // Max 30 points for focus loss
  score -= Math.min(this.summary.totalObjectDetections * 5, 25); // Max 25 points for objects
  score -= Math.min(this.summary.totalMultipleFaceEvents * 3, 20); // Max 20 points for multiple faces
  score -= Math.min(this.summary.totalAudioViolations * 3, 15); // Max 15 points for audio
  
  // Additional deduction for low focus percentage
  if (this.summary.focusPercentage < 70) {
    score -= (70 - this.summary.focusPercentage) * 0.3;
  }
  
  // Additional deduction for long consecutive focus loss
  if (this.summary.maxConsecutiveFocusLoss > 30) {
    score -= Math.min((this.summary.maxConsecutiveFocusLoss - 30) * 0.5, 10);
  }
  
  this.integrityScore = Math.max(0, Math.round(score));
  return this.integrityScore;
};

// Method to update summary statistics
interviewSchema.methods.updateSummary = async function() {
  const Event = mongoose.model('Event');
  
  const events = await Event.find({ interviewId: this._id });
  
  this.summary.totalFocusLostEvents = events.filter(e => 
    e.eventType === 'focus-lost' || e.eventType === 'face-absent'
  ).length;
  
  this.summary.totalObjectDetections = events.filter(e => 
    e.eventType === 'object-detected'
  ).length;
  
  this.summary.totalMultipleFaceEvents = events.filter(e => 
    e.eventType === 'multiple-faces'
  ).length;
  
  this.summary.totalAudioViolations = events.filter(e => 
    e.eventType === 'audio-violation'
  ).length;
  
  // Calculate focus percentage
  const focusEvents = events.filter(e => 
    e.eventType === 'focus-lost' || e.eventType === 'focus-gained'
  );
  
  if (focusEvents.length > 0 && this.actualDuration) {
    let totalFocusLostTime = 0;
    let currentFocusLostStart = null;
    
    focusEvents.forEach(event => {
      if (event.eventType === 'focus-lost') {
        currentFocusLostStart = event.timestamp;
      } else if (event.eventType === 'focus-gained' && currentFocusLostStart) {
        totalFocusLostTime += (event.timestamp - currentFocusLostStart) / 1000; // Convert to seconds
        currentFocusLostStart = null;
      }
    });
    
    const totalDurationSeconds = this.actualDuration * 60;
    this.summary.focusPercentage = Math.max(0, 
      Math.round(((totalDurationSeconds - totalFocusLostTime) / totalDurationSeconds) * 100)
    );
  } else {
    this.summary.focusPercentage = 100;
  }
  
  return this.save();
};

module.exports = mongoose.model('Interview', interviewSchema);
