const Event = require("../models/Event");
const mongoose = require("mongoose");

/**
 * EVENT CONTROLLER
 *
 * Handles all event/slot operations (CRUD)
 * All routes here require authentication (req.user is available)
 */

// ============================================
// CREATE EVENT
// ============================================

/**
 * @desc    Create a new event/slot
 * @route   POST /api/events
 * @access  Private (requires authentication)
 */
exports.createEvent = async (req, res) => {
  try {
    const { title, description, startTime, endTime, location, status } =
      req.body;

    // 1. Validation: Check required fields
    if (!title || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, start time, and end time",
      });
    }

    // 2. Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End time must be after start time",
      });
    }

    // 3. Check if event is in the past
    const now = new Date();
    if (start < now) {
      return res.status(400).json({
        success: false,
        message: "Cannot create events in the past",
      });
    }

    // 4. Create event (userId from authenticated user)
    const event = await Event.create({
      userId: req.user.userId, // Set from auth middleware
      title,
      description,
      startTime: start,
      endTime: end,
      location,
      status: status || "BUSY", // Default to BUSY if not provided
    });

    // 5. Populate user details before sending response
    await event.populate("userId", "name email");

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create event error: ", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error creating event",
    });
  }
};



// ============================================
// GET USER'S EVENTS
// ============================================

/**
 * @desc    Get all events for logged-in user
 * @route   GET /api/events
 * @access  Private
 * 
 * Query parameters (optional):
 * - status: Filter by status (BUSY, SWAPPABLE, SWAP_PENDING)
 * - startDate: Filter events after this date
 * - endDate: Filter events before this date
 */
exports.getUserEvents = async (req, res) => {
    try{
        // Build query object
        const query = { userId: req.user.userId };

        // Optional filters from query parameters
        const { status, startDate, endDate } = req.query;

        // Filter by status if needed
        if (status){
            if (!['BUSY', 'SWAPPABLE', 'SWAP_PENDING'].includes(status)){
                return res.status(400).json({
                    success:false,
                    message: 'Invalid status value'
                });
            }
            query.status = status;
        }

        // Filter by date range if provided
        if (startDate || endDate){
            query.startTime = {};

            if(startDate){
                const start = new Date(startDate);
                if (isNaN(start.getTime())){
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid startDate format'
                    }); 
                }
                query.startTime.$gte = start;
            }

            if(endDate){
                const end = new Date(endDate);
                if (isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid endDate format'
                    });
            }
            query.startTime.$lte = end;
        }
    }

    // Execute query
    const events = await Event.find(query)
    .populate('userId', 'name email')
    .sort({ startTime: 1}); // Sort by earliest first

    res.status(200).json({
        success: true,
        count: events.length,
        events
    });
} catch(error){
    console.error('Get events error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching events'
    });
}
};

// ============================================
// GET SINGLE EVENT
// ============================================

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Private
 * 
 * Note: User can only view their own events
 */
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    // Find event
    const event = await Event.findById(id).populate('userId', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Authorization check: Only owner can view
    if (event.userId._id.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this event'
      });
    }

    res.status(200).json({
      success: true,
      event
    });

  } catch (error) {
    console.error('Get event by ID error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching event'
    });
  }
};

// ============================================
// UPDATE EVENT
// ============================================

/**
 * @desc    Update event
 * @route   PATCH /api/events/:id
 * @access  Private
 * 
 * Updateable fields: title, description, startTime, endTime, location, status
 * 
 * Business rules:
 * - Can't update events in SWAP_PENDING status (locked during swap)
 * - Can only change status: BUSY ↔ SWAPPABLE (not to SWAP_PENDING manually)
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    // Find event
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Authorization: Only owner can update
    if (event.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    // Business rule: Can't update SWAP_PENDING events
    if (event.status === 'SWAP_PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update event during pending swap. Wait for swap resolution.'
      });
    }

    // Validate status change
    if (updates.status) {
      // Only allow BUSY ↔ SWAPPABLE transitions
      if (updates.status === 'SWAP_PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Cannot manually set status to SWAP_PENDING'
        });
      }

      if (!['BUSY', 'SWAPPABLE'].includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      // Check if event can be made swappable
      if (updates.status === 'SWAPPABLE' && !event.canMakeSwappable()) {
        return res.status(400).json({
          success: false,
          message: 'Event cannot be made swappable in current state'
        });
      }
    }

    // Validate time updates
    if (updates.startTime || updates.endTime) {
      const newStart = updates.startTime ? new Date(updates.startTime) : event.startTime;
      const newEnd = updates.endTime ? new Date(updates.endTime) : event.endTime;

      if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      if (newEnd <= newStart) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }

      // Can't move event to the past
      const now = new Date();
      if (newStart < now) {
        return res.status(400).json({
          success: false,
          message: 'Cannot schedule events in the past'
        });
      }
    }

    // Fields that can be updated
    const allowedUpdates = ['title', 'description', 'startTime', 'endTime', 'location', 'status'];
    
    // Apply updates
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        event[field] = updates[field];
      }
    });

    // Save updated event
    await event.save();

    // Populate user details
    await event.populate('userId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event
    });

  } catch (error) {
    console.error('Update event error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating event'
    });
  }
};

// ============================================
// DELETE EVENT
// ============================================

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private
 * 
 * Business rule: Can't delete events in SWAP_PENDING status
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    // Find event
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Authorization: Only owner can delete
    if (event.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    // Business rule: Can't delete SWAP_PENDING events
    if (event.status === 'SWAP_PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event during pending swap. Reject the swap request first.'
      });
    }

    // Delete event
    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error deleting event'
    });
  }
};

// ============================================
// GET SWAPPABLE SLOTS (MARKETPLACE)
// ============================================

/**
 * @desc    Get all swappable slots from other users (marketplace)
 * @route   GET /api/events/swappable/marketplace
 * @access  Private
 * 
 * Business logic:
 * - Exclude logged-in user's own slots
 * - Only show SWAPPABLE status
 * - Only show future events
 */
exports.getSwappableSlots = async (req, res) => {
  try {
    // Use the static method from Event model
    const swappableSlots = await Event.findSwappableSlots(req.user.userId);

    res.status(200).json({
      success: true,
      count: swappableSlots.length,
      events: swappableSlots
    });

  } catch (error) {
    console.error('Get swappable slots error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching swappable slots'
    });
  }
};