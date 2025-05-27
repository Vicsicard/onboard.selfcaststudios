// MongoDB schema for scheduled events
const mongoose = require('mongoose');

const ScheduledEventSchema = new mongoose.Schema({
  // Calendly event information
  calendlyEventUri: {
    type: String,
    required: true,
    unique: true
  },
  eventTypeUri: {
    type: String,
    required: true
  },
  eventTypeName: {
    type: String,
    required: true
  },
  
  // Time information
  scheduledAt: {
    type: Date,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    required: true
  },
  
  // Invitee information
  inviteeUri: {
    type: String,
    required: true
  },
  inviteeEmail: {
    type: String,
    required: true
  },
  inviteeName: {
    type: String,
    required: true
  },
  inviteePhone: {
    type: String
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['scheduled', 'canceled', 'rescheduled', 'completed'],
    default: 'scheduled'
  },
  
  // Custom questions and answers
  questions: [{
    question: String,
    answer: String
  }],
  
  // Marketing funnel tracking
  marketingFunnel: {
    welcomeEmailSent: {
      type: Boolean,
      default: false
    },
    reminderEmailSent: {
      type: Boolean,
      default: false
    },
    followUpEmailSent: {
      type: Boolean,
      default: false
    },
    lastEmailSentDate: Date
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Reference to the project/client
  projectId: {
    type: String
  }
});

// Update the updatedAt field on save
ScheduledEventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.ScheduledEvent || mongoose.model('ScheduledEvent', ScheduledEventSchema);
