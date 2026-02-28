// Validation middleware for auth endpoints

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Register validation middleware
const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  if (!username) {
    errors.push('Username is required');
  } else if (!validateUsername(username)) {
    errors.push('Username must be 3-20 characters long and contain only letters, numbers, and underscores');
  }

  if (!email) {
    errors.push('Email is required');
  } else if (!validateEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password) {
    errors.push('Password is required');
  } else if (!validatePassword(password)) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please fix the following errors',
      errors
    });
  }

  next();
};

// Login validation middleware
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username) {
    errors.push('Username or email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please fix the following errors',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateEmail,
  validatePassword,
  validateUsername
};