const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Interview = require('../models/Interview');

// Simple in-memory user store (replace with database in production)
const users = new Map();

// Register new interviewer
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, organization } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    if (users.has(email.toLowerCase())) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store user
    const user = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      organization: organization || '',
      role: 'interviewer',
      createdAt: new Date(),
      isActive: true
    };

    users.set(email.toLowerCase(), user);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organization: user.organization,
          role: user.role
        },
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
      message: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = users.get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'default-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organization: user.organization,
          role: user.role
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
      message: error.message
    });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = users.get(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
      message: error.message
    });
  }
});

// Update user profile
router.patch('/profile', verifyToken, async (req, res) => {
  try {
    const { name, organization } = req.body;
    
    const user = users.get(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user data
    if (name) user.name = name;
    if (organization !== undefined) user.organization = organization;
    user.updatedAt = new Date();

    users.set(req.user.email, user);

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// Change password
router.patch('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    const user = users.get(req.user.email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    user.updatedAt = new Date();
    users.set(req.user.email, user);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: error.message
    });
  }
});

// Get user statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Get interview statistics for the user
    const totalInterviews = await Interview.countDocuments({ 
      interviewerEmail: userEmail 
    });

    const scheduledInterviews = await Interview.countDocuments({ 
      interviewerEmail: userEmail, 
      status: 'scheduled' 
    });

    const inProgressInterviews = await Interview.countDocuments({ 
      interviewerEmail: userEmail, 
      status: 'in-progress' 
    });

    const completedInterviews = await Interview.countDocuments({ 
      interviewerEmail: userEmail, 
      status: 'completed' 
    });

    // Get recent interviews
    const recentInterviews = await Interview.find({ 
      interviewerEmail: userEmail 
    })
    .sort({ scheduledDate: -1 })
    .limit(5)
    .select('candidateName position scheduledDate status integrityScore');

    res.json({
      success: true,
      data: {
        totalInterviews,
        scheduledInterviews,
        inProgressInterviews,
        completedInterviews,
        recentInterviews
      }
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// Logout (invalidate token - in a real app, you'd maintain a blacklist)
router.post('/logout', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Create default demo user for testing
const createDemoUser = async () => {
  try {
    const demoEmail = 'demo@proctoring.com';
    
    if (!users.has(demoEmail)) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      
      const demoUser = {
        id: 'demo-user-id',
        name: 'Demo Interviewer',
        email: demoEmail,
        password: hashedPassword,
        organization: 'Demo Organization',
        role: 'interviewer',
        createdAt: new Date(),
        isActive: true
      };

      users.set(demoEmail, demoUser);
      console.log('Demo user created: demo@proctoring.com / demo123');
    }
  } catch (error) {
    console.error('Error creating demo user:', error);
  }
};

// Create demo user on startup
createDemoUser();

module.exports = { router, verifyToken };
