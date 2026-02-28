const UserService = require('../../../src/services/UserService');
const User = require('../../../src/models/User');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    // Create a fresh instance for each test
    userService = new (require('../../../src/services/UserService').constructor)();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = await userService.createUser(userData);

      expect(user).toBeInstanceOf(User);
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.isActive).toBe(true);
    });

    it('should throw error for duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      await userService.createUser(userData);

      const duplicateData = {
        username: 'testuser',
        email: 'different@example.com',
        password: 'password123'
      };

      await expect(userService.createUser(duplicateData))
        .rejects.toThrow('User with this username or email already exists');
    });

    it('should throw error for invalid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      await expect(userService.createUser(userData))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const createdUser = await userService.createUser(userData);
      const foundUser = userService.getUserById(createdUser.id);

      expect(foundUser).toBe(createdUser);
    });

    it('should throw error for non-existent user', () => {
      expect(() => userService.getUserById('nonexistent'))
        .toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = await userService.createUser(userData);
      const updatedUser = await userService.updateUser(user.id, {
        email: 'newemail@example.com'
      });

      expect(updatedUser.email).toBe('newemail@example.com');
      expect(updatedUser.updatedAt).toBeTruthy();
    });

    it('should throw error for duplicate email', async () => {
      const user1Data = {
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123'
      };

      const user2Data = {
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123'
      };

      const user1 = await userService.createUser(user1Data);
      const user2 = await userService.createUser(user2Data);

      await expect(userService.updateUser(user2.id, {
        email: 'user1@example.com'
      })).rejects.toThrow('Email is already registered to another user');
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = await userService.createUser(userData);
      const deletedUser = userService.deleteUser(user.id);

      expect(deletedUser.isActive).toBe(false);
      expect(deletedUser.deletedAt).toBeTruthy();
    });
  });

  describe('searchUsers', () => {
    beforeEach(async () => {
      await userService.createUser({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123'
      });

      await userService.createUser({
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'password123'
      });
    });

    it('should search users by username', () => {
      const result = userService.searchUsers('john');
      
      expect(result.users).toHaveLength(1);
      expect(result.users[0].username).toBe('john_doe');
      expect(result.total).toBe(1);
    });

    it('should search users by email', () => {
      const result = userService.searchUsers('jane@');
      
      expect(result.users).toHaveLength(1);
      expect(result.users[0].email).toBe('jane@example.com');
    });

    it('should throw error for short query', () => {
      expect(() => userService.searchUsers('a'))
        .toThrow('Search query must be at least 2 characters long');
    });
  });

  describe('authenticateUser', () => {
    let user;

    beforeEach(async () => {
      user = await userService.createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should authenticate with valid credentials', async () => {
      const authenticatedUser = await userService.authenticateUser('testuser', 'password123');
      
      expect(authenticatedUser.id).toBe(user.id);
      expect(authenticatedUser.lastLoginAt).toBeTruthy();
    });

    it('should throw error for invalid password', async () => {
      await expect(userService.authenticateUser('testuser', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      userService.deleteUser(user.id); // Deactivate user

      await expect(userService.authenticateUser('testuser', 'password123'))
        .rejects.toThrow('Account is deactivated');
    });
  });

  describe('changePassword', () => {
    let user;

    beforeEach(async () => {
      user = await userService.createUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should change password successfully', async () => {
      await userService.changePassword(user.id, 'password123', 'newpassword123');
      
      // Should be able to authenticate with new password
      const authenticatedUser = await userService.authenticateUser('testuser', 'newpassword123');
      expect(authenticatedUser.id).toBe(user.id);
    });

    it('should throw error for incorrect current password', async () => {
      await expect(userService.changePassword(user.id, 'wrongpassword', 'newpassword123'))
        .rejects.toThrow('Current password is incorrect');
    });

    it('should throw error for invalid new password', async () => {
      await expect(userService.changePassword(user.id, 'password123', '123'))
        .rejects.toThrow('Password validation failed');
    });
  });

  describe('getUserStats', () => {
    beforeEach(async () => {
      await userService.createUser({
        username: 'user1',
        email: 'user1@example.com',
        password: 'password123'
      });

      const user2 = await userService.createUser({
        username: 'user2',
        email: 'user2@example.com',
        password: 'password123'
      });

      await userService.createUser({
        username: 'admin1',
        email: 'admin1@example.com',
        password: 'password123',
        role: 'admin'
      });

      userService.deleteUser(user2.id); // Deactivate one user
    });

    it('should return correct user statistics', () => {
      const stats = userService.getUserStats();

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
      expect(stats.admins).toBe(1);
      expect(stats.users).toBe(2);
    });
  });
});