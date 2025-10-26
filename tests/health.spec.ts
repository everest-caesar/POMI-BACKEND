import request from 'supertest';
import app from '../src/app';

describe('Health Check Endpoint', () => {
  describe('GET /health', () => {
    it('should return 200 status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
    });

    it('should return ok status', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });

    it('should return timestamp', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should respond quickly', async () => {
      const startTime = Date.now();
      await request(app).get('/health');
      const endTime = Date.now();

      // Should respond within 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
