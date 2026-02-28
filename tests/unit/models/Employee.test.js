const Employee = require('../../../src/models/Employee');

describe('Employee Model', () => {
  const validEmployeeData = {
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    phone: '+1234567890',
    department: 'Engineering',
    position: 'Software Developer',
    salary: 75000,
    hireDate: '2023-01-15',
    managerId: 'MGR001',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345'
    },
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+1234567891',
      relationship: 'Spouse'
    },
    skills: ['JavaScript', 'Node.js', 'React'],
    notes: 'Excellent performer'
  };

  describe('Constructor', () => {
    test('should create employee with valid data', () => {
      const employee = new Employee(validEmployeeData);

      expect(employee.employeeId).toBe('EMP001');
      expect(employee.firstName).toBe('John');
      expect(employee.lastName).toBe('Doe');
      expect(employee.email).toBe('john.doe@company.com');
      expect(employee.department).toBe('Engineering');
      expect(employee.position).toBe('Software Developer');
      expect(employee.status).toBe('active');
      expect(employee.skills).toEqual(['JavaScript', 'Node.js', 'React']);
    });

    test('should set default values for optional fields', () => {
      const minimalData = {
        employeeId: 'EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        department: 'HR',
        position: 'HR Manager',
        hireDate: '2023-02-01'
      };

      const employee = new Employee(minimalData);

      expect(employee.phone).toBeNull();
      expect(employee.salary).toBeNull();
      expect(employee.status).toBe('active');
      expect(employee.managerId).toBeNull();
      expect(employee.address).toEqual({});
      expect(employee.emergencyContact).toEqual({});
      expect(employee.skills).toEqual([]);
      expect(employee.notes).toBe('');
      expect(employee.updatedAt).toBeNull();
      expect(employee.terminatedAt).toBeNull();
    });

    test('should generate ID if not provided', () => {
      const employee = new Employee(validEmployeeData);
      expect(employee.id).toBeDefined();
      expect(typeof employee.id).toBe('string');
    });

    test('should set createdAt timestamp', () => {
      const employee = new Employee(validEmployeeData);
      expect(employee.createdAt).toBeDefined();
      expect(new Date(employee.createdAt)).toBeInstanceOf(Date);
    });
  });

  describe('getFullName', () => {
    test('should return full name', () => {
      const employee = new Employee(validEmployeeData);
      expect(employee.getFullName()).toBe('John Doe');
    });
  });

  describe('toSafeObject', () => {
    test('should return safe object with all fields', () => {
      const employee = new Employee(validEmployeeData);
      const safeObject = employee.toSafeObject();

      expect(safeObject).toHaveProperty('id');
      expect(safeObject).toHaveProperty('employeeId', 'EMP001');
      expect(safeObject).toHaveProperty('firstName', 'John');
      expect(safeObject).toHaveProperty('lastName', 'Doe');
      expect(safeObject).toHaveProperty('fullName', 'John Doe');
      expect(safeObject).toHaveProperty('email', 'john.doe@company.com');
      expect(safeObject).toHaveProperty('department', 'Engineering');
      expect(safeObject).toHaveProperty('position', 'Software Developer');
      expect(safeObject).toHaveProperty('status', 'active');
      expect(safeObject).toHaveProperty('skills', ['JavaScript', 'Node.js', 'React']);
    });
  });

  describe('update', () => {
    test('should update allowed fields', () => {
      const employee = new Employee(validEmployeeData);
      const updateData = {
        firstName: 'Johnny',
        position: 'Senior Software Developer',
        salary: 85000,
        skills: ['JavaScript', 'Node.js', 'React', 'TypeScript']
      };

      const updatedEmployee = employee.update(updateData);

      expect(updatedEmployee.firstName).toBe('Johnny');
      expect(updatedEmployee.position).toBe('Senior Software Developer');
      expect(updatedEmployee.salary).toBe(85000);
      expect(updatedEmployee.skills).toEqual(['JavaScript', 'Node.js', 'React', 'TypeScript']);
      expect(updatedEmployee.updatedAt).toBeDefined();
    });

    test('should not update non-allowed fields', () => {
      const employee = new Employee(validEmployeeData);
      const originalId = employee.id;
      const originalCreatedAt = employee.createdAt;

      employee.update({
        id: 'new-id',
        createdAt: '2023-12-01',
        hireDate: '2023-12-01'
      });

      expect(employee.id).toBe(originalId);
      expect(employee.createdAt).toBe(originalCreatedAt);
      expect(employee.hireDate).toBe('2023-01-15');
    });

    test('should set updatedAt timestamp', () => {
      const employee = new Employee(validEmployeeData);
      const originalUpdatedAt = employee.updatedAt;

      employee.update({ firstName: 'Johnny' });

      expect(employee.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(employee.updatedAt)).toBeInstanceOf(Date);
    });
  });

  describe('terminate', () => {
    test('should terminate employee without reason', () => {
      const employee = new Employee(validEmployeeData);
      const terminatedEmployee = employee.terminate();

      expect(terminatedEmployee.status).toBe('terminated');
      expect(terminatedEmployee.terminatedAt).toBeDefined();
      expect(terminatedEmployee.updatedAt).toBeDefined();
      expect(new Date(terminatedEmployee.terminatedAt)).toBeInstanceOf(Date);
    });

    test('should terminate employee with reason', () => {
      const employee = new Employee(validEmployeeData);
      const reason = 'Performance issues';
      const terminatedEmployee = employee.terminate(reason);

      expect(terminatedEmployee.status).toBe('terminated');
      expect(terminatedEmployee.terminatedAt).toBeDefined();
      expect(terminatedEmployee.notes).toContain(`Termination reason: ${reason}`);
    });

    test('should append reason to existing notes', () => {
      const employee = new Employee(validEmployeeData);
      const reason = 'Restructuring';
      const terminatedEmployee = employee.terminate(reason);

      expect(terminatedEmployee.notes).toBe(`${validEmployeeData.notes}\nTermination reason: ${reason}`);
    });
  });

  describe('reactivate', () => {
    test('should reactivate terminated employee', () => {
      const employee = new Employee(validEmployeeData);
      employee.terminate();
      const reactivatedEmployee = employee.reactivate();

      expect(reactivatedEmployee.status).toBe('active');
      expect(reactivatedEmployee.terminatedAt).toBeNull();
      expect(reactivatedEmployee.updatedAt).toBeDefined();
    });
  });

  describe('isActive', () => {
    test('should return true for active employee', () => {
      const employee = new Employee(validEmployeeData);
      expect(employee.isActive()).toBe(true);
    });

    test('should return false for terminated employee', () => {
      const employee = new Employee(validEmployeeData);
      employee.terminate();
      expect(employee.isActive()).toBe(false);
    });

    test('should return false for inactive employee', () => {
      const employee = new Employee(validEmployeeData);
      employee.update({ status: 'inactive' });
      expect(employee.isActive()).toBe(false);
    });
  });

  describe('addSkill', () => {
    test('should add new skill', () => {
      const employee = new Employee(validEmployeeData);
      const originalSkills = [...employee.skills];
      employee.addSkill('Python');

      expect(employee.skills).toContain('Python');
      expect(employee.skills.length).toBe(originalSkills.length + 1);
      expect(employee.updatedAt).toBeDefined();
    });

    test('should not add duplicate skill', () => {
      const employee = new Employee(validEmployeeData);
      const originalSkills = [...employee.skills];
      employee.addSkill('JavaScript');

      expect(employee.skills).toEqual(originalSkills);
      expect(employee.skills.length).toBe(originalSkills.length);
    });
  });

  describe('removeSkill', () => {
    test('should remove existing skill', () => {
      const employee = new Employee(validEmployeeData);
      employee.removeSkill('JavaScript');

      expect(employee.skills).not.toContain('JavaScript');
      expect(employee.skills).toEqual(['Node.js', 'React']);
      expect(employee.updatedAt).toBeDefined();
    });

    test('should not modify skills if skill does not exist', () => {
      const employee = new Employee(validEmployeeData);
      const originalSkills = [...employee.skills];
      employee.removeSkill('Python');

      expect(employee.skills).toEqual(originalSkills);
    });
  });

  describe('getYearsOfService', () => {
    test('should calculate years of service for active employee', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const employee = new Employee({
        ...validEmployeeData,
        hireDate: oneYearAgo.toISOString().split('T')[0]
      });

      const years = employee.getYearsOfService();
      expect(years).toBe(1);
    });

    test('should calculate years of service for terminated employee', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      
      const employee = new Employee({
        ...validEmployeeData,
        hireDate: twoYearsAgo.toISOString().split('T')[0]
      });
      
      employee.terminate();
      const years = employee.getYearsOfService();
      expect(years).toBe(2);
    });
  });

  describe('validate', () => {
    describe('Creation validation', () => {
      test('should validate valid employee data', () => {
        const validation = Employee.validate(validEmployeeData);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);
      });

      test('should require employeeId', () => {
        const invalidData = { ...validEmployeeData };
        delete invalidData.employeeId;
        
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Employee ID is required');
      });

      test('should require firstName', () => {
        const invalidData = { ...validEmployeeData };
        delete invalidData.firstName;
        
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('First name is required');
      });

      test('should require lastName', () => {
        const invalidData = { ...validEmployeeData };
        delete invalidData.lastName;
        
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Last name is required');
      });

      test('should require email', () => {
        const invalidData = { ...validEmployeeData };
        delete invalidData.email;
        
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Email is required');
      });

      test('should require department', () => {
        const invalidData = { ...validEmployeeData };
        delete invalidData.department;
        
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Department is required');
      });

      test('should require position', () => {
        const invalidData = { ...validEmployeeData };
        delete invalidData.position;
        
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Position is required');
      });

      test('should require hireDate', () => {
        const invalidData = { ...validEmployeeData };
        delete invalidData.hireDate;
        
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Hire date is required');
      });
    });

    describe('Field validation', () => {
      test('should validate employeeId format', () => {
        const invalidData = { ...validEmployeeData, employeeId: 'ab' };
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Employee ID must be between 3 and 20 characters');
      });

      test('should validate employeeId characters', () => {
        const invalidData = { ...validEmployeeData, employeeId: 'EMP@001' };
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Employee ID can only contain letters, numbers, underscores, and hyphens');
      });

      test('should validate email format', () => {
        const invalidData = { ...validEmployeeData, email: 'invalid-email' };
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Email must be a valid email address');
      });

      test('should validate phone format', () => {
        const invalidData = { ...validEmployeeData, phone: 'invalid-phone' };
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Phone must be a valid phone number');
      });

      test('should validate salary is positive', () => {
        const invalidData = { ...validEmployeeData, salary: -1000 };
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Salary must be a positive number');
      });

      test('should validate hire date is not in future', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        
        const invalidData = { ...validEmployeeData, hireDate: futureDate.toISOString().split('T')[0] };
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Hire date cannot be in the future');
      });

      test('should validate status values', () => {
        const invalidData = { ...validEmployeeData, status: 'invalid-status' };
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Status must be one of: active, inactive, terminated');
      });

      test('should validate skills is array', () => {
        const invalidData = { ...validEmployeeData, skills: 'not-an-array' };
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Skills must be an array');
      });

      test('should validate skills array contains strings', () => {
        const invalidData = { ...validEmployeeData, skills: ['JavaScript', 123, 'React'] };
        const validation = Employee.validate(invalidData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Skill at index 1 must be a string');
      });
    });

    describe('Update validation', () => {
      test('should validate update data', () => {
        const updateData = { firstName: 'Johnny', salary: 85000 };
        const validation = Employee.validate(updateData, true);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);
      });

      test('should not require fields for update', () => {
        const updateData = { firstName: 'Johnny' };
        const validation = Employee.validate(updateData, true);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);
      });

      test('should validate provided fields for update', () => {
        const updateData = { email: 'invalid-email' };
        const validation = Employee.validate(updateData, true);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Email must be a valid email address');
      });
    });
  });
});