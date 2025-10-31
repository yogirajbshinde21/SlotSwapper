const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * USER SCHEMA
 * 
 * Defines the structure for user accounts
 * Handles authentication (password hashing, comparison)
 */

const userSchema = new mongoose.Schema(
    {
        // Basic user information
        name: {
            type: String,
            required: [true, 'Please Provide name'],
            trim: true, //  Remove whitespaces from both end
            maxlength: [50, "Name cannot exceed 50 characters"]
        },

        email: {
            type: String,
            required: [true, "Please provide an email"],
            unique: true,
            lowercase: true, // convert to lowercase
            trim: true,
            // Regex validation for email format
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email'
            ]

        },
        
        password: {
            type: String,
            required: [true, "Please provide a password"],
            minlength: [6, 'Password must be at least of 6 characters'],
            select: false // Don't return password in queries by default for maintaining security.
        }
    },
    {
        // Mongoose Options
        timestamps: true  // Automatically adds createdAt and updatedAt fields
    }
);


// ============================================
// MIDDLEWARE HOOKS (run before/after operations)
// ============================================

/**
 * PRE-SAVE HOOK: Hash password before saving to database
 * 
 * Why hash passwords?
 * - Never store plain passwords (security breach = exposed passwords)
 * - bcrypt is one-way encryption (can't reverse it)
 * - Even if DB is compromised, passwords are safe
 * 
 * This runs automatically before user.save()
 */

userSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  // (Avoid re-hashing already hashed passwords on user update)
  if (!this.isModified('password')) {
    return next(); // Skip to next middleware
  }

  try {
    // Generate salt (random string added to password before hashing)
    // 10 rounds = security vs speed balance (higher = slower but more secure)
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    
    next(); // Continue to save operation
  } catch (error) {
    next(error); // Pass error to error handler
  }
});


// ============================================
// INSTANCE METHODS 
// ============================================

/**
 * Compare provided password with hashed password in database
 * 
 * Usage: const isMatch = await user.comparePassword('user_input_password');
 * 
 * @param {string} candidatePassword - Password provided by user during login
 * @returns {Promise<boolean>} - True if passwords match
 */


userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // bcrypt.compare handles the hashing of candidatePassword internally
    // and compares with this.password (the stored hash)
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};


/**
 * Generate safe user object (without sensitive data)
 * 
 * Usage: res.json({ user: user.getSafeProfile() });
 * 
 * @returns {object} - User data without password
 */
userSchema.methods.getSafeProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    createdAt: this.createdAt
  };
};



// ============================================
// CREATE AND EXPORT MODEL
// ============================================

/**
 * Create model from schema
 * Model name: 'User' (will create 'users' collection in MongoDB)
 */
const User = mongoose.model('User', userSchema);

module.exports = User;