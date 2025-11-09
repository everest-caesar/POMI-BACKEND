import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import User from '../models/User';
import Event from '../models/Event';
import Business from '../models/Business';

describe('Admin API', () => {
  const adminInviteCode = 'admin-test-code';
  const defaultProfile = {
    age: 30,
    area: 'Downtown Ottawa',
    workOrSchool: 'Carleton University',
  };

  let adminToken: string;
  let userToken: string;
  let createdEventId: string;
  let createdBusinessId: string;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI ||
      'mongodb://pomi_user:pomi_password@localhost:27017/pomi?authSource=admin';
    await mongoose.connect(mongoUri);

    process.env.ADMIN_INVITE_CODE = adminInviteCode;

    await User.deleteMany({});
    await Event.deleteMany({});
    await Business.deleteMany({});

    const adminResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'portaladmin',
        email: 'portaladmin@example.com',
        password: 'AdminPassword123',
        ...defaultProfile,
        adminInviteCode,
      });

    adminToken = adminResponse.body.token;

    const userResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'portaluser',
        email: 'portaluser@example.com',
        password: 'UserPassword123',
        ...defaultProfile,
        area: 'Kanata',
        workOrSchool: 'Ottawa Hospital',
      });

    userToken = userResponse.body.token;

    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const eventResponse = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Community Networking Night',
        description:
          'An opportunity for local professionals to connect and share opportunities.',
        location: 'Ottawa Community Centre',
        date: futureDate,
        startTime: '18:00',
        endTime: '20:00',
        category: 'business',
        maxAttendees: 100,
        tags: ['networking', 'business'],
      });

    createdEventId = eventResponse.body.event._id;

    await request(app)
      .post(`/api/v1/events/${createdEventId}/rsvp`)
      .set('Authorization', `Bearer ${userToken}`);

    const businessResponse = await request(app)
      .post('/api/v1/businesses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        businessName: 'Habesha Coffee House',
        description:
          'Serving authentic Ethiopian coffee and pastries in the heart of Ottawa.',
        category: 'restaurant',
        phone: '613-555-0101',
        email: 'hello@habeshacoffee.ca',
        address: '123 Bank Street, Ottawa',
      });

    createdBusinessId = businessResponse.body.business._id;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Business.deleteMany({});
    await mongoose.disconnect();
  });

  test('should reject admin endpoints for non-admin users', async () => {
    const response = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('error');
  });

  test('should return overview metrics for admin', async () => {
    const response = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.metrics.totalUsers).toBe(2);
    expect(response.body.metrics.totalEvents).toBe(1);
    expect(response.body.metrics.totalBusinesses).toBe(1);
    expect(response.body.metrics.totalRegistrations).toBe(2);
    expect(response.body.metrics.pendingBusinesses).toBe(1);
  });

  test('should list events with attendee details', async () => {
    const response = await request(app)
      .get('/api/v1/admin/events')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.events)).toBe(true);
    expect(response.body.events.length).toBeGreaterThanOrEqual(1);

    const event = response.body.events.find(
      (item: any) => item.id === createdEventId,
    );

    expect(event).toBeDefined();
    expect(event.attendeeCount).toBe(2);
    expect(event.attendees.length).toBe(2);
    expect(event.attendees[0]).toHaveProperty('username');
  });

  test('should list businesses and allow status updates', async () => {
    const listResponse = await request(app)
      .get('/api/v1/admin/businesses')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.businesses)).toBe(true);
    const business = listResponse.body.businesses.find(
      (item: any) => item.id === createdBusinessId,
    );
    expect(business).toBeDefined();
    expect(business.status).toBe('draft');
    expect(business.verified).toBe(false);

    const updateResponse = await request(app)
      .patch(`/api/v1/admin/businesses/${createdBusinessId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'active',
        verified: true,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.business.status).toBe('active');
    expect(updateResponse.body.business.verified).toBe(true);
  });
});
