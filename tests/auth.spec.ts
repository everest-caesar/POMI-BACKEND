import request from 'supertest';
import app from '../src/app';

describe('Authentication System', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.username).toBe('newuser');
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'invalid-email',
        username: 'testuser',
        password: 'SecurePass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'weak',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should reject registration with invalid username', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'test@example.com',
        username: 'ab', // too short
        password: 'SecurePass123!',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    // First register a user
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send({
        email: 'testuser@example.com',
        username: 'testuser',
        password: 'TestPass123!',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'testuser@example.com',
        password: 'TestPass123!',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe('testuser@example.com');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'TestPass123!',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'testuser@example.com',
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should require email and password', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'testuser@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'refreshtest@example.com',
          username: 'refreshuser',
          password: 'RefreshPass123!',
        });

      refreshToken = registerResponse.body.tokens.refreshToken;
    });

    it('should refresh access token', async () => {
      const response = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: 'invalid-token',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should require refresh token', async () => {
      const response = await request(app).post('/api/v1/auth/refresh').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'metest@example.com',
        username: 'meuser',
        password: 'MePass123!',
      });

      accessToken = response.body.tokens.accessToken;
    });

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('username');
      expect(response.body.email).toBe('metest@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        email: 'logouttest@example.com',
        username: 'logoutuser',
        password: 'LogoutPass123!',
      });

      accessToken = response.body.tokens.accessToken;
      refreshToken = response.body.tokens.refreshToken;
    });

    it('should logout user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject logout without authentication', async () => {
      const response = await request(app).post('/api/v1/auth/logout').send({
        refreshToken,
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('API Status', () => {
    it('should return API status', async () => {
      const response = await request(app).get('/api/v1/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });
});
