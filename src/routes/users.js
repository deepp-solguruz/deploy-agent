const express = require('express');
const bcrypt = require('bcrypt');
const { authenticateToken } = require('../middleware/auth');
const { validateUserUpdate, validateUserCreate } = require('../validators/users');

const router = express.Router();

// In-memory user store (replace with database in production)
// This should be shared with auth.js - in production, use a proper database
const users = require('./auth').users || new Map();

// Get all users (admin only - simplified for demo)
router.get('/', authenticateToken, (req, res) => {
  try {
    const userList = Array.from(users.values()).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isActive: user.isActive
    }));

    res.json({
      message: 'Users retrieved successfully',
      users: userList,
      total: userList.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to retrieve users',
      message: 'Internal server error'
    });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const user = users.get(id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with specified ID does not exist'
      });
    }

    // Users can only view their own profile unless they're admin
    if (req.user.id !== id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own profile'
      });
    }

    res.json({
      message: 'User retrieved successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user',
      message: 'Internal server error'
    });
  }
});

// Create new user (admin only - simplified for demo)
router.post('/', authenticateToken, validateUserCreate, async (req, res) => {
  try {
    const { username, email, password, isActive = true } = req.body;

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
      isActive
    };

    users.set(userId, user);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: userId,
        username,
        email,
        createdAt: user.createdAt,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: 'Internal server error'
    });
  }
});

// Update user
router.put('/:id', authenticateToken, validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, isActive } = req.body;

    const user = users.get(id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with specified ID does not exist'
      });
    }

    // Users can only update their own profile unless they're admin
    if (req.user.id !== id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own profile'
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

    // Only allow isActive update if user is admin (simplified check)
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    user.updatedAt = new Date().toISOString();
    users.set(user.id, user);

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: 'Internal server error'
    });
  }
});

// Delete user (soft delete - deactivate)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const user = users.get(id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with specified ID does not exist'
      });
    }

    // Users can only delete their own account unless they're admin
    if (req.user.id !== id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own account'
      });
    }

    // Soft delete - deactivate user
    user.isActive = false;
    user.updatedAt = new Date().toISOString();
    user.deletedAt = new Date().toISOString();
    users.set(user.id, user);

    res.json({
      message: 'User deactivated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        deletedAt: user.deletedAt
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'Internal server error'
    });
  }
});

// Reactivate user
router.patch('/:id/activate', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const user = users.get(id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with specified ID does not exist'
      });
    }

    // Users can reactivate their own account
    if (req.user.id !== id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only reactivate your own account'
      });
    }

    user.isActive = true;
    user.updatedAt = new Date().toISOString();
    delete user.deletedAt;
    users.set(user.id, user);

    res.json({
      message: 'User reactivated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      error: 'Failed to reactivate user',
      message: 'Internal server error'
    });
  }
});

// Search users
router.get('/search/:query', authenticateToken, (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Invalid search query',
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = query.toLowerCase().trim();
    const allUsers = Array.from(users.values());
    
    const filteredUsers = allUsers
      .filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      )
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        isActive: user.isActive
      }));

    res.json({
      message: 'Search completed successfully',
      users: filteredUsers,
      query: searchTerm,
      total: filteredUsers.length
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'Internal server error'
    });
  }
});

module.exports = router;