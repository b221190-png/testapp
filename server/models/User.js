const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  organization: {
    type: String,
    trim: true,
    default: '',
    maxlength: [200, 'Organization name cannot exceed 200 characters']
  },
  role: {
    type: String,
    enum: ['interviewer', 'admin'],
    default: 'interviewer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster email lookups
userSchema.index({ email: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method to update login info
userSchema.methods.updateLoginInfo = async function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return await this.save();
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to create demo user
userSchema.statics.createDemoUser = async function() {
  try {
    const demoEmail = 'demo@proctoring.com';
    
    // Check if demo user already exists
    const existingUser = await this.findByEmail(demoEmail);
    if (existingUser) {
      console.log('Demo user already exists');
      return existingUser;
    }

    // Create demo user
    const demoUser = new this({
      name: 'Demo Interviewer',
      email: demoEmail,
      password: 'demo123', // Will be hashed by pre-save middleware
      organization: 'Demo Organization',
      role: 'interviewer',
      isActive: true
    });

    await demoUser.save();
    console.log('Demo user created successfully: demo@proctoring.com / demo123');
    return demoUser;
  } catch (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }
};

// Transform output to exclude password
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Virtual for user's full profile info
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    organization: this.organization,
    role: this.role,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
    loginCount: this.loginCount
  };
});

module.exports = mongoose.model('User', userSchema);
