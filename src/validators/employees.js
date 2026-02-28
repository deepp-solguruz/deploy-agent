/**
 * Employee validation middleware
 */

// Validate employee creation data
const validateEmployeeCreate = (req, res, next) => {
  const { 
    employeeId, 
    firstName, 
    lastName, 
    email, 
    phone, 
    department, 
    position, 
    salary, 
    hireDate, 
    managerId,
    address,
    emergencyContact,
    skills,
    notes
  } = req.body;

  const errors = [];

  // Required fields
  if (!employeeId) {
    errors.push('Employee ID is required');
  } else if (typeof employeeId !== 'string' || employeeId.trim().length < 3) {
    errors.push('Employee ID must be at least 3 characters long');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(employeeId.trim())) {
    errors.push('Employee ID can only contain letters, numbers, underscores, and hyphens');
  }

  if (!firstName) {
    errors.push('First name is required');
  } else if (typeof firstName !== 'string' || firstName.trim().length < 1) {
    errors.push('First name must be at least 1 character long');
  } else if (firstName.trim().length > 50) {
    errors.push('First name must be less than 50 characters');
  }

  if (!lastName) {
    errors.push('Last name is required');
  } else if (typeof lastName !== 'string' || lastName.trim().length < 1) {
    errors.push('Last name must be at least 1 character long');
  } else if (lastName.trim().length > 50) {
    errors.push('Last name must be less than 50 characters');
  }

  if (!email) {
    errors.push('Email is required');
  } else if (typeof email !== 'string') {
    errors.push('Email must be a string');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email must be a valid email address');
  } else if (email.length > 254) {
    errors.push('Email must be less than 254 characters');
  }

  if (!department) {
    errors.push('Department is required');
  } else if (typeof department !== 'string' || department.trim().length < 1) {
    errors.push('Department must be at least 1 character long');
  } else if (department.trim().length > 100) {
    errors.push('Department must be less than 100 characters');
  }

  if (!position) {
    errors.push('Position is required');
  } else if (typeof position !== 'string' || position.trim().length < 1) {
    errors.push('Position must be at least 1 character long');
  } else if (position.trim().length > 100) {
    errors.push('Position must be less than 100 characters');
  }

  if (!hireDate) {
    errors.push('Hire date is required');
  } else {
    const hireDateObj = new Date(hireDate);
    if (isNaN(hireDateObj.getTime())) {
      errors.push('Hire date must be a valid date');
    } else if (hireDateObj > new Date()) {
      errors.push('Hire date cannot be in the future');
    }
  }

  // Optional fields validation
  if (phone && typeof phone !== 'string') {
    errors.push('Phone must be a string');
  }

  if (salary !== undefined && salary !== null) {
    if (typeof salary !== 'number' || salary < 0) {
      errors.push('Salary must be a positive number');
    }
  }

  if (managerId && typeof managerId !== 'string') {
    errors.push('Manager ID must be a string');
  }

  if (address && (typeof address !== 'object' || address === null)) {
    errors.push('Address must be an object');
  }

  if (emergencyContact && (typeof emergencyContact !== 'object' || emergencyContact === null)) {
    errors.push('Emergency contact must be an object');
  }

  if (skills && !Array.isArray(skills)) {
    errors.push('Skills must be an array');
  } else if (skills) {
    skills.forEach((skill, index) => {
      if (typeof skill !== 'string') {
        errors.push(`Skill at index ${index} must be a string`);
      }
    });
  }

  if (notes && typeof notes !== 'string') {
    errors.push('Notes must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check the provided data',
      details: errors
    });
  }

  // Sanitize data
  req.body.employeeId = employeeId.trim();
  req.body.firstName = firstName.trim();
  req.body.lastName = lastName.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.department = department.trim();
  req.body.position = position.trim();
  
  if (phone) {
    req.body.phone = phone.trim();
  }
  
  if (notes) {
    req.body.notes = notes.trim();
  }

  next();
};

// Validate employee update data
const validateEmployeeUpdate = (req, res, next) => {
  const { 
    employeeId, 
    firstName, 
    lastName, 
    email, 
    phone, 
    department, 
    position, 
    salary, 
    status,
    managerId,
    address,
    emergencyContact,
    skills,
    notes
  } = req.body;

  const errors = [];

  // Validate fields if provided
  if (employeeId !== undefined) {
    if (typeof employeeId !== 'string' || employeeId.trim().length < 3) {
      errors.push('Employee ID must be at least 3 characters long');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(employeeId.trim())) {
      errors.push('Employee ID can only contain letters, numbers, underscores, and hyphens');
    }
  }

  if (firstName !== undefined) {
    if (typeof firstName !== 'string' || firstName.trim().length < 1) {
      errors.push('First name must be at least 1 character long');
    } else if (firstName.trim().length > 50) {
      errors.push('First name must be less than 50 characters');
    }
  }

  if (lastName !== undefined) {
    if (typeof lastName !== 'string' || lastName.trim().length < 1) {
      errors.push('Last name must be at least 1 character long');
    } else if (lastName.trim().length > 50) {
      errors.push('Last name must be less than 50 characters');
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string') {
      errors.push('Email must be a string');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Email must be a valid email address');
    } else if (email.length > 254) {
      errors.push('Email must be less than 254 characters');
    }
  }

  if (department !== undefined) {
    if (typeof department !== 'string' || department.trim().length < 1) {
      errors.push('Department must be at least 1 character long');
    } else if (department.trim().length > 100) {
      errors.push('Department must be less than 100 characters');
    }
  }

  if (position !== undefined) {
    if (typeof position !== 'string' || position.trim().length < 1) {
      errors.push('Position must be at least 1 character long');
    } else if (position.trim().length > 100) {
      errors.push('Position must be less than 100 characters');
    }
  }

  if (phone !== undefined && phone !== null) {
    if (typeof phone !== 'string') {
      errors.push('Phone must be a string');
    }
  }

  if (salary !== undefined && salary !== null) {
    if (typeof salary !== 'number' || salary < 0) {
      errors.push('Salary must be a positive number');
    }
  }

  if (status !== undefined) {
    const validStatuses = ['active', 'inactive', 'terminated'];
    if (!validStatuses.includes(status)) {
      errors.push('Status must be one of: active, inactive, terminated');
    }
  }

  if (managerId !== undefined && managerId !== null) {
    if (typeof managerId !== 'string') {
      errors.push('Manager ID must be a string');
    }
  }

  if (address !== undefined && address !== null) {
    if (typeof address !== 'object') {
      errors.push('Address must be an object');
    }
  }

  if (emergencyContact !== undefined && emergencyContact !== null) {
    if (typeof emergencyContact !== 'object') {
      errors.push('Emergency contact must be an object');
    }
  }

  if (skills !== undefined) {
    if (!Array.isArray(skills)) {
      errors.push('Skills must be an array');
    } else {
      skills.forEach((skill, index) => {
        if (typeof skill !== 'string') {
          errors.push(`Skill at index ${index} must be a string`);
        }
      });
    }
  }

  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      errors.push('Notes must be a string');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check the provided data',
      details: errors
    });
  }

  // Sanitize data
  if (employeeId !== undefined) {
    req.body.employeeId = employeeId.trim();
  }
  if (firstName !== undefined) {
    req.body.firstName = firstName.trim();
  }
  if (lastName !== undefined) {
    req.body.lastName = lastName.trim();
  }
  if (email !== undefined) {
    req.body.email = email.trim().toLowerCase();
  }
  if (department !== undefined) {
    req.body.department = department.trim();
  }
  if (position !== undefined) {
    req.body.position = position.trim();
  }
  if (phone !== undefined && phone !== null) {
    req.body.phone = phone.trim();
  }
  if (notes !== undefined && notes !== null) {
    req.body.notes = notes.trim();
  }

  next();
};

// Validate search parameters
const validateEmployeeSearch = (req, res, next) => {
  const { query } = req.params;
  const { limit, offset } = req.query;

  const errors = [];

  if (!query || query.trim().length < 2) {
    errors.push('Search query must be at least 2 characters long');
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be a number between 1 and 100');
    }
  }

  if (offset !== undefined) {
    const offsetNum = parseInt(offset);
    if (isNaN(offsetNum) || offsetNum < 0) {
      errors.push('Offset must be a non-negative number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check the provided parameters',
      details: errors
    });
  }

  next();
};

// Validate pagination parameters
const validatePagination = (req, res, next) => {
  const { limit, offset } = req.query;

  const errors = [];

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be a number between 1 and 100');
    }
  }

  if (offset !== undefined) {
    const offsetNum = parseInt(offset);
    if (isNaN(offsetNum) || offsetNum < 0) {
      errors.push('Offset must be a non-negative number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check the provided parameters',
      details: errors
    });
  }

  next();
};

// Validate employee ID parameter
const validateEmployeeId = (req, res, next) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid employee ID',
      message: 'Employee ID is required and must be a valid string'
    });
  }

  next();
};

// Validate termination data
const validateTermination = (req, res, next) => {
  const { reason } = req.body;

  if (reason !== undefined && typeof reason !== 'string') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Termination reason must be a string'
    });
  }

  if (reason) {
    req.body.reason = reason.trim();
  }

  next();
};

module.exports = {
  validateEmployeeCreate,
  validateEmployeeUpdate,
  validateEmployeeSearch,
  validatePagination,
  validateEmployeeId,
  validateTermination
};