/**
 * User Model - In-memory implementation
 * In production, this would be replaced with a proper database model (MongoDB, PostgreSQL, etc.)
 */

class User {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.username = data.username;
    this.email = data.email;
    this.password = data.password; // Should be hashed
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || null;
    this.deletedAt = data.deletedAt || null;
    this.role = data.role || 'user'; // user, admin
    this.lastLoginAt = data.lastLoginAt || null;
    this.loginAttempts = data.loginAttempts || 0;
    this.lockedUntil = data.lockedUntil || null;
  }

  // Convert to safe object (without password)
  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      isActive: this.isActive,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt
    };
  }

  // Convert to JSON (without password)
  toJSON() {
    return this.toSafeObject();
  }

  // Update user data
  update(data) {
    const allowedFields = ['email', 'isActive', 'role', 'lastLoginAt', 'loginAttempts', 'lockedUntil'];
    
    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        this[field] = data[field];
      }
    });

    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Soft delete
  softDelete() {
    this.isActive = false;
    this.deletedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Restore from soft delete
  restore() {
    this.isActive = true;
    this.deletedAt = null;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Check if user is locked
  isLocked() {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  // Lock user account
  lock(duration = 15 * 60 * 1000) { // 15 minutes default
    this.lockedUntil = new Date(Date.now() + duration).toISOString();
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Unlock user account
  unlock() {
    this.lockedUntil = null;
    this.loginAttempts = 0;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Increment login attempts
  incrementLoginAttempts() {
    this.loginAttempts += 1;
    this.updatedAt = new Date().toISOString();
    
    // Lock account after 5 failed attempts
    if (this.loginAttempts >= 5) {
      this.lock();
    }
    
    return this;
  }

  // Reset login attempts on successful login
  resetLoginAttempts() {
    this.loginAttempts = 0;
    this.lockedUntil = null;
    this.lastLoginAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Validate user data
  static validate(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate) {
      // Required fields for creation
      if (!data.username) {
        errors.push('Username is required');
      }
      if (!data.email) {
        errors.push('Email is required');
      }
      if (!data.password) {
        errors.push('Password is required');
      }
    }

    // Username validation
    if (data.username !== undefined) {
      if (typeof data.username !== 'string') {
        errors.push('Username must be a string');
      } else if (data.username.length < 3 || data.username.length > 30) {
        errors.push('Username must be between 3 and 30 characters');
      } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
      }
    }

    // Email validation
    if (data.email !== undefined) {
      if (typeof data.email !== 'string') {
        errors.push('Email must be a string');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Email must be a valid email address');
      } else if (data.email.length > 254) {
        errors.push('Email must be less than 254 characters');
      }
    }

    // Password validation (only for creation or when password is being updated)
    if (data.password !== undefined) {
      if (typeof data.password !== 'string') {
        errors.push('Password must be a string');
      } else if (data.password.length < 6 || data.password.length > 128) {
        errors.push('Password must be between 6 and 128 characters');
      }
    }

    // Role validation
    if (data.role !== undefined) {
      const validRoles = ['user', 'admin'];
      if (!validRoles.includes(data.role)) {
        errors.push('Role must be either "user" or "admin"');
      }
    }

    // isActive validation
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
      errors.push('isActive must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = User;