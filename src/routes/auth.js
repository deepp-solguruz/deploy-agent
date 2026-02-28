const express = require('express');
const bcrypt = require('bcrypt');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../validators/auth');

const router = express.Router();

// In-memory user store (replace with database in production)
const users = new Map();

// Register endpoint
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(
      user => user.username === username || user.email === email
    );

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Username or email already registered'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = Date.now().toString();
    const user = {
      id: userId,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    users.set(userId, user);

    // Generate token
    const token = generateToken({
      id: userId,
      username,
      email
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        username,
        email,
        createdAt: user.createdAt
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error'
    });
  }
});

// Login endpoint
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = Array.from(users.values()).find(
      user => user.username === username || user.email === username
    );

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = users.get(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const user = users.get(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = Array.from(users.values()).find(
        u => u.email === email && u.id !== user.id
      );

      if (existingUser) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'Email is already registered to another user'
        });
      }

      user.email = email;
    }

    user.updatedAt = new Date().toISOString();
    users.set(user.id, user);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Profile update failed',
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = users.get(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid current password',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedNewPassword;
    user.updatedAt = new Date().toISOString();
    users.set(user.id, user);

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: 'Internal server error'
    });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: 'Logout successful',
    note: 'Please remove the token from client storage'
  });
});

// Refresh token endpoint
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    const user = users.get(req.user.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'User not found or inactive',
        message: 'Cannot refresh token'
      });
    }

    // Generate new token
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email
    });

    res.json({
      message: 'Token refreshed successfully',
      token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Internal server error'
    });
  }
});

module.exports = router;