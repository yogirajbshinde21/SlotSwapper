const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * Protects routes by verifying JWT tokens
 * Adds authenticated user to req.user for use in controllers
 * 
 * Usage in routes:
 * router.get('/protected', authenticate, controller)
 */

/**
 * Middleware to authenticate JWT tokens
 * 
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Verify token with JWT_SECRET
 * 3. Find user from decoded token
 * 4. Attach user to request object
 * 5. Call next() to proceed to controller
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from header
    // Format: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login to access this resource.'
      });
    }

    // Extract token (remove "Bearer " prefix)
    // "Bearer eyJhbGci..." -> "eyJhbGci..."
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // 2. Verify token
    // jwt.verify throws error if token is invalid/expired
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.'
        });
      }

      throw error; // Re-throw unexpected errors
    }

    // 3. Find user from decoded token
    // decoded = { userId: "507f...", iat: 1234567890, exp: 1234567890 }
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    // 4. Attach user info to request object
    // Now controllers can access req.user
    req.user = {
      userId: user._id,
      email: user.email,
      name: user.name
    };

    // 5. Proceed to next middleware/controller
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = authenticate;