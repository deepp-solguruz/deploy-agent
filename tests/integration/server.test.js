const request = require('supertest');
const app = require('../../src/server');

describe('Express Server Integration Tests', () => {
  describe('Server Configuration', () => {
    it('should be defined', () => {
      expect(app).toBeDefined();
    });

    it('should handle JSON requests', async () => {
      const response = await request(app)
        .post('/api/health')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');
      
      // Should return 404 for POST to health endpoint, but should parse JSON
      expect(response.status).toBe(404);
    });

    it('should handle URL encoded requests', async () => {
      const response = await request(app)
        .post('/api/health')
        .send('test=data')
        .set('Content-Type', 'application/x-www-form-urlencoded');
      
      expect(response.status).toBe(404);
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Deploy Agent API',
        version: '1.0.0',
        status: 'running'
      });
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Health Check Integration', () => {
    it('should access health check endpoint', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'deploy-agent');
    });

    it('should access detailed health check', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('system');
    });

    it('should access readiness probe', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ready');
    });

    it('should access liveness probe', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('path', '/unknown-route');
    });

    it('should return 404 for unknown API routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('path', '/api/unknown');
    });

    it('should handle POST to non-existent endpoints', async () => {
      const response = await request(app)
        .post('/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
    });

    it('should handle PUT requests', async () => {
      const response = await request(app)
        .put('/api/health')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
    });

    it('should handle DELETE requests', async () => {
      const response = await request(app)
        .delete('/api/health')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Helmet adds various security headers
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-download-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://localhost:3001')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Content Type Handling', () => {
    it('should return JSON for API endpoints', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle requests with different Accept headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Request Methods', () => {
    it('should handle GET requests to root', async () => {
      await request(app)
        .get('/')
        .expect(200);
    });

    it('should reject POST to root', async () => {
      await request(app)
        .post('/')
        .expect(404);
    });

    it('should reject PUT to root', async () => {
      await request(app)
        .put('/')
        .expect(404);
    });

    it('should reject DELETE to root', async () => {
      await request(app)
        .delete('/')
        .expect(404);
    });
  });

  describe('Response Time', () => {
    it('should respond to health check quickly', async () => {
      const start = Date.now();
      await request(app)
        .get('/api/health')
        .expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should respond to root endpoint quickly', async () => {
      const start = Date.now();
      await request(app)
        .get('/')
        .expect(200);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(500); // Should respond within 500ms
    });
  });
});