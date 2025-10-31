const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * AUTHENTICATION CONTROLLER
 * 
 * Handles user registration, login, and token generation
 * Controllers contain business logic (routes just define endpoints)
 */

// ============================================
// HELPER FUNCTION: Generate JWT Token
// ============================================

/**
 * Creates a JWT token for authenticated user
 * 
 * @param {ObjectId} userId - User's MongoDB ID
 * @returns {string} - JWT token
 */
const generateToken = (userId) => {
  // jwt.sign(payload, secret, options)
  return jwt.sign(
    { userId }, // Payload (data stored in token)
    process.env.JWT_SECRET, // Secret key for signing
    { expiresIn: process.env.JWT_EXPIRE || '7d' } // Token expires in 7 days
  );
};

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public (anyone can register)
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation: Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // 2. Check if user already exists
    // Note: We need to explicitly select password here (normally excluded)
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(409).json({ // 409 = Conflict
        success: false,
        message: 'User with this email already exists'
      });
    }

    // 3. Create new user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password
    });

    // 4. Generate JWT token
    const token = generateToken(user._id);

    // 5. Send response (exclude password from response)
    res.status(201).json({ // 201 = Created
      success: true,
      message: 'User registered successfully',
      token,
      user: user.getSafeProfile() // Helper method from User model
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation: Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // 2. Find user by email (include password for comparison)
    // Note: select('+password') is needed because password has select:false in schema
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Security: Don't reveal if email exists or not
      // Always say "Invalid credentials" (not "Email not found")
      return res.status(401).json({ // 401 = Unauthorized
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 3. Verify password using comparePassword method from User model
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id);

    // 5. Send response with token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.getSafeProfile()
    });

  } catch (error) {
    console.error('Login error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * @desc    Get current logged-in user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires authentication)
 * 
 * Note: This route will use auth middleware to verify token
 * req.user will be populated by the middleware
 */
exports.getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware (we'll create it next)
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: user.getSafeProfile()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};