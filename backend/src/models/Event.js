const mongoose = require('mongoose');

/**
 * EVENT SCHEMA (Calendar Slots)
 * 
 * Represents time slots in a user's calendar
 * Can be in different states: BUSY, SWAPPABLE, SWAP_PENDING
 */

const eventSchema = new mongoose.Schema(
    {
        // Reference to the user who owns this slot
        // Creates 1 to Many Relationship: 1 User ---> Many Event Slots
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',  // Reference to the User model (for population)
            required: [true, 'Event must belong to User'] ,
            index: true // Create index for faster queries by userId
        },

        title: {
            type: String,
            required: [true, 'Event must have a title'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters']
        },

        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: '' 
        },

        startTime: {
            type: Date,
            required: [true, 'Start time is required']
        },

        endTime: {
            type: Date,
            required: [true, 'End time is required']
        },

        status: {
            type: String,
            enum: {
                values: ['BUSY', 'SWAPPABLE', 'SWAP_PENDING'],
                message: '{VALUE} is not a valid status'
            },
            default: 'BUSY'
        },

        // Metadata, But Useful
        location: {
            type: String,
            trim: true,
            maxlength: [200, 'Location cannot exceed 200 characters']
        }
    },
    {
        timestamps: true
    }
);

// ============================================
// INDEXES (for query performance)
// ============================================

/**
 * Compound index for efficient queries
 * 
 * Why these indexes?
 * - We'll frequently query: "Get all SWAPPABLE events by other users"
 * - We'll frequently query: "Get all events for userId X"
 * 
 * Indexes make queries faster (like book index vs reading whole book)
 */
eventSchema.index({ userId: 1, status: 1 }); // Compound index
eventSchema.index({ startTime: 1 }); // For date range queries

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

/**
 * PRE-SAVE HOOK: Validate that endTime is after startTime
 * 
 * Why custom validation?
 * - Mongoose can't compare two fields natively
 * - Prevents invalid time ranges (end before start)
 */
eventSchema.pre('save', function (next) {
  // Check if this is a new event or if times were modified
  if (this.isNew || this.isModified('startTime') || this.isModified('endTime')) {
    if (this.endTime <= this.startTime) {
      const error = new Error('End time must be after start time');
      return next(error); // Stop save operation and return error
    }
  }
  next(); // Validation passed, continue
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if event can be made swappable
 * 
 * Business rule: Only BUSY events can be made SWAPPABLE
 * (SWAP_PENDING events are locked in a swap process)
 */
eventSchema.methods.canMakeSwappable = function () {
  return this.status === 'BUSY';
};

/**
 * Check if event is available for swapping
 * 
 * An event is available if:
 * - Status is SWAPPABLE
 * - Start time is in the future
 */
eventSchema.methods.isAvailableForSwap = function () {
  const now = new Date();
  return this.status === 'SWAPPABLE' && this.startTime > now;
};

// ============================================
// STATIC METHODS (called on Model, not document)
// ============================================

/**
 * Find all swappable events excluding a specific user
 * 
 * Usage: Event.findSwappableSlots(currentUserId)
 * 
 * @param {ObjectId} excludeUserId - Don't show this user's own events
 * @returns {Promise<Array>} - Array of swappable events
 */
eventSchema.statics.findSwappableSlots = function (excludeUserId) {
  return this.find({
    userId: { $ne: excludeUserId }, // $ne = "not equal" (exclude user's own events)
    status: 'SWAPPABLE',
    startTime: { $gt: new Date() } // $gt = "greater than" (future events only)
  })
    .populate('userId', 'name email') // Include user details (only name and email)
    .sort({ startTime: 1 }); // Sort by earliest first
};

// ============================================
// VIRTUAL FIELDS (computed properties, not stored in DB)
// ============================================

/**
 * Calculate duration in minutes
 * 
 * Virtual fields are computed on-the-fly, not stored
 * Useful for derived data to avoid duplication
 */
eventSchema.virtual('durationMinutes').get(function () {
  if (this.startTime && this.endTime) {
    const diff = this.endTime - this.startTime; // Difference in milliseconds
    return Math.floor(diff / (1000 * 60)); // Convert to minutes
  }
  return 0;
});

// Enable virtuals in JSON output
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

// ============================================
// CREATE AND EXPORT MODEL
// ============================================

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;