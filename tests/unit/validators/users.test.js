const {
  validateUserCreate,
  validateUserUpdate,
  validateUserId,
  validateSearchQuery
} = require('../../../src/validators/users');

describe('User Validators', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('validateUserCreate', () => {
    it('should pass validation with valid user data', () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      validateUserCreate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation when username is missing', () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Username is required']
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail validation when username is too short', () => {
      req.body = {
        username: 'ab',
        email: 'test@example.com',
        password: 'password123'
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Username must be at least 3 characters long']
      });
    });

    it('should fail validation when username contains invalid characters', () => {
      req.body = {
        username: 'test@user',
        email: 'test@example.com',
        password: 'password123'
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Username can only contain letters, numbers, underscores, and hyphens']
      });
    });

    it('should fail validation when email is invalid', () => {
      req.body = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Email must be a valid email address']
      });
    });

    it('should fail validation when password is too short', () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123'
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Password must be at least 6 characters long']
      });
    });

    it('should fail validation with multiple errors', () => {
      req.body = {
        username: 'ab',
        email: 'invalid-email',
        password: '123'
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: [
          'Username must be at least 3 characters long',
          'Email must be a valid email address',
          'Password must be at least 6 characters long'
        ]
      });
    });

    it('should validate isActive field when provided', () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        isActive: 'not-boolean'
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['isActive must be a boolean']
      });
    });

    it('should pass validation with valid isActive field', () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        isActive: true
      };

      validateUserCreate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('validateUserUpdate', () => {
    it('should pass validation with valid email update', () => {
      req.body = {
        email: 'updated@example.com'
      };

      validateUserUpdate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should pass validation with valid isActive update', () => {
      req.body = {
        isActive: false
      };

      validateUserUpdate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation when no fields are provided', () => {
      req.body = {};

      validateUserUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['At least one field (email or isActive) must be provided']
      });
    });

    it('should fail validation with invalid email', () => {
      req.body = {
        email: 'invalid-email'
      };

      validateUserUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Email must be a valid email address']
      });
    });

    it('should fail validation with invalid isActive type', () => {
      req.body = {
        isActive: 'not-boolean'
      };

      validateUserUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['isActive must be a boolean']
      });
    });
  });

  describe('validateUserId', () => {
    it('should pass validation with valid user ID', () => {
      req.params = {
        id: 'valid-user-id'
      };

      validateUserId(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation when ID is missing', () => {
      req.params = {};

      validateUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'User ID is required'
      });
    });

    it('should fail validation when ID is empty string', () => {
      req.params = {
        id: '   '
      };

      validateUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'User ID must be a valid string'
      });
    });
  });

  describe('validateSearchQuery', () => {
    it('should pass validation with valid search query', () => {
      req.params = {
        query: 'test'
      };

      validateSearchQuery(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should pass validation with valid pagination parameters', () => {
      req.params = {
        query: 'test'
      };
      req.query = {
        limit: '10',
        offset: '0'
      };

      validateSearchQuery(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail validation when query is too short', () => {
      req.params = {
        query: 'a'
      };

      validateSearchQuery(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid search parameters',
        details: ['Search query must be at least 2 characters long']
      });
    });

    it('should fail validation when query is missing', () => {
      req.params = {};

      validateSearchQuery(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid search parameters',
        details: ['Search query is required']
      });
    });

    it('should fail validation with invalid limit', () => {
      req.params = {
        query: 'test'
      };
      req.query = {
        limit: '0'
      };

      validateSearchQuery(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid search parameters',
        details: ['Limit must be a number between 1 and 100']
      });
    });

    it('should fail validation with invalid offset', () => {
      req.params = {
        query: 'test'
      };
      req.query = {
        offset: '-1'
      };

      validateSearchQuery(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid search parameters',
        details: ['Offset must be a non-negative number']
      });
    });

    it('should fail validation with multiple invalid parameters', () => {
      req.params = {
        query: 'a'
      };
      req.query = {
        limit: '0',
        offset: '-1'
      };

      validateSearchQuery(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid search parameters',
        details: [
          'Search query must be at least 2 characters long',
          'Limit must be a number between 1 and 100',
          'Offset must be a non-negative number'
        ]
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-string username type', () => {
      req.body = {
        username: 123,
        email: 'test@example.com',
        password: 'password123'
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Username must be a string']
      });
    });

    it('should handle non-string email type', () => {
      req.body = {
        username: 'testuser',
        email: 123,
        password: 'password123'
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Email must be a string']
      });
    });

    it('should handle non-string password type', () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 123
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Password must be a string']
      });
    });

    it('should handle very long username', () => {
      req.body = {
        username: 'a'.repeat(31),
        email: 'test@example.com',
        password: 'password123'
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Username must be less than 30 characters']
      });
    });

    it('should handle very long email', () => {
      req.body = {
        username: 'testuser',
        email: 'a'.repeat(250) + '@example.com',
        password: 'password123'
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Email must be less than 254 characters']
      });
    });

    it('should handle very long password', () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'a'.repeat(129)
      };

      validateUserCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        message: 'Invalid input data',
        details: ['Password must be less than 128 characters']
      });
    });
  });
});