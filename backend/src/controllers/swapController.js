const SwapRequest = require('../models/SwapRequest');
const Event = require('../models/Event');
const mongoose = require('mongoose');

/**
 * SWAP REQUEST CONTROLLER
 * 
 * Handles swap request creation and response (accept/reject)
 * Critical logic with transaction-like behavior
 */

// ============================================
// CREATE SWAP REQUEST
// ============================================

/**
 * @desc    Create a swap request
 * @route   POST /api/swap-requests
 * @access  Private
 * 
 * Critical logic:
 * 1. Validate both slots exist and are SWAPPABLE
 * 2. Create SwapRequest document
 * 3. Update both slots to SWAP_PENDING
 */
exports.createSwapRequest = async (req, res) => {
  try {
    const { mySlotId, theirSlotId, message } = req.body;
    const requesterId = req.user.userId;

    // 1. Validation: Check required fields
    if (!mySlotId || !theirSlotId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both mySlotId and theirSlotId'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(mySlotId) || !mongoose.Types.ObjectId.isValid(theirSlotId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slot ID format'
      });
    }

    // 2. Fetch both slots
    const mySlot = await Event.findById(mySlotId);
    const theirSlot = await Event.findById(theirSlotId);

    if (!mySlot || !theirSlot) {
      return res.status(404).json({
        success: false,
        message: 'One or both slots not found'
      });
    }

    // 3. Validate ownership: mySlot must belong to requester
    if (mySlot.userId.toString() !== requesterId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only offer your own slots'
      });
    }

    // 4. Validate: can't swap with yourself
    if (theirSlot.userId.toString() === requesterId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot swap with your own slots'
      });
    }

    // 5. Validate: both slots must be SWAPPABLE
    if (mySlot.status !== 'SWAPPABLE') {
      return res.status(400).json({
        success: false,
        message: 'Your slot must be in SWAPPABLE status'
      });
    }

    if (theirSlot.status !== 'SWAPPABLE') {
      return res.status(400).json({
        success: false,
        message: 'The requested slot is no longer available for swapping'
      });
    }

    // 6. Check if swap request already exists
    const existingRequest = await SwapRequest.requestExists(requesterId, mySlotId, theirSlotId);
    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You have already sent a swap request for these slots'
      });
    }

    // 7. Create swap request
    const swapRequest = await SwapRequest.create({
      requesterId,
      requestedUserId: theirSlot.userId,
      mySlotId,
      theirSlotId,
      message: message || ''
    });

    // 8. Update both slots to SWAP_PENDING
    mySlot.status = 'SWAP_PENDING';
    theirSlot.status = 'SWAP_PENDING';

    await mySlot.save();
    await theirSlot.save();

    // Populate details for response
    const populatedRequest = await SwapRequest.findById(swapRequest._id)
      .populate('requesterId', 'name email')
      .populate('requestedUserId', 'name email')
      .populate('mySlotId')
      .populate('theirSlotId');

    res.status(201).json({
      success: true,
      message: 'Swap request created successfully',
      swapRequest: populatedRequest
    });

  } catch (error) {
    console.error('Create swap request error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Swap request already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating swap request'
    });
  }
};

// ============================================
// GET INCOMING SWAP REQUESTS
// ============================================

/**
 * @desc    Get all incoming swap requests (requests received by user)
 * @route   GET /api/swap-requests/incoming
 * @access  Private
 */
exports.getIncomingRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    const requests = await SwapRequest.findIncomingRequests(
      req.user.userId,
      status || 'PENDING'
    );

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error('Get incoming requests error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching incoming requests'
    });
  }
};

// ============================================
// GET OUTGOING SWAP REQUESTS
// ============================================

/**
 * @desc    Get all outgoing swap requests (requests sent by user)
 * @route   GET /api/swap-requests/outgoing
 * @access  Private
 */
exports.getOutgoingRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    const requests = await SwapRequest.findOutgoingRequests(
      req.user.userId,
      status || 'PENDING'
    );

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error('Get outgoing requests error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching outgoing requests'
    });
  }
};

// ============================================
// RESPOND TO SWAP REQUEST (ACCEPT/REJECT)
// ============================================

/**
 * @desc    Respond to a swap request (accept or reject)
 * @route   POST /api/swap-requests/:requestId/respond
 * @access  Private
 * 
 * Critical logic:
 * - If ACCEPTED: Swap slot ownership, set both to BUSY
 * - If REJECTED: Reset both slots to SWAPPABLE
 */
exports.respondToSwapRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { response } = req.body; // 'ACCEPTED' or 'REJECTED'
    const userId = req.user.userId;

    // 1. Validation
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }

    if (!response || !['ACCEPTED', 'REJECTED'].includes(response)) {
      return res.status(400).json({
        success: false,
        message: 'Response must be either ACCEPTED or REJECTED'
      });
    }

    // 2. Find swap request
    const swapRequest = await SwapRequest.findById(requestId)
      .populate('mySlotId')
      .populate('theirSlotId');

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // 3. Authorization: Only the requested user can respond
    if (swapRequest.requestedUserId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to respond to this request'
      });
    }

    // 4. Check if already responded
    if (!swapRequest.canRespond()) {
      return res.status(400).json({
        success: false,
        message: 'This request has already been responded to'
      });
    }

    // 5. Get the actual event documents
    const mySlot = await Event.findById(swapRequest.mySlotId._id);
    const theirSlot = await Event.findById(swapRequest.theirSlotId._id);

    if (!mySlot || !theirSlot) {
      return res.status(404).json({
        success: false,
        message: 'One or both slots no longer exist'
      });
    }

    // 6. Handle response
    if (response === 'ACCEPTED') {
      // SWAP OWNERSHIP
      const tempUserId = mySlot.userId;
      mySlot.userId = theirSlot.userId;
      theirSlot.userId = tempUserId;

      // Set both to BUSY
      mySlot.status = 'BUSY';
      theirSlot.status = 'BUSY';

      await mySlot.save();
      await theirSlot.save();

      // Update swap request status
      swapRequest.status = 'ACCEPTED';
      swapRequest.respondedAt = new Date();
      await swapRequest.save();

      res.status(200).json({
        success: true,
        message: 'Swap request accepted. Slots have been exchanged.',
        swapRequest
      });

    } else {
      // REJECTED
      // Reset both slots to SWAPPABLE
      mySlot.status = 'SWAPPABLE';
      theirSlot.status = 'SWAPPABLE';

      await mySlot.save();
      await theirSlot.save();

      // Update swap request status
      swapRequest.status = 'REJECTED';
      swapRequest.respondedAt = new Date();
      await swapRequest.save();

      res.status(200).json({
        success: true,
        message: 'Swap request rejected. Slots are available again.',
        swapRequest
      });
    }

  } catch (error) {
    console.error('Respond to swap request error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error responding to swap request'
    });
  }
};

// ============================================
// CANCEL SWAP REQUEST (BY REQUESTER)
// ============================================

/**
 * @desc    Cancel a pending swap request
 * @route   DELETE /api/swap-requests/:requestId
 * @access  Private
 */
exports.cancelSwapRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      });
    }

    const swapRequest = await SwapRequest.findById(requestId)
      .populate('mySlotId')
      .populate('theirSlotId');

    if (!swapRequest) {
      return res.status(404).json({
        success: false,
        message: 'Swap request not found'
      });
    }

    // Authorization: Only requester can cancel
    if (swapRequest.requesterId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own requests'
      });
    }

    // Can only cancel pending requests
    if (swapRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending requests'
      });
    }

    // Reset both slots to SWAPPABLE
    const mySlot = await Event.findById(swapRequest.mySlotId._id);
    const theirSlot = await Event.findById(swapRequest.theirSlotId._id);

    if (mySlot) {
      mySlot.status = 'SWAPPABLE';
      await mySlot.save();
    }

    if (theirSlot) {
      theirSlot.status = 'SWAPPABLE';
      await theirSlot.save();
    }

    // Delete swap request
    await swapRequest.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Swap request cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel swap request error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error cancelling swap request'
    });
  }
};
