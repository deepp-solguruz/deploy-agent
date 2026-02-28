/**
 * Employee Model - In-memory implementation
 * In production, this would be replaced with a proper database model (MongoDB, PostgreSQL, etc.)
 */

class Employee {
  constructor(data) {
    this.id = data.id || Date.now().toString();
    this.employeeId = data.employeeId; // Unique employee identifier
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.phone = data.phone || null;
    this.department = data.department;
    this.position = data.position;
    this.salary = data.salary || null;
    this.hireDate = data.hireDate;
    this.status = data.status || 'active'; // active, inactive, terminated
    this.managerId = data.managerId || null;
    this.address = data.address || {};
    this.emergencyContact = data.emergencyContact || {};
    this.skills = data.skills || [];
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || null;
    this.terminatedAt = data.terminatedAt || null;
  }

  // Get full name
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Convert to safe object
  toSafeObject() {
    return {
      id: this.id,
      employeeId: this.employeeId,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.getFullName(),
      email: this.email,
      phone: this.phone,
      department: this.department,
      position: this.position,
      salary: this.salary,
      hireDate: this.hireDate,
      status: this.status,
      managerId: this.managerId,
      address: this.address,
      emergencyContact: this.emergencyContact,
      skills: this.skills,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      terminatedAt: this.terminatedAt
    };
  }

  // Convert to JSON
  toJSON() {
    return this.toSafeObject();
  }

  // Update employee data
  update(data) {
    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'department', 
      'position', 'salary', 'status', 'managerId', 'address', 
      'emergencyContact', 'skills', 'notes'
    ];
    
    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        this[field] = data[field];
      }
    });

    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Terminate employee
  terminate(reason = '') {
    this.status = 'terminated';
    this.terminatedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    if (reason) {
      this.notes = this.notes ? `${this.notes}\nTermination reason: ${reason}` : `Termination reason: ${reason}`;
    }
    return this;
  }

  // Reactivate employee
  reactivate() {
    this.status = 'active';
    this.terminatedAt = null;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  // Check if employee is active
  isActive() {
    return this.status === 'active';
  }

  // Add skill
  addSkill(skill) {
    if (!this.skills.includes(skill)) {
      this.skills.push(skill);
      this.updatedAt = new Date().toISOString();
    }
    return this;
  }

  // Remove skill
  removeSkill(skill) {
    const index = this.skills.indexOf(skill);
    if (index > -1) {
      this.skills.splice(index, 1);
      this.updatedAt = new Date().toISOString();
    }
    return this;
  }

  // Calculate years of service
  getYearsOfService() {
    const hireDate = new Date(this.hireDate);
    const currentDate = this.status === 'terminated' ? new Date(this.terminatedAt) : new Date();
    const diffTime = Math.abs(currentDate - hireDate);
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    return diffYears;
  }

  // Validate employee data
  static validate(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate) {
      // Required fields for creation
      if (!data.employeeId) {
        errors.push('Employee ID is required');
      }
      if (!data.firstName) {
        errors.push('First name is required');
      }
      if (!data.lastName) {
        errors.push('Last name is required');
      }
      if (!data.email) {
        errors.push('Email is required');
      }
      if (!data.department) {
        errors.push('Department is required');
      }
      if (!data.position) {
        errors.push('Position is required');
      }
      if (!data.hireDate) {
        errors.push('Hire date is required');
      }
    }

    // Employee ID validation
    if (data.employeeId !== undefined) {
      if (typeof data.employeeId !== 'string') {
        errors.push('Employee ID must be a string');
      } else if (data.employeeId.length < 3 || data.employeeId.length > 20) {
        errors.push('Employee ID must be between 3 and 20 characters');
      } else if (!/^[a-zA-Z0-9_-]+$/.test(data.employeeId)) {
        errors.push('Employee ID can only contain letters, numbers, underscores, and hyphens');
      }
    }

    // Name validation
    if (data.firstName !== undefined) {
      if (typeof data.firstName !== 'string') {
        errors.push('First name must be a string');
      } else if (data.firstName.length < 1 || data.firstName.length > 50) {
        errors.push('First name must be between 1 and 50 characters');
      }
    }

    if (data.lastName !== undefined) {
      if (typeof data.lastName !== 'string') {
        errors.push('Last name must be a string');
      } else if (data.lastName.length < 1 || data.lastName.length > 50) {
        errors.push('Last name must be between 1 and 50 characters');
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

    // Phone validation
    if (data.phone !== undefined && data.phone !== null) {
      if (typeof data.phone !== 'string') {
        errors.push('Phone must be a string');
      } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
        errors.push('Phone must be a valid phone number');
      }
    }

    // Department validation
    if (data.department !== undefined) {
      if (typeof data.department !== 'string') {
        errors.push('Department must be a string');
      } else if (data.department.length < 1 || data.department.length > 100) {
        errors.push('Department must be between 1 and 100 characters');
      }
    }

    // Position validation
    if (data.position !== undefined) {
      if (typeof data.position !== 'string') {
        errors.push('Position must be a string');
      } else if (data.position.length < 1 || data.position.length > 100) {
        errors.push('Position must be between 1 and 100 characters');
      }
    }

    // Salary validation
    if (data.salary !== undefined && data.salary !== null) {
      if (typeof data.salary !== 'number' || data.salary < 0) {
        errors.push('Salary must be a positive number');
      }
    }

    // Hire date validation
    if (data.hireDate !== undefined) {
      const hireDate = new Date(data.hireDate);
      if (isNaN(hireDate.getTime())) {
        errors.push('Hire date must be a valid date');
      } else if (hireDate > new Date()) {
        errors.push('Hire date cannot be in the future');
      }
    }

    // Status validation
    if (data.status !== undefined) {
      const validStatuses = ['active', 'inactive', 'terminated'];
      if (!validStatuses.includes(data.status)) {
        errors.push('Status must be one of: active, inactive, terminated');
      }
    }

    // Skills validation
    if (data.skills !== undefined) {
      if (!Array.isArray(data.skills)) {
        errors.push('Skills must be an array');
      } else {
        data.skills.forEach((skill, index) => {
          if (typeof skill !== 'string') {
            errors.push(`Skill at index ${index} must be a string`);
          }
        });
      }
    }

    // Address validation
    if (data.address !== undefined) {
      if (typeof data.address !== 'object' || data.address === null) {
        errors.push('Address must be an object');
      }
    }

    // Emergency contact validation
    if (data.emergencyContact !== undefined) {
      if (typeof data.emergencyContact !== 'object' || data.emergencyContact === null) {
        errors.push('Emergency contact must be an object');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Employee;