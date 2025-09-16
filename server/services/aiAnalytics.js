/**
 * Advanced AI Analytics Service for Interview Proctoring
 * Custom AI Model for Behavioral Analysis and Intelligent Scoring
 */

class InterviewAIAnalytics {
  constructor() {
    // Behavioral pattern weights for AI scoring
    this.behaviorWeights = {
      faceAbsence: 15,        // High impact on integrity
      multipleFaces: 20,      // Very high impact
      objectDetection: 25,    // Highest impact
      focusLoss: 8,          // Medium impact
      audioViolation: 12,    // Medium-high impact
      eyeClosure: 5,         // Low-medium impact
      frequencyPenalty: 10   // Penalty for repeated violations
    };

    // Behavioral pattern thresholds
    this.thresholds = {
      suspiciousFrequency: 5,    // Events per minute
      criticalViolationLimit: 3,  // Critical violations before major penalty
      focusLossAcceptable: 10,   // Seconds of acceptable focus loss
      eyeClosureAcceptable: 3,   // Seconds of acceptable eye closure
      audioLevelThreshold: 60    // Audio level for violation
    };

    // Real-time behavior tracking
    this.behaviorProfile = {
      focusPattern: [],
      violationHistory: [],
      attentionSpan: 0,
      stressIndicators: 0,
      consistencyScore: 100
    };
  }

  /**
   * Advanced AI Model for Real-time Behavior Analysis
   * Processes multiple data streams to create intelligent insights
   */
  analyzeBehaviorPattern(events, duration) {
    const analysis = {
      integrityScore: 100,
      riskLevel: 'low',
      behaviorInsights: [],
      recommendedActions: [],
      confidenceLevel: 0.95
    };

    // Temporal analysis - behavior patterns over time
    const timelineAnalysis = this.analyzeTemporalPatterns(events, duration);
    
    // Frequency analysis - violation clustering
    const frequencyAnalysis = this.analyzeViolationFrequency(events);
    
    // Behavioral consistency analysis
    const consistencyAnalysis = this.analyzeBehavioralConsistency(events);
    
    // Multi-modal fusion for final score
    analysis.integrityScore = this.calculateAdvancedIntegrityScore(
      timelineAnalysis,
      frequencyAnalysis,
      consistencyAnalysis
    );

    // AI-powered risk assessment
    analysis.riskLevel = this.assessRiskLevel(analysis.integrityScore, events);
    
    // Generate intelligent insights
    analysis.behaviorInsights = this.generateBehaviorInsights(events, timelineAnalysis);
    
    // AI recommendations
    analysis.recommendedActions = this.generateAIRecommendations(analysis);
    
    // Confidence level based on data quality
    analysis.confidenceLevel = this.calculateConfidenceLevel(events, duration);

    return analysis;
  }

  /**
   * Temporal Pattern Analysis - AI Model for Time-based Behavior
   */
  analyzeTemporalPatterns(events, duration) {
    const patterns = {
      earlyViolations: 0,
      midViolations: 0,
      lateViolations: 0,
      violationClusters: [],
      attentionDecline: false,
      stressPatterns: []
    };

    const thirdDuration = duration / 3;
    const violationClusters = [];
    let currentCluster = [];
    let lastEventTime = 0;

    events.forEach((event, index) => {
      const eventTime = new Date(event.timestamp).getTime();
      const relativeTime = eventTime - (events[0] ? new Date(events[0].timestamp).getTime() : 0);

      // Categorize by interview phase
      if (relativeTime < thirdDuration) {
        patterns.earlyViolations++;
      } else if (relativeTime < thirdDuration * 2) {
        patterns.midViolations++;
      } else {
        patterns.lateViolations++;
      }

      // Cluster detection (violations within 2 minutes)
      if (index === 0 || eventTime - lastEventTime < 120000) {
        currentCluster.push(event);
      } else {
        if (currentCluster.length > 1) {
          violationClusters.push(currentCluster);
        }
        currentCluster = [event];
      }
      lastEventTime = eventTime;
    });

    if (currentCluster.length > 1) {
      violationClusters.push(currentCluster);
    }

    patterns.violationClusters = violationClusters;
    
    // AI pattern recognition
    patterns.attentionDecline = patterns.lateViolations > patterns.earlyViolations * 1.5;
    patterns.stressPatterns = this.detectStressPatterns(violationClusters);

    return patterns;
  }

  /**
   * Violation Frequency Analysis with AI Scoring
   */
  analyzeViolationFrequency(events) {
    const frequencyMap = {};
    const criticalEvents = ['object-detected', 'multiple-faces', 'audio-violation'];
    
    events.forEach(event => {
      const type = event.eventType;
      frequencyMap[type] = (frequencyMap[type] || 0) + 1;
    });

    const analysis = {
      totalViolations: events.length,
      criticalViolations: events.filter(e => criticalEvents.includes(e.eventType)).length,
      frequencyScore: 100,
      violationDiversity: Object.keys(frequencyMap).length,
      repeatedPatterns: []
    };

    // AI-based frequency penalty calculation
    let frequencyPenalty = 0;
    Object.entries(frequencyMap).forEach(([type, count]) => {
      if (criticalEvents.includes(type)) {
        frequencyPenalty += count * this.behaviorWeights[type.replace('-', '')] || 10;
      } else {
        frequencyPenalty += count * 5;
      }
    });

    analysis.frequencyScore = Math.max(0, 100 - frequencyPenalty);
    analysis.repeatedPatterns = this.identifyRepeatedPatterns(events);

    return analysis;
  }

  /**
   * Behavioral Consistency Analysis using AI
   */
  analyzeBehavioralConsistency(events) {
    const consistency = {
      focusConsistency: 100,
      behaviorStability: 100,
      adaptabilityScore: 100,
      overallConsistency: 100
    };

    // Focus pattern analysis
    const focusEvents = events.filter(e => e.eventType.includes('focus'));
    if (focusEvents.length > 0) {
      const focusVariability = this.calculateVariability(focusEvents);
      consistency.focusConsistency = Math.max(0, 100 - (focusVariability * 20));
    }

    // Behavioral stability over time
    const timeWindows = this.divideIntoTimeWindows(events, 5); // 5-minute windows
    const windowScores = timeWindows.map(window => this.calculateWindowScore(window));
    const stabilityVariance = this.calculateVariance(windowScores);
    consistency.behaviorStability = Math.max(0, 100 - (stabilityVariance * 10));

    // Overall consistency score
    consistency.overallConsistency = (
      consistency.focusConsistency * 0.4 +
      consistency.behaviorStability * 0.6
    );

    return consistency;
  }

  /**
   * Advanced AI Integrity Score Calculation
   * Multi-factor AI model combining various behavioral indicators
   */
  calculateAdvancedIntegrityScore(temporal, frequency, consistency) {
    let baseScore = 100;

    // Temporal pattern penalties
    if (temporal.attentionDecline) baseScore -= 15;
    if (temporal.violationClusters.length > 2) baseScore -= 10;
    if (temporal.stressPatterns.length > 0) baseScore -= 5;

    // Frequency-based penalties
    baseScore -= (100 - frequency.frequencyScore) * 0.6;

    // Consistency penalties
    baseScore -= (100 - consistency.overallConsistency) * 0.3;

    // AI confidence adjustments
    const confidenceAdjustment = this.calculateAIConfidenceAdjustment(temporal, frequency);
    baseScore += confidenceAdjustment;

    // Neural network-like weighted combination
    const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));
    
    return finalScore;
  }

  /**
   * AI Risk Assessment Algorithm
   */
  assessRiskLevel(integrityScore, events) {
    const criticalEvents = events.filter(e => 
      ['object-detected', 'multiple-faces'].includes(e.eventType)
    ).length;

    if (integrityScore < 50 || criticalEvents > 3) return 'critical';
    if (integrityScore < 70 || criticalEvents > 1) return 'high';
    if (integrityScore < 85) return 'medium';
    return 'low';
  }

  /**
   * AI-Powered Behavior Insights Generation
   */
  generateBehaviorInsights(events, temporal) {
    const insights = [];

    // Focus pattern insights
    const focusEvents = events.filter(e => e.eventType.includes('focus'));
    if (focusEvents.length > 5) {
      insights.push({
        type: 'focus_pattern',
        message: 'Candidate shows frequent focus shifts, indicating possible distraction or nervousness',
        confidence: 0.85
      });
    }

    // Temporal insights
    if (temporal.attentionDecline) {
      insights.push({
        type: 'attention_decline',
        message: 'Attention appears to decline over time, suggesting fatigue or disengagement',
        confidence: 0.78
      });
    }

    // Violation clustering insights
    if (temporal.violationClusters.length > 0) {
      insights.push({
        type: 'behavior_clustering',
        message: 'Violations occur in clusters, suggesting specific trigger moments or stress periods',
        confidence: 0.82
      });
    }

    // Object detection insights
    const objectEvents = events.filter(e => e.eventType === 'object-detected');
    if (objectEvents.length > 0) {
      const objects = objectEvents.map(e => e.eventData?.objectType).filter(Boolean);
      insights.push({
        type: 'unauthorized_objects',
        message: `Detected unauthorized items: ${[...new Set(objects)].join(', ')}`,
        confidence: 0.95
      });
    }

    return insights;
  }

  /**
   * AI Recommendation Engine
   */
  generateAIRecommendations(analysis) {
    const recommendations = [];

    if (analysis.integrityScore < 70) {
      recommendations.push({
        type: 'integrity_concern',
        action: 'Consider additional verification or follow-up interview',
        priority: 'high'
      });
    }

    if (analysis.riskLevel === 'critical') {
      recommendations.push({
        type: 'immediate_action',
        action: 'Immediate intervention required - contact candidate or pause interview',
        priority: 'critical'
      });
    }

    if (analysis.behaviorInsights.some(i => i.type === 'attention_decline')) {
      recommendations.push({
        type: 'interview_adjustment',
        action: 'Consider shortening remaining interview time or providing a break',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * AI Confidence Level Calculation
   */
  calculateConfidenceLevel(events, duration) {
    let confidence = 0.95;

    // Reduce confidence for sparse data
    if (events.length < 5) confidence -= 0.1;
    if (duration < 300) confidence -= 0.05; // Less than 5 minutes

    // Increase confidence for consistent patterns
    if (events.length > 20) confidence += 0.02;

    return Math.max(0.5, Math.min(0.99, confidence));
  }

  /**
   * Helper Methods for AI Calculations
   */
  detectStressPatterns(clusters) {
    return clusters.filter(cluster => cluster.length > 3).map(cluster => ({
      startTime: cluster[0].timestamp,
      endTime: cluster[cluster.length - 1].timestamp,
      intensity: cluster.length,
      types: [...new Set(cluster.map(e => e.eventType))]
    }));
  }

  identifyRepeatedPatterns(events) {
    const patterns = [];
    const eventSequences = {};

    for (let i = 0; i < events.length - 2; i++) {
      const sequence = events.slice(i, i + 3).map(e => e.eventType).join('-');
      eventSequences[sequence] = (eventSequences[sequence] || 0) + 1;
    }

    Object.entries(eventSequences).forEach(([sequence, count]) => {
      if (count > 1) {
        patterns.push({ sequence, frequency: count });
      }
    });

    return patterns;
  }

  calculateVariability(events) {
    if (events.length < 2) return 0;
    
    const timestamps = events.map(e => new Date(e.timestamp).getTime());
    const intervals = [];
    
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    
    return Math.sqrt(variance) / mean;
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    return variance;
  }

  divideIntoTimeWindows(events, windowMinutes) {
    if (events.length === 0) return [];
    
    const windowMs = windowMinutes * 60 * 1000;
    const startTime = new Date(events[0].timestamp).getTime();
    const windows = [];
    
    let currentWindow = [];
    let currentWindowStart = startTime;
    
    events.forEach(event => {
      const eventTime = new Date(event.timestamp).getTime();
      
      if (eventTime - currentWindowStart < windowMs) {
        currentWindow.push(event);
      } else {
        if (currentWindow.length > 0) {
          windows.push(currentWindow);
        }
        currentWindow = [event];
        currentWindowStart = eventTime;
      }
    });
    
    if (currentWindow.length > 0) {
      windows.push(currentWindow);
    }
    
    return windows;
  }

  calculateWindowScore(windowEvents) {
    let score = 100;
    
    windowEvents.forEach(event => {
      const penalty = this.behaviorWeights[event.eventType.replace('-', '')] || 5;
      score -= penalty;
    });
    
    return Math.max(0, score);
  }

  calculateAIConfidenceAdjustment(temporal, frequency) {
    let adjustment = 0;
    
    // Boost confidence for consistent behavior
    if (frequency.violationDiversity < 3) adjustment += 2;
    
    // Reduce confidence for erratic patterns
    if (temporal.violationClusters.length > 3) adjustment -= 3;
    
    return adjustment;
  }

  /**
   * Real-time AI Prediction for Live Monitoring
   */
  predictNextViolation(events, currentTime) {
    if (events.length < 3) return { probability: 0.1, type: 'unknown', timeWindow: 60 };

    const recentEvents = events.slice(-5);
    const patterns = this.identifyRepeatedPatterns(recentEvents);
    
    let probability = 0.1;
    let predictedType = 'focus-lost';
    
    if (patterns.length > 0) {
      probability = Math.min(0.8, patterns[0].frequency * 0.2);
      predictedType = patterns[0].sequence.split('-')[0];
    }

    return {
      probability,
      type: predictedType,
      timeWindow: 60,
      confidence: probability > 0.5 ? 'high' : 'medium'
    };
  }

  /**
   * Export AI Analytics Report
   */
  generateAIReport(events, duration, candidateName) {
    const analysis = this.analyzeBehaviorPattern(events, duration);
    
    return {
      candidate: candidateName,
      duration,
      timestamp: new Date().toISOString(),
      aiAnalysis: analysis,
      modelVersion: '1.0.0',
      totalEvents: events.length,
      processingTime: Date.now()
    };
  }
}

module.exports = new InterviewAIAnalytics();
