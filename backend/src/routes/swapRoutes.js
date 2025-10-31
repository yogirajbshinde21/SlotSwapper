const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');
const authenticate = require('../middleware/auth');

/**
 * SWAP REQUEST ROUTES
 * 
 * Base path: /api/swap-requests
 * All routes require authentication
 */

// Apply authentication middleware to ALL routes
router.use(authenticate);

/**
 * @route   POST /api/swap-requests
 * @desc    Create a new swap request
 * @access  Private
 */
router.post('/', swapController.createSwapRequest);

/**
 * @route   GET /api/swap-requests/incoming
 * @desc    Get all incoming swap requests (received)
 * @access  Private
 */
router.get('/incoming', swapController.getIncomingRequests);

/**
 * @route   GET /api/swap-requests/outgoing
 * @desc    Get all outgoing swap requests (sent)
 * @access  Private
 */
router.get('/outgoing', swapController.getOutgoingRequests);

/**
 * @route   POST /api/swap-requests/:requestId/respond
 * @desc    Respond to a swap request (accept/reject)
 * @access  Private
 */
router.post('/:requestId/respond', swapController.respondToSwapRequest);

/**
 * @route   DELETE /api/swap-requests/:requestId
 * @desc    Cancel a pending swap request
 * @access  Private
 */
router.delete('/:requestId', swapController.cancelSwapRequest);

module.exports = router;
