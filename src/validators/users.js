const validateUserCreate = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  // Username validation
  if (!username) {
    errors.push('Username is required');
  } else if (typeof username !== 'string') {
    errors.push('Username must be a string');
  } else if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  } else if (username.length > 30) {
    errors.push('Username must be less than 30 characters');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else if (typeof email !== 'string') {
    errors.push('Email must be a string');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email must be a valid email address');
  } else if (email.length > 254) {
    errors.push('Email must be less than 254 characters');
  }

  // Password validation
  if (!password) {
    errors.push('Password is required');
  } else if (typeof password !== 'string') {
    errors.push('Password must be a string');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  } else if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  // isActive validation (optional)
  if (req.body.hasOwnProperty('isActive') && typeof req.body.isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid input data',
      details: errors
    });
  }

  next();
};

const validateUserUpdate = (req, res, next) => {
  const { email, isActive } = req.body;
  const errors = [];

  // At least one field should be provided
  if (!email && typeof isActive !== 'boolean') {
    errors.push('At least one field (email or isActive) must be provided');
  }

  // Email validation (optional)
  if (email !== undefined) {
    if (typeof email !== 'string') {
      errors.push('Email must be a string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Email must be a valid email address');
    } else if (email.length > 254) {
      errors.push('Email must be less than 254 characters');
    }
  }

  // isActive validation (optional)
  if (req.body.hasOwnProperty('isActive') && typeof isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid input data',
      details: errors
    });
  }

  next();
};

const validateUserId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'User ID is required'
    });
  }

  if (typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'User ID must be a valid string'
    });
  }

  next();
};

const validateSearchQuery = (req, res, next) => {
  const { query } = req.params;
  const { limit, offset } = req.query;
  const errors = [];

  // Query validation
  if (!query) {
    errors.push('Search query is required');
  } else if (typeof query !== 'string') {
    errors.push('Search query must be a string');
  } else if (query.trim().length < 2) {
    errors.push('Search query must be at least 2 characters long');
  } else if (query.length > 100) {
    errors.push('Search query must be less than 100 characters');
  }

  // Limit validation (optional)
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be a number between 1 and 100');
    }
  }

  // Offset validation (optional)
  if (offset !== undefined) {
    const offsetNum = parseInt(offset);
    if (isNaN(offsetNum) || offsetNum < 0) {
      errors.push('Offset must be a non-negative number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid search parameters',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateUserCreate,
  validateUserUpdate,
  validateUserId,
  validateSearchQuery
};