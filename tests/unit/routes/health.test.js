const request = require('supertest');
const express = require('express');
const healthRoutes = require('../../../src/routes/health');

describe('Health Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/health', healthRoutes);
  });

  describe('GET /api/health', () => {
    it('should return health status with 200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('message', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'deploy-agent');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('cpu');
    });

    it('should return valid timestamp format', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should return memory usage as numbers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(typeof response.body.memory.used).toBe('number');
      expect(typeof response.body.memory.total).toBe('number');
      expect(typeof response.body.memory.external).toBe('number');
      expect(response.body.memory.used).toBeGreaterThan(0);
      expect(response.body.memory.total).toBeGreaterThan(0);
    });

    it('should return CPU usage as numbers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(typeof response.body.cpu.user).toBe('number');
      expect(typeof response.body.cpu.system).toBe('number');
      expect(response.body.cpu.user).toBeGreaterThanOrEqual(0);
      expect(response.body.cpu.system).toBeGreaterThanOrEqual(0);
    });

    it('should return uptime as positive number', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health information with 200', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('cpu');
    });

    it('should return service information', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body.service).toHaveProperty('name', 'deploy-agent');
      expect(response.body.service).toHaveProperty('version', '1.0.0');
      expect(response.body.service).toHaveProperty('uptime');
      expect(response.body.service).toHaveProperty('environment');
      expect(typeof response.body.service.uptime).toBe('number');
    });

    it('should return system information', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body.system).toHaveProperty('platform');
      expect(response.body.system).toHaveProperty('arch');
      expect(response.body.system).toHaveProperty('nodeVersion');
      expect(response.body.system).toHaveProperty('pid');
      expect(typeof response.body.system.pid).toBe('number');
    });

    it('should return detailed memory information', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      const memoryProps = ['rss', 'heapTotal', 'heapUsed', 'external', 'arrayBuffers'];
      memoryProps.forEach(prop => {
        expect(response.body.memory).toHaveProperty(prop);
        expect(typeof response.body.memory[prop]).toBe('number');
        expect(response.body.memory[prop]).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle loadAverage based on platform', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      if (process.platform === 'win32') {
        expect(response.body.loadAverage).toBeNull();
      } else {
        expect(Array.isArray(response.body.loadAverage)).toBe(true);
        expect(response.body.loadAverage).toHaveLength(3);
      }
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return ready status with 200', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('message', 'Service is ready to accept requests');
    });

    it('should return valid timestamp', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('GET /api/health/live', () => {
    it('should return alive status with 200', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('message', 'Service is alive');
    });

    it('should return valid timestamp', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid routes gracefully', async () => {
      await request(app)
        .get('/api/health/invalid')
        .expect(404);
    });

    it('should handle POST requests to health endpoints', async () => {
      await request(app)
        .post('/api/health')
        .expect(404);
    });
  });
});