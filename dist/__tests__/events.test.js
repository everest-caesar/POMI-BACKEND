import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import User from '../models/User';
import Event from '../models/Event';
describe('Events API', () => {
    let authToken;
    let userId;
    let eventId;
    let secondUserId;
    let secondAuthToken;
    // Setup: Connect to test database and create test user
    beforeAll(async () => {
        // Connect to MongoDB with proper authentication source
        const mongoUri = process.env.MONGODB_URI || 'mongodb://pomi_user:pomi_password@localhost:27017/pomi?authSource=admin';
        await mongoose.connect(mongoUri);
    });
    // Cleanup: Clear collections after each test
    afterEach(async () => {
        // Keep data for integration, but can clear specific docs
    });
    // Cleanup: Disconnect after all tests
    afterAll(async () => {
        await User.deleteMany({});
        await Event.deleteMany({});
        await mongoose.disconnect();
    });
    describe('Authentication Setup', () => {
        test('should register a new user for testing', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                username: 'eventuser1',
                email: 'eventuser1@example.com',
                password: 'Password123',
                age: 28,
                area: 'Downtown Ottawa',
                workOrSchool: 'Carleton University',
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            authToken = response.body.token;
            userId = response.body.user._id;
        });
        test('should register second user for RSVP testing', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                username: 'eventuser2',
                email: 'eventuser2@example.com',
                password: 'Password123',
                age: 31,
                area: 'Kanata',
                workOrSchool: 'Ottawa Hospital',
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            secondAuthToken = response.body.token;
            secondUserId = response.body.user._id;
        });
    });
    describe('POST /api/v1/events - Create Event', () => {
        test('should create a new event', async () => {
            const eventData = {
                title: 'Habesha Cultural Festival',
                description: 'A celebration of Amharic, Tigrinya, and Oromo cultures with traditional music, food, and dancing.',
                location: 'San Francisco, CA',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                startTime: '18:00',
                endTime: '22:00',
                category: 'cultural',
                organizer: 'eventuser1',
                maxAttendees: 100,
                tags: ['habesha', 'cultural', 'festival'],
            };
            const response = await request(app)
                .post('/api/v1/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData);
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('event');
            expect(response.body.event.title).toBe(eventData.title);
            expect(response.body.event.organizerId).toBe(userId);
            expect(response.body.event.attendees).toContain(userId); // Organizer should be first attendee
            eventId = response.body.event._id;
        });
        test('should return 401 if not authenticated', async () => {
            const eventData = {
                title: 'Test Event',
                description: 'This is a test event description that is long enough.',
                location: 'Test Location',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                startTime: '18:00',
                endTime: '20:00',
                category: 'other',
            };
            const response = await request(app)
                .post('/api/v1/events')
                .send(eventData);
            expect(response.status).toBe(401);
        });
        test('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/v1/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: 'Incomplete Event',
                // Missing required fields
            });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
        test('should validate event date is in the future', async () => {
            const response = await request(app)
                .post('/api/v1/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: 'Past Event',
                description: 'This event is in the past and should be rejected.',
                location: 'Past Location',
                date: new Date(Date.now() - 1000).toISOString(), // Past date
                startTime: '18:00',
                endTime: '20:00',
                category: 'other',
                organizer: 'eventuser1',
            });
            expect(response.status).toBe(500); // Validation error from MongoDB
        });
        test('should validate title length (min 3, max 100 chars)', async () => {
            const response = await request(app)
                .post('/api/v1/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: 'AB', // Too short
                description: 'This is a valid description that meets the minimum length requirement.',
                location: 'Test Location',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                startTime: '18:00',
                endTime: '20:00',
                category: 'other',
                organizer: 'eventuser1',
            });
            expect(response.status).toBe(500); // Validation error
        });
        test('should validate description length (min 10, max 2000 chars)', async () => {
            const response = await request(app)
                .post('/api/v1/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: 'Valid Title',
                description: 'Short', // Too short
                location: 'Test Location',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                startTime: '18:00',
                endTime: '20:00',
                category: 'other',
                organizer: 'eventuser1',
            });
            expect(response.status).toBe(500); // Validation error
        });
        test('should validate time format (HH:MM)', async () => {
            const response = await request(app)
                .post('/api/v1/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: 'Time Format Test',
                description: 'Testing time format validation for event creation.',
                location: 'Test Location',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                startTime: '18:0', // Invalid format
                endTime: '20:00',
                category: 'other',
                organizer: 'eventuser1',
            });
            expect(response.status).toBe(500); // Validation error
        });
    });
    describe('GET /api/v1/events - List Events', () => {
        test('should retrieve all future events', async () => {
            const response = await request(app)
                .get('/api/v1/events');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('events');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.events)).toBe(true);
        });
        test('should filter events by category', async () => {
            const response = await request(app)
                .get('/api/v1/events?category=cultural');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.events)).toBe(true);
            // All returned events should have cultural category
            response.body.events.forEach((event) => {
                expect(event.category).toBe('cultural');
            });
        });
        test('should search events by title', async () => {
            const response = await request(app)
                .get('/api/v1/events?search=Habesha');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.events)).toBe(true);
        });
        test('should search events by location', async () => {
            const response = await request(app)
                .get('/api/v1/events?search=Francisco');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.events)).toBe(true);
        });
        test('should support pagination', async () => {
            const response = await request(app)
                .get('/api/v1/events?limit=5&skip=0');
            expect(response.status).toBe(200);
            expect(response.body.pagination).toHaveProperty('total');
            expect(response.body.pagination).toHaveProperty('limit');
            expect(response.body.pagination).toHaveProperty('skip');
            expect(response.body.pagination).toHaveProperty('hasMore');
            expect(response.body.pagination.limit).toBe(5);
        });
        test('should return events sorted by date (ascending)', async () => {
            const response = await request(app)
                .get('/api/v1/events');
            expect(response.status).toBe(200);
            if (response.body.events.length > 1) {
                for (let i = 0; i < response.body.events.length - 1; i++) {
                    const currentDate = new Date(response.body.events[i].date).getTime();
                    const nextDate = new Date(response.body.events[i + 1].date).getTime();
                    expect(currentDate).toBeLessThanOrEqual(nextDate);
                }
            }
        });
    });
    describe('GET /api/v1/events/:id - Get Single Event', () => {
        test('should retrieve a single event by ID', async () => {
            const response = await request(app)
                .get(`/api/v1/events/${eventId}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('event');
            expect(response.body.event._id).toBe(eventId);
            expect(response.body.event.title).toBe('Habesha Cultural Festival');
        });
        test('should populate organizer details', async () => {
            const response = await request(app)
                .get(`/api/v1/events/${eventId}`);
            expect(response.status).toBe(200);
            expect(response.body.event).toHaveProperty('organizerId');
            // organizerId should be populated with user details
            expect(response.body.event.organizerId).toHaveProperty('username');
        });
        test('should populate attendees details', async () => {
            const response = await request(app)
                .get(`/api/v1/events/${eventId}`);
            expect(response.status).toBe(200);
            expect(response.body.event).toHaveProperty('attendees');
            expect(Array.isArray(response.body.event.attendees)).toBe(true);
        });
        test('should return 404 for non-existent event', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/v1/events/${fakeId}`);
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
        test('should return 500 for invalid ID format', async () => {
            const response = await request(app)
                .get('/api/v1/events/invalid-id');
            expect(response.status).toBe(500);
        });
    });
    describe('PUT /api/v1/events/:id - Update Event', () => {
        test('should update event as organizer', async () => {
            const updateData = {
                title: 'Updated Habesha Cultural Festival',
                description: 'Updated description with more details about the event.',
                maxAttendees: 150,
            };
            const response = await request(app)
                .put(`/api/v1/events/${eventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.event.title).toBe(updateData.title);
            expect(response.body.event.maxAttendees).toBe(updateData.maxAttendees);
        });
        test('should return 403 if non-organizer tries to update', async () => {
            const updateData = {
                title: 'Hacked Title',
            };
            const response = await request(app)
                .put(`/api/v1/events/${eventId}`)
                .set('Authorization', `Bearer ${secondAuthToken}`)
                .send(updateData);
            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
        });
        test('should return 401 if not authenticated', async () => {
            const updateData = {
                title: 'Unauthorized Update',
            };
            const response = await request(app)
                .put(`/api/v1/events/${eventId}`)
                .send(updateData);
            expect(response.status).toBe(401);
        });
        test('should return 404 if event not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .put(`/api/v1/events/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Test' });
            expect(response.status).toBe(404);
        });
        test('should partially update event fields', async () => {
            const updateData = {
                location: 'New Location, CA',
                tags: ['habesha', 'cultural', 'updated'],
            };
            const response = await request(app)
                .put(`/api/v1/events/${eventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.event.location).toBe(updateData.location);
            expect(response.body.event.tags).toEqual(updateData.tags);
        });
    });
    describe('POST /api/v1/events/:id/rsvp - RSVP to Event', () => {
        test('should RSVP to event as second user', async () => {
            const response = await request(app)
                .post(`/api/v1/events/${eventId}/rsvp`)
                .set('Authorization', `Bearer ${secondAuthToken}`);
            expect(response.status).toBe(200);
            expect(response.body.event.attendees).toContain(secondUserId);
        });
        test('should return 400 if already attending', async () => {
            const response = await request(app)
                .post(`/api/v1/events/${eventId}/rsvp`)
                .set('Authorization', `Bearer ${secondAuthToken}`);
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Already attending this event');
        });
        test('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .post(`/api/v1/events/${eventId}/rsvp`);
            expect(response.status).toBe(401);
        });
        test('should return 404 if event not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .post(`/api/v1/events/${fakeId}/rsvp`)
                .set('Authorization', `Bearer ${secondAuthToken}`);
            expect(response.status).toBe(404);
        });
        test('should return 400 if event is full', async () => {
            // Update event to have maxAttendees = 1 (only organizer)
            await request(app)
                .put(`/api/v1/events/${eventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ maxAttendees: 1 });
            // Create a new user and try to RSVP
            const newUserRes = await request(app)
                .post('/api/v1/auth/register')
                .send({
                username: 'eventuser3',
                email: 'eventuser3@example.com',
                password: 'Password123',
                age: 24,
                area: 'Nepean',
                workOrSchool: 'Algonquin College',
            });
            const response = await request(app)
                .post(`/api/v1/events/${eventId}/rsvp`)
                .set('Authorization', `Bearer ${newUserRes.body.token}`);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Event is full');
            // Reset maxAttendees for other tests
            await request(app)
                .put(`/api/v1/events/${eventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ maxAttendees: 150 });
        });
    });
    describe('DELETE /api/v1/events/:id/rsvp - Cancel RSVP', () => {
        test('should cancel RSVP', async () => {
            const response = await request(app)
                .delete(`/api/v1/events/${eventId}/rsvp`)
                .set('Authorization', `Bearer ${secondAuthToken}`);
            expect(response.status).toBe(200);
            expect(response.body.event.attendees).not.toContain(secondUserId);
        });
        test('should return 400 if not attending', async () => {
            const response = await request(app)
                .delete(`/api/v1/events/${eventId}/rsvp`)
                .set('Authorization', `Bearer ${secondAuthToken}`);
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
        test('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .delete(`/api/v1/events/${eventId}/rsvp`);
            expect(response.status).toBe(401);
        });
        test('should return 404 if event not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/v1/events/${fakeId}/rsvp`)
                .set('Authorization', `Bearer ${secondAuthToken}`);
            expect(response.status).toBe(404);
        });
    });
    describe('GET /api/v1/events/user/my-events - User Events', () => {
        test('should retrieve user\'s organized events', async () => {
            const response = await request(app)
                .get('/api/v1/events/user/my-events')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('events');
            expect(Array.isArray(response.body.events)).toBe(true);
            // All returned events should be organized by the current user
            response.body.events.forEach((event) => {
                expect(event.organizerId.toString()).toBe(userId);
            });
        });
        test('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .get('/api/v1/events/user/my-events');
            expect(response.status).toBe(401);
        });
        test('should return empty array if user has no events', async () => {
            const response = await request(app)
                .get('/api/v1/events/user/my-events')
                .set('Authorization', `Bearer ${secondAuthToken}`);
            expect(response.status).toBe(200);
            expect(response.body.events).toEqual([]);
        });
        test('should return events sorted by date', async () => {
            const response = await request(app)
                .get('/api/v1/events/user/my-events')
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(200);
            if (response.body.events.length > 1) {
                for (let i = 0; i < response.body.events.length - 1; i++) {
                    const currentDate = new Date(response.body.events[i].date).getTime();
                    const nextDate = new Date(response.body.events[i + 1].date).getTime();
                    expect(currentDate).toBeLessThanOrEqual(nextDate);
                }
            }
        });
    });
    describe('DELETE /api/v1/events/:id - Delete Event', () => {
        test('should delete event as organizer', async () => {
            // Create a new event to delete
            const eventData = {
                title: 'Event to Delete',
                description: 'This event will be deleted in the test.',
                location: 'Test Location',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                startTime: '18:00',
                endTime: '20:00',
                category: 'other',
                organizer: 'eventuser1',
            };
            const createRes = await request(app)
                .post('/api/v1/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData);
            const deleteRes = await request(app)
                .delete(`/api/v1/events/${createRes.body.event._id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(deleteRes.status).toBe(200);
            // Verify event is deleted
            const getRes = await request(app)
                .get(`/api/v1/events/${createRes.body.event._id}`);
            expect(getRes.status).toBe(404);
        });
        test('should return 403 if non-organizer tries to delete', async () => {
            const response = await request(app)
                .delete(`/api/v1/events/${eventId}`)
                .set('Authorization', `Bearer ${secondAuthToken}`);
            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
        });
        test('should return 401 if not authenticated', async () => {
            const response = await request(app)
                .delete(`/api/v1/events/${eventId}`);
            expect(response.status).toBe(401);
        });
        test('should return 404 if event not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/v1/events/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(response.status).toBe(404);
        });
    });
});
//# sourceMappingURL=events.test.js.map