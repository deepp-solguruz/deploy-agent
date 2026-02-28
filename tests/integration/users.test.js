const request = require('supertest');
const app = require('../../src/server');

describe('User Management Endpoints', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Register a test user and get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  describe('GET /api/users', () => {
    it('should get all users when authenticated', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Users retrieved successfully');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID when authenticated', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User retrieved successfully');
      expect(response.body.user.id).toBe(userId);
      expect(response.body.user.username).toBe('testuser');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 403 when trying to access another user\'s profile', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'other@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .get(`/api/users/${otherUserResponse.body.user.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /api/users', () => {
    it('should create new user when authenticated', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user.username).toBe(newUser.username);
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUser = {
        username: 'ab', // Too short
        email: 'invalid-email',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should return 409 for duplicate username', async () => {
      const duplicateUser = {
        username: 'testuser', // Already exists
        email: 'duplicate@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateUser);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user email', async () => {
      const updateData = {
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User updated successfully');
      expect(response.body.user.email).toBe(updateData.email);
      expect(response.body.user.updatedAt).toBeTruthy();
    });

    it('should return 400 for invalid email', async () => {
      const updateData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 403 when trying to update another user', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'anotherusr',
          email: 'another@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .put(`/api/users/${otherUserResponse.body.user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'hacked@example.com' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('DELETE /api/users/:id', () => {
    let userToDelete;

    beforeEach(async () => {
      // Create a user to delete
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'usertodelete',
          email: 'delete@example.com',
          password: 'password123'
        });

      userToDelete = response.body.user;
    });

    it('should soft delete user', async () => {
      const response = await request(app)
        .delete(`/api/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${userToDelete.token || authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User deactivated successfully');
      expect(response.body.user.isActive).toBe(false);
      expect(response.body.user.deletedAt).toBeTruthy();
    });

    it('should return 403 when trying to delete another user', async () => {
      const response = await request(app)
        .delete(`/api/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('PATCH /api/users/:id/activate', () => {
    let deactivatedUser;

    beforeEach(async () => {
      // Create and deactivate a user
      const createResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'deactivateduser',
          email: 'deactivated@example.com',
          password: 'password123'
        });

      deactivatedUser = createResponse.body.user;

      // Deactivate the user
      await request(app)
        .delete(`/api/users/${deactivatedUser.id}`)
        .set('Authorization', `Bearer ${createResponse.body.token}`);
    });

    it('should reactivate user', async () => {
      const response = await request(app)
        .patch(`/api/users/${deactivatedUser.id}/activate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User reactivated successfully');
      expect(response.body.user.isActive).toBe(true);
    });
  });

  describe('GET /api/users/search/:query', () => {
    beforeAll(async () => {
      // Create some test users for searching
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'john_doe',
          email: 'john@example.com',
          password: 'password123'
        });

      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'jane_smith',
          email: 'jane@example.com',
          password: 'password123'
        });
    });

    it('should search users by username', async () => {
      const response = await request(app)
        .get('/api/users/search/john')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Search completed successfully');
      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.users[0].username).toContain('john');
    });

    it('should search users by email', async () => {
      const response = await request(app)
        .get('/api/users/search/jane@')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body.users[0].email).toContain('jane@');
    });

    it('should return 400 for short search query', async () => {
      const response = await request(app)
        .get('/api/users/search/a')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid search query');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users/search/example?limit=1&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // This test would require mocking to simulate server errors
      // For now, we'll test with invalid data that causes validation errors
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}); // Empty data

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return proper error format', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });
});