const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authenticate = require('../middleware/auth');

/**
 * EVENT ROUTES
 * 
 * Base path: /api/events
 * All routes require authentication
 */

// Apply authentication middleware to ALL routes in this file
router.use(authenticate);

/**
 * @route   GET /api/events/swappable/marketplace
 * @desc    Get all swappable slots from other users
 * @access  Private
 * 
 * Note: Must be before '/:id' route to avoid treating 'swappable' as an ID
 */
router.get('/swappable/marketplace', eventController.getSwappableSlots);

/**
 * @route   POST /api/events
 * @desc    Create new event
 * @access  Private
 */
router.post('/', eventController.createEvent);

/**
 * @route   GET /api/events
 * @desc    Get all events for logged-in user
 * @access  Private
 * 
 * Query params:
 * - ?status=BUSY|SWAPPABLE|SWAP_PENDING
 * - ?startDate=2025-11-01
 * - ?endDate=2025-12-01
 */
router.get('/', eventController.getUserEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Get single event by ID
 * @access  Private
 */
router.get('/:id', eventController.getEventById);

/**
 * @route   PATCH /api/events/:id
 * @desc    Update event
 * @access  Private
 */
router.patch('/:id', eventController.updateEvent);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event
 * @access  Private
 */
router.delete('/:id', eventController.deleteEvent);

module.exports = router;