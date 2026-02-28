const bcrypt = require('bcrypt');
const User = require('../models/User');

/**
 * UserService - Business logic for user management
 * In production, this would interact with a proper database
 */

class UserService {
  constructor() {
    // In-memory storage - replace with database in production
    this.users = new Map();
  }

  // Create a new user
  async createUser(userData) {
    try {
      // Validate user data
      const validation = User.validate(userData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if user already exists
      const existingUser = this.findByUsernameOrEmail(userData.username, userData.email);
      if (existingUser) {
        throw new Error('User with this username or email already exists');
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user instance
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      // Store user
      this.users.set(user.id, user);

      return user;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Get user by ID
  getUserById(id) {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Get all users with pagination
  getAllUsers(options = {}) {
    const { limit = 10, offset = 0, includeInactive = false } = options;
    
    let userList = Array.from(this.users.values());
    
    // Filter out inactive users unless requested
    if (!includeInactive) {
      userList = userList.filter(user => user.isActive);
    }

    // Apply pagination
    const total = userList.length;
    const paginatedUsers = userList.slice(offset, offset + limit);

    return {
      users: paginatedUsers,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
  }

  // Update user
  async updateUser(id, updateData) {
    try {
      const user = this.getUserById(id);

      // Validate update data
      const validation = User.validate(updateData, true);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = this.findByEmail(updateData.email);
        if (existingUser && existingUser.id !== id) {
          throw new Error('Email is already registered to another user');
        }
      }

      // Hash password if being updated
      if (updateData.password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }

      // Update user
      user.update(updateData);
      this.users.set(id, user);

      return user;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  // Soft delete user
  deleteUser(id) {
    try {
      const user = this.getUserById(id);
      user.softDelete();
      this.users.set(id, user);
      return user;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Restore user
  restoreUser(id) {
    try {
      const user = this.users.get(id); // Don't use getUserById as it might filter inactive users
      if (!user) {
        throw new Error('User not found');
      }
      user.restore();
      this.users.set(id, user);
      return user;
    } catch (error) {
      throw new Error(`Failed to restore user: ${error.message}`);
    }
  }

  // Find user by username or email
  findByUsernameOrEmail(username, email) {
    return Array.from(this.users.values()).find(
      user => user.username === username || user.email === email
    );
  }

  // Find user by email
  findByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  // Find user by username
  findByUsername(username) {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  // Search users
  searchUsers(query, options = {}) {
    const { limit = 10, offset = 0, includeInactive = false } = options;
    
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const searchTerm = query.toLowerCase().trim();
    let userList = Array.from(this.users.values());

    // Filter out inactive users unless requested
    if (!includeInactive) {
      userList = userList.filter(user => user.isActive);
    }

    // Search in username and email
    const filteredUsers = userList.filter(user =>
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );

    // Apply pagination
    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return {
      users: paginatedUsers,
      total,
      limit,
      offset,
      query: searchTerm,
      hasMore: offset + limit < total
    };
  }

  // Authenticate user
  async authenticateUser(usernameOrEmail, password) {
    try {
      const user = this.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      if (user.isLocked()) {
        throw new Error('Account is temporarily locked due to multiple failed login attempts');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        user.incrementLoginAttempts();
        this.users.set(user.id, user);
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      user.resetLoginAttempts();
      this.users.set(user.id, user);

      return user;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  // Change user password
  async changePassword(id, currentPassword, newPassword) {
    try {
      const user = this.getUserById(id);

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      const validation = User.validate({ password: newPassword }, true);
      if (!validation.isValid) {
        throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedPassword;
      user.updatedAt = new Date().toISOString();
      this.users.set(id, user);

      return user;
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  // Get user statistics
  getUserStats() {
    const allUsers = Array.from(this.users.values());
    
    return {
      total: allUsers.length,
      active: allUsers.filter(user => user.isActive).length,
      inactive: allUsers.filter(user => !user.isActive).length,
      locked: allUsers.filter(user => user.isLocked()).length,
      admins: allUsers.filter(user => user.role === 'admin').length,
      users: allUsers.filter(user => user.role === 'user').length
    };
  }

  // Bulk operations
  async bulkCreateUsers(usersData) {
    const results = {
      created: [],
      failed: []
    };

    for (const userData of usersData) {
      try {
        const user = await this.createUser(userData);
        results.created.push(user.toSafeObject());
      } catch (error) {
        results.failed.push({
          userData,
          error: error.message
        });
      }
    }

    return results;
  }

  // Export users (for backup/migration)
  exportUsers() {
    return Array.from(this.users.values()).map(user => ({
      ...user.toSafeObject(),
      password: user.password // Include password hash for migration
    }));
  }

  // Import users (for backup/migration)
  async importUsers(usersData, options = { overwrite: false }) {
    const results = {
      imported: [],
      skipped: [],
      failed: []
    };

    for (const userData of usersData) {
      try {
        const existingUser = this.findByUsernameOrEmail(userData.username, userData.email);
        
        if (existingUser && !options.overwrite) {
          results.skipped.push({
            userData,
            reason: 'User already exists'
          });
          continue;
        }

        const user = new User(userData);
        this.users.set(user.id, user);
        results.imported.push(user.toSafeObject());
      } catch (error) {
        results.failed.push({
          userData,
          error: error.message
        });
      }
    }

    return results;
  }
}

// Export singleton instance
module.exports = new UserService();