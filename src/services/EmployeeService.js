const Employee = require('../models/Employee');

/**
 * EmployeeService - Business logic for employee management
 * In production, this would interact with a proper database
 */

class EmployeeService {
  constructor() {
    // In-memory storage - replace with database in production
    this.employees = new Map();
  }

  // Create a new employee
  async createEmployee(employeeData) {
    try {
      // Validate employee data
      const validation = Employee.validate(employeeData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if employee ID already exists
      const existingEmployee = this.findByEmployeeId(employeeData.employeeId);
      if (existingEmployee) {
        throw new Error('Employee with this employee ID already exists');
      }

      // Check if email already exists
      const existingEmailEmployee = this.findByEmail(employeeData.email);
      if (existingEmailEmployee) {
        throw new Error('Employee with this email already exists');
      }

      // Create employee instance
      const employee = new Employee(employeeData);

      // Store employee
      this.employees.set(employee.id, employee);

      return employee;
    } catch (error) {
      throw new Error(`Failed to create employee: ${error.message}`);
    }
  }

  // Get employee by ID
  getEmployeeById(id) {
    const employee = this.employees.get(id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    return employee;
  }

  // Get employee by employee ID
  findByEmployeeId(employeeId) {
    return Array.from(this.employees.values()).find(
      employee => employee.employeeId === employeeId
    );
  }

  // Get employee by email
  findByEmail(email) {
    return Array.from(this.employees.values()).find(
      employee => employee.email === email
    );
  }

  // Get all employees with pagination and filtering
  getAllEmployees(options = {}) {
    const { 
      limit = 10, 
      offset = 0, 
      department = null, 
      status = null, 
      position = null,
      managerId = null,
      includeTerminated = false 
    } = options;
    
    let employeeList = Array.from(this.employees.values());
    
    // Apply filters
    if (department) {
      employeeList = employeeList.filter(emp => 
        emp.department.toLowerCase().includes(department.toLowerCase())
      );
    }

    if (status) {
      employeeList = employeeList.filter(emp => emp.status === status);
    } else if (!includeTerminated) {
      employeeList = employeeList.filter(emp => emp.status !== 'terminated');
    }

    if (position) {
      employeeList = employeeList.filter(emp => 
        emp.position.toLowerCase().includes(position.toLowerCase())
      );
    }

    if (managerId) {
      employeeList = employeeList.filter(emp => emp.managerId === managerId);
    }

    // Sort by last name, then first name
    employeeList.sort((a, b) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    });

    // Apply pagination
    const total = employeeList.length;
    const paginatedEmployees = employeeList.slice(offset, offset + limit);

    return {
      employees: paginatedEmployees,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
  }

  // Update employee
  async updateEmployee(id, updateData) {
    try {
      const employee = this.getEmployeeById(id);

      // Validate update data
      const validation = Employee.validate(updateData, true);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if employee ID is being changed and if it's already taken
      if (updateData.employeeId && updateData.employeeId !== employee.employeeId) {
        const existingEmployee = this.findByEmployeeId(updateData.employeeId);
        if (existingEmployee && existingEmployee.id !== id) {
          throw new Error('Employee ID is already taken by another employee');
        }
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== employee.email) {
        const existingEmployee = this.findByEmail(updateData.email);
        if (existingEmployee && existingEmployee.id !== id) {
          throw new Error('Email is already registered to another employee');
        }
      }

      // Update employee
      employee.update(updateData);
      this.employees.set(id, employee);

      return employee;
    } catch (error) {
      throw new Error(`Failed to update employee: ${error.message}`);
    }
  }

  // Terminate employee
  terminateEmployee(id, reason = '') {
    try {
      const employee = this.getEmployeeById(id);
      employee.terminate(reason);
      this.employees.set(id, employee);
      return employee;
    } catch (error) {
      throw new Error(`Failed to terminate employee: ${error.message}`);
    }
  }

  // Reactivate employee
  reactivateEmployee(id) {
    try {
      const employee = this.getEmployeeById(id);
      employee.reactivate();
      this.employees.set(id, employee);
      return employee;
    } catch (error) {
      throw new Error(`Failed to reactivate employee: ${error.message}`);
    }
  }

  // Delete employee (hard delete)
  deleteEmployee(id) {
    try {
      const employee = this.getEmployeeById(id);
      this.employees.delete(id);
      return employee;
    } catch (error) {
      throw new Error(`Failed to delete employee: ${error.message}`);
    }
  }

  // Search employees
  searchEmployees(query, options = {}) {
    const { limit = 10, offset = 0, includeTerminated = false } = options;
    
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    const searchTerm = query.toLowerCase().trim();
    let employeeList = Array.from(this.employees.values());

    // Filter out terminated employees unless requested
    if (!includeTerminated) {
      employeeList = employeeList.filter(emp => emp.status !== 'terminated');
    }

    // Search in multiple fields
    const filteredEmployees = employeeList.filter(employee =>
      employee.firstName.toLowerCase().includes(searchTerm) ||
      employee.lastName.toLowerCase().includes(searchTerm) ||
      employee.email.toLowerCase().includes(searchTerm) ||
      employee.employeeId.toLowerCase().includes(searchTerm) ||
      employee.department.toLowerCase().includes(searchTerm) ||
      employee.position.toLowerCase().includes(searchTerm) ||
      employee.skills.some(skill => skill.toLowerCase().includes(searchTerm))
    );

    // Sort by relevance (exact matches first, then partial matches)
    filteredEmployees.sort((a, b) => {
      const aFullName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const bFullName = `${b.firstName} ${b.lastName}`.toLowerCase();
      
      // Exact matches first
      if (aFullName === searchTerm && bFullName !== searchTerm) return -1;
      if (bFullName === searchTerm && aFullName !== searchTerm) return 1;
      
      // Then by last name
      return a.lastName.localeCompare(b.lastName);
    });

    // Apply pagination
    const total = filteredEmployees.length;
    const paginatedEmployees = filteredEmployees.slice(offset, offset + limit);

    return {
      employees: paginatedEmployees,
      total,
      limit,
      offset,
      query: searchTerm,
      hasMore: offset + limit < total
    };
  }

  // Get employees by department
  getEmployeesByDepartment(department, options = {}) {
    const { limit = 10, offset = 0, includeTerminated = false } = options;
    
    let employeeList = Array.from(this.employees.values());

    // Filter by department
    employeeList = employeeList.filter(emp => 
      emp.department.toLowerCase() === department.toLowerCase()
    );

    // Filter out terminated employees unless requested
    if (!includeTerminated) {
      employeeList = employeeList.filter(emp => emp.status !== 'terminated');
    }

    // Sort by position, then by last name
    employeeList.sort((a, b) => {
      const positionCompare = a.position.localeCompare(b.position);
      if (positionCompare !== 0) return positionCompare;
      return a.lastName.localeCompare(b.lastName);
    });

    // Apply pagination
    const total = employeeList.length;
    const paginatedEmployees = employeeList.slice(offset, offset + limit);

    return {
      employees: paginatedEmployees,
      department,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
  }

  // Get employees by manager
  getEmployeesByManager(managerId, options = {}) {
    const { limit = 10, offset = 0, includeTerminated = false } = options;
    
    let employeeList = Array.from(this.employees.values());

    // Filter by manager
    employeeList = employeeList.filter(emp => emp.managerId === managerId);

    // Filter out terminated employees unless requested
    if (!includeTerminated) {
      employeeList = employeeList.filter(emp => emp.status !== 'terminated');
    }

    // Sort by last name
    employeeList.sort((a, b) => a.lastName.localeCompare(b.lastName));

    // Apply pagination
    const total = employeeList.length;
    const paginatedEmployees = employeeList.slice(offset, offset + limit);

    return {
      employees: paginatedEmployees,
      managerId,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
  }

  // Get employee statistics
  getEmployeeStats() {
    const allEmployees = Array.from(this.employees.values());
    
    const stats = {
      total: allEmployees.length,
      active: allEmployees.filter(emp => emp.status === 'active').length,
      inactive: allEmployees.filter(emp => emp.status === 'inactive').length,
      terminated: allEmployees.filter(emp => emp.status === 'terminated').length,
      departments: {},
      positions: {},
      averageSalary: 0,
      averageYearsOfService: 0
    };

    // Department and position statistics
    allEmployees.forEach(emp => {
      // Department stats
      if (!stats.departments[emp.department]) {
        stats.departments[emp.department] = 0;
      }
      stats.departments[emp.department]++;

      // Position stats
      if (!stats.positions[emp.position]) {
        stats.positions[emp.position] = 0;
      }
      stats.positions[emp.position]++;
    });

    // Calculate averages for active employees
    const activeEmployees = allEmployees.filter(emp => emp.status === 'active');
    
    if (activeEmployees.length > 0) {
      // Average salary
      const employeesWithSalary = activeEmployees.filter(emp => emp.salary);
      if (employeesWithSalary.length > 0) {
        const totalSalary = employeesWithSalary.reduce((sum, emp) => sum + emp.salary, 0);
        stats.averageSalary = Math.round(totalSalary / employeesWithSalary.length);
      }

      // Average years of service
      const totalYears = activeEmployees.reduce((sum, emp) => sum + emp.getYearsOfService(), 0);
      stats.averageYearsOfService = Math.round((totalYears / activeEmployees.length) * 10) / 10;
    }

    return stats;
  }

  // Get department list
  getDepartments() {
    const departments = new Set();
    Array.from(this.employees.values()).forEach(emp => {
      departments.add(emp.department);
    });
    return Array.from(departments).sort();
  }

  // Get position list
  getPositions() {
    const positions = new Set();
    Array.from(this.employees.values()).forEach(emp => {
      positions.add(emp.position);
    });
    return Array.from(positions).sort();
  }

  // Get skills list
  getSkills() {
    const skills = new Set();
    Array.from(this.employees.values()).forEach(emp => {
      emp.skills.forEach(skill => skills.add(skill));
    });
    return Array.from(skills).sort();
  }

  // Bulk operations
  async bulkCreateEmployees(employeesData) {
    const results = {
      created: [],
      failed: []
    };

    for (const employeeData of employeesData) {
      try {
        const employee = await this.createEmployee(employeeData);
        results.created.push(employee.toSafeObject());
      } catch (error) {
        results.failed.push({
          employeeData,
          error: error.message
        });
      }
    }

    return results;
  }

  // Export employees (for backup/migration)
  exportEmployees() {
    return Array.from(this.employees.values()).map(emp => emp.toSafeObject());
  }

  // Import employees (for backup/migration)
  async importEmployees(employeesData, options = { overwrite: false }) {
    const results = {
      imported: [],
      skipped: [],
      failed: []
    };

    for (const employeeData of employeesData) {
      try {
        const existingEmployee = this.findByEmployeeId(employeeData.employeeId);
        
        if (existingEmployee && !options.overwrite) {
          results.skipped.push({
            employeeData,
            reason: 'Employee already exists'
          });
          continue;
        }

        const employee = new Employee(employeeData);
        this.employees.set(employee.id, employee);
        results.imported.push(employee.toSafeObject());
      } catch (error) {
        results.failed.push({
          employeeData,
          error: error.message
        });
      }
    }

    return results;
  }
}

// Export singleton instance
module.exports = new EmployeeService();