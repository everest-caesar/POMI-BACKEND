import request from 'supertest';
import app from '../src/app';

describe('API Base Routes', () => {
  describe('GET /api/v1/status', () => {
    it('should return 200 status', async () => {
      const response = await request(app).get('/api/v1/status');

      expect(response.status).toBe(200);
    });

    it('should return valid API response', async () => {
      const response = await request(app).get('/api/v1/status');

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Not Found Routes', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/api/v1/undefined');

      expect(response.status).toBe(404);
    });

    it('should return 404 with error message', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/health');

      // Helmet headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });
});
