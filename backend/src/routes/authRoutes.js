const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')
const authenticate = require('../middleware/auth');

const app = express();


/**
 * AUTHENTICATION ROUTES
 * 
 * Base path: /api/auth
 * All routes here are prefixed with /api/auth (defined in server.js)
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */

router.post('/register', authController.register)


/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', authController.login);


/**
 * @route   GET /api/auth/me
 * @desc    Get current user's profile
 * @access  Private (requires authentication)
 * 
 * Note: authenticate middleware runs BEFORE controller
 * If token is valid, req.user is populated
 * If token is invalid, returns 401 before reaching controller
 */
router.get('/me', authenticate, authController.getMe);


module.exports = router;
