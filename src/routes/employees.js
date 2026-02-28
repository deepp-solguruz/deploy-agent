const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  validateEmployeeCreate,
  validateEmployeeUpdate,
  validateEmployeeSearch,
  validatePagination,
  validateEmployeeId,
  validateTermination
} = require('../validators/employees');
const employeeService = require('../services/EmployeeService');

const router = express.Router();

// Get all employees with filtering and pagination
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const {
      limit = 10,
      offset = 0,
      department,
      status,
      position,
      managerId,
      includeTerminated = false
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      department,
      status,
      position,
      managerId,
      includeTerminated: includeTerminated === 'true'
    };

    const result = employeeService.getAllEmployees(options);

    res.json({
      message: 'Employees retrieved successfully',
      data: result.employees.map(emp => emp.toSafeObject()),
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore
      }
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      error: 'Failed to retrieve employees',
      message: error.message
    });
  }
});

// Get employee by ID
router.get('/:id', authenticateToken, validateEmployeeId, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = employeeService.getEmployeeById(id);

    res.json({
      message: 'Employee retrieved successfully',
      data: employee.toSafeObject()
    });

  } catch (error) {
    console.error('Get employee error:', error);
    if (error.message === 'Employee not found') {
      return res.status(404).json({
        error: 'Employee not found',
        message: 'Employee with specified ID does not exist'
      });
    }
    res.status(500).json({
      error: 'Failed to retrieve employee',
      message: error.message
    });
  }
});

// Create new employee
router.post('/', authenticateToken, validateEmployeeCreate, async (req, res) => {
  try {
    const employee = await employeeService.createEmployee(req.body);

    res.status(201).json({
      message: 'Employee created successfully',
      data: employee.toSafeObject()
    });

  } catch (error) {
    console.error('Create employee error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'Employee already exists',
        message: error.message
      });
    }
    if (error.message.includes('Validation failed')) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message
      });
    }
    res.status(500).json({
      error: 'Failed to create employee',
      message: error.message
    });
  }
});

// Update employee
router.put('/:id', authenticateToken, validateEmployeeId, validateEmployeeUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await employeeService.updateEmployee(id, req.body);

    res.json({
      message: 'Employee updated successfully',
      data: employee.toSafeObject()
    });

  } catch (error) {
    console.error('Update employee error:', error);
    if (error.message === 'Employee not found') {
      return res.status(404).json({
        error: 'Employee not found',
        message: 'Employee with specified ID does not exist'
      });
    }
    if (error.message.includes('already exists') || error.message.includes('already taken')) {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message
      });
    }
    if (error.message.includes('Validation failed')) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message
      });
    }
    res.status(500).json({
      error: 'Failed to update employee',
      message: error.message
    });
  }
});

// Delete employee (hard delete)
router.delete('/:id', authenticateToken, validateEmployeeId, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = employeeService.deleteEmployee(id);

    res.json({
      message: 'Employee deleted successfully',
      data: employee.toSafeObject()
    });

  } catch (error) {
    console.error('Delete employee error:', error);
    if (error.message === 'Employee not found') {
      return res.status(404).json({
        error: 'Employee not found',
        message: 'Employee with specified ID does not exist'
      });
    }
    res.status(500).json({
      error: 'Failed to delete employee',
      message: error.message
    });
  }
});

// Terminate employee
router.patch('/:id/terminate', authenticateToken, validateEmployeeId, validateTermination, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;
    const employee = employeeService.terminateEmployee(id, reason);

    res.json({
      message: 'Employee terminated successfully',
      data: employee.toSafeObject()
    });

  } catch (error) {
    console.error('Terminate employee error:', error);
    if (error.message === 'Employee not found') {
      return res.status(404).json({
        error: 'Employee not found',
        message: 'Employee with specified ID does not exist'
      });
    }
    res.status(500).json({
      error: 'Failed to terminate employee',
      message: error.message
    });
  }
});

// Reactivate employee
router.patch('/:id/reactivate', authenticateToken, validateEmployeeId, async (req, res) => {
  try {
    const { id } = req.params;
    const employee = employeeService.reactivateEmployee(id);

    res.json({
      message: 'Employee reactivated successfully',
      data: employee.toSafeObject()
    });

  } catch (error) {
    console.error('Reactivate employee error:', error);
    if (error.message === 'Employee not found') {
      return res.status(404).json({
        error: 'Employee not found',
        message: 'Employee with specified ID does not exist'
      });
    }
    res.status(500).json({
      error: 'Failed to reactivate employee',
      message: error.message
    });
  }
});

// Search employees
router.get('/search/:query', authenticateToken, validateEmployeeSearch, async (req, res) => {
  try {
    const { query } = req.params;
    const {
      limit = 10,
      offset = 0,
      includeTerminated = false
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeTerminated: includeTerminated === 'true'
    };

    const result = employeeService.searchEmployees(query, options);

    res.json({
      message: 'Search completed successfully',
      data: result.employees.map(emp => emp.toSafeObject()),
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore
      },
      query: result.query
    });

  } catch (error) {
    console.error('Search employees error:', error);
    if (error.message.includes('Search query must be')) {
      return res.status(400).json({
        error: 'Invalid search query',
        message: error.message
      });
    }
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// Get employees by department
router.get('/department/:department', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { department } = req.params;
    const {
      limit = 10,
      offset = 0,
      includeTerminated = false
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeTerminated: includeTerminated === 'true'
    };

    const result = employeeService.getEmployeesByDepartment(department, options);

    res.json({
      message: 'Employees retrieved successfully',
      data: result.employees.map(emp => emp.toSafeObject()),
      department: result.department,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore
      }
    });

  } catch (error) {
    console.error('Get employees by department error:', error);
    res.status(500).json({
      error: 'Failed to retrieve employees',
      message: error.message
    });
  }
});

// Get employees by manager
router.get('/manager/:managerId', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { managerId } = req.params;
    const {
      limit = 10,
      offset = 0,
      includeTerminated = false
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeTerminated: includeTerminated === 'true'
    };

    const result = employeeService.getEmployeesByManager(managerId, options);

    res.json({
      message: 'Employees retrieved successfully',
      data: result.employees.map(emp => emp.toSafeObject()),
      managerId: result.managerId,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore
      }
    });

  } catch (error) {
    console.error('Get employees by manager error:', error);
    res.status(500).json({
      error: 'Failed to retrieve employees',
      message: error.message
    });
  }
});

// Get employee statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = employeeService.getEmployeeStats();

    res.json({
      message: 'Employee statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Get employee stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve employee statistics',
      message: error.message
    });
  }
});

// Get departments list
router.get('/meta/departments', authenticateToken, async (req, res) => {
  try {
    const departments = employeeService.getDepartments();

    res.json({
      message: 'Departments retrieved successfully',
      data: departments
    });

  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      error: 'Failed to retrieve departments',
      message: error.message
    });
  }
});

// Get positions list
router.get('/meta/positions', authenticateToken, async (req, res) => {
  try {
    const positions = employeeService.getPositions();

    res.json({
      message: 'Positions retrieved successfully',
      data: positions
    });

  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({
      error: 'Failed to retrieve positions',
      message: error.message
    });
  }
});

// Get skills list
router.get('/meta/skills', authenticateToken, async (req, res) => {
  try {
    const skills = employeeService.getSkills();

    res.json({
      message: 'Skills retrieved successfully',
      data: skills
    });

  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      error: 'Failed to retrieve skills',
      message: error.message
    });
  }
});

// Bulk create employees
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { employees } = req.body;

    if (!Array.isArray(employees)) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'Employees must be an array'
      });
    }

    const result = await employeeService.bulkCreateEmployees(employees);

    res.status(201).json({
      message: 'Bulk employee creation completed',
      data: result
    });

  } catch (error) {
    console.error('Bulk create employees error:', error);
    res.status(500).json({
      error: 'Failed to create employees',
      message: error.message
    });
  }
});

// Export employees
router.get('/export/all', authenticateToken, async (req, res) => {
  try {
    const employees = employeeService.exportEmployees();

    res.json({
      message: 'Employees exported successfully',
      data: employees,
      count: employees.length,
      exportedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Export employees error:', error);
    res.status(500).json({
      error: 'Failed to export employees',
      message: error.message
    });
  }
});

// Import employees
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { employees, overwrite = false } = req.body;

    if (!Array.isArray(employees)) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'Employees must be an array'
      });
    }

    const result = await employeeService.importEmployees(employees, { overwrite });

    res.json({
      message: 'Employee import completed',
      data: result
    });

  } catch (error) {
    console.error('Import employees error:', error);
    res.status(500).json({
      error: 'Failed to import employees',
      message: error.message
    });
  }
});

module.exports = router;