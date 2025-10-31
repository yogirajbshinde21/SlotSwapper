const mongoose = require('mongoose');

/**
 * SWAP REQUEST SCHEMA
 * 
 * Represents a proposal to swap two calendar slots between users
 * 
 * Lifecycle:
 * 1. User A creates request (PENDING)
 * 2. User B accepts → both slots swap owners (ACCEPTED)
 * 3. User B rejects → both slots return to SWAPPABLE (REJECTED)
 */


const swapRequestSchema = new mongoose.Schema(
    {
        // The user who initiated the swap request
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, "Requester is required"],
            index: true
        },
        
        // The user who will receive the swap request
        requestedUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, "Requested user is required"],
            index: true
        },

        // The slot that the requester is offering
        mySlotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Requester slot is required']
        },

        // The slot that the requester wants
        theirSlotId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Requested slot is required']
        },

        status: {
            type: String,
            enum: {
                values: ['PENDING', 'ACCEPTED', 'REJECTED'],
                message: '{VALUE} is not a valid swap status'
            },
            default: 'PENDING'
        },

        // optional
        message: {
            type: String,
            trim: true,
            maxlength: [500, 'Message cannot exceed 500 characters'],
            default: ''
        },

        // track when the request was responded to
        respondedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }

);


// ============================================
// INDEXES
// ============================================

/**
 * Compound indexes for efficient queries
 * 
 * Common queries:
 * - "Show me all PENDING requests I received"
 * - "Show me all my outgoing requests"
 */
swapRequestSchema.index({ requestedUserId: 1, status: 1 });
swapRequestSchema.index({ requesterId: 1, status: 1 });

/**
 * Prevent duplicate requests
 * User shouldn't be able to request same swap twice
 * 
 * Unique compound index on the four slot/user references
 */
swapRequestSchema.index(
  {
    requesterId: 1,
    requestedUserId: 1,
    mySlotId: 1,
    theirSlotId: 1
  },
  { unique: true }
);

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

/**
 * PRE-SAVE HOOK: Validate swap request logic
 * 
 * Business rules:
 * 1. Can't swap with yourself
 * 2. Can't offer the same slot you're requesting
 */
swapRequestSchema.pre('save', function (next) {
  // Rule 1: Prevent self-swapping
  if (this.requesterId.equals(this.requestedUserId)) {
    return next(new Error('Cannot create swap request with yourself'));
  }

  // Rule 2: Prevent swapping same slot
  if (this.mySlotId.equals(this.theirSlotId)) {
    return next(new Error('Cannot swap the same slot'));
  }

  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if request can be responded to
 * 
 * Only PENDING requests can be accepted/rejected
 */
swapRequestSchema.methods.canRespond = function () {
  return this.status === 'PENDING';
};

/**
 * Mark request as responded
 * Updates status and timestamp
 * 
 * @param {string} newStatus - 'ACCEPTED' or 'REJECTED'
 */
swapRequestSchema.methods.respond = function (newStatus) {
  if (!this.canRespond()) {
    throw new Error('This swap request has already been responded to');
  }

  if (!['ACCEPTED', 'REJECTED'].includes(newStatus)) {
    throw new Error('Invalid response status');
  }

  this.status = newStatus;
  this.respondedAt = new Date();
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find all incoming requests for a user
 * (Requests where user is the recipient)
 * 
 * @param {ObjectId} userId
 * @param {string} status - Optional filter (default: 'PENDING')
 */
swapRequestSchema.statics.findIncomingRequests = function (userId, status = 'PENDING') {
  return this.find({
    requestedUserId: userId,
    status: status
  })
    .populate('requesterId', 'name email') // Who sent the request
    .populate('mySlotId') // The slot they're offering
    .populate('theirSlotId') // The slot they want
    .sort({ createdAt: -1 }); // Newest first
};

/**
 * Find all outgoing requests from a user
 * (Requests where user is the requester)
 * 
 * @param {ObjectId} userId
 * @param {string} status - Optional filter (default: 'PENDING')
 */
swapRequestSchema.statics.findOutgoingRequests = function (userId, status = 'PENDING') {
  return this.find({
    requesterId: userId,
    status: status
  })
    .populate('requestedUserId', 'name email') // Who will respond
    .populate('mySlotId') // The slot I'm offering
    .populate('theirSlotId') // The slot I want
    .sort({ createdAt: -1 });
};

/**
 * Check if a swap request already exists
 * Prevents duplicate requests
 * 
 * @param {ObjectId} requesterId
 * @param {ObjectId} mySlotId
 * @param {ObjectId} theirSlotId
 * @returns {Promise<boolean>}
 */
swapRequestSchema.statics.requestExists = async function (requesterId, mySlotId, theirSlotId) {
  const existingRequest = await this.findOne({
    requesterId,
    mySlotId,
    theirSlotId,
    status: 'PENDING' // Only check PENDING requests
  });

  return !!existingRequest; // Convert to boolean
};

// ============================================
// VIRTUAL FIELDS
// ============================================

/**
 * Check if request is still pending
 */
swapRequestSchema.virtual('isPending').get(function () {
  return this.status === 'PENDING';
});

/**
 * Check if request was accepted
 */
swapRequestSchema.virtual('isAccepted').get(function () {
  return this.status === 'ACCEPTED';
});

// Enable virtuals in JSON output
swapRequestSchema.set('toJSON', { virtuals: true });
swapRequestSchema.set('toObject', { virtuals: true });

// ============================================
// CREATE AND EXPORT MODEL
// ============================================

const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);

module.exports = SwapRequest;