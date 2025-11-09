import request from 'supertest';
import app from '../app.js';
import Business from '../models/Business.js';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
describe('Business Directory Feature', () => {
    let userId;
    let token;
    let businessId;
    const testUser = {
        email: 'businessowner@test.com',
        password: 'Test123',
        username: 'businessowner',
    };
    const testBusiness = {
        businessName: 'Test Restaurant',
        description: 'A great test restaurant with amazing food',
        category: 'restaurant',
        phone: '+1-234-567-8900',
        email: 'restaurant@test.com',
        address: '123 Main St, Test City, TC 12345',
    };
    beforeAll(async () => {
        // Create test user
        const user = new User({
            email: testUser.email,
            password: testUser.password,
            username: testUser.username,
        });
        const savedUser = await user.save();
        userId = savedUser._id.toString();
        // Generate token for the user
        token = generateToken(userId);
    });
    afterAll(async () => {
        // Cleanup
        await Business.deleteMany({});
        await User.deleteMany({});
    });
    afterEach(async () => {
        // Clear businesses after each test
        await Business.deleteMany({ ownerId: userId });
    });
    describe('Authentication Setup', () => {
        it('should have created a test user', () => {
            expect(userId).toBeDefined();
            expect(token).toBeDefined();
        });
        it('should have a valid JWT token', () => {
            expect(token).toMatch(/^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
        });
    });
    describe('Create Business', () => {
        it('should create a business successfully with required fields', async () => {
            const res = await request(app)
                .post('/api/v1/businesses')
                .set('Authorization', `Bearer ${token}`)
                .send(testBusiness);
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message', 'Business created successfully');
            expect(res.body.business).toHaveProperty('_id');
            expect(res.body.business.businessName).toBe(testBusiness.businessName);
            expect(res.body.business.category).toBe(testBusiness.category);
            expect(res.body.business.ownerId).toBe(userId);
            expect(res.body.business.status).toBe('draft');
            expect(res.body.business.verified).toBe(false);
            businessId = res.body.business._id;
        });
        it('should create a business with optional fields', async () => {
            const businessWithOptions = {
                ...testBusiness,
                businessName: 'Tech Startup',
                category: 'technology',
            };
            const res = await request(app)
                .post('/api/v1/businesses')
                .set('Authorization', `Bearer ${token}`)
                .send(businessWithOptions);
            expect(res.status).toBe(201);
            expect(res.body.business.phone).toBe(testBusiness.phone);
            expect(res.body.business.email).toBe(testBusiness.email);
            expect(res.body.business.address).toBe(testBusiness.address);
        });
        it('should fail if businessName is missing', async () => {
            const { businessName, ...businessWithoutName } = testBusiness;
            const res = await request(app)
                .post('/api/v1/businesses')
                .set('Authorization', `Bearer ${token}`)
                .send(businessWithoutName);
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Business name and category are required');
        });
        it('should fail if category is missing', async () => {
            const { category, ...businessWithoutCategory } = testBusiness;
            const res = await request(app)
                .post('/api/v1/businesses')
                .set('Authorization', `Bearer ${token}`)
                .send(businessWithoutCategory);
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Business name and category are required');
        });
        it('should fail without authentication', async () => {
            const res = await request(app)
                .post('/api/v1/businesses')
                .send(testBusiness);
            expect(res.status).toBe(401);
        });
        it('should fail with invalid token', async () => {
            const res = await request(app)
                .post('/api/v1/businesses')
                .set('Authorization', 'Bearer invalid_token')
                .send(testBusiness);
            expect(res.status).toBe(401);
        });
    });
    describe('List Businesses', () => {
        beforeEach(async () => {
            // Create some test businesses
            const businesses = [
                {
                    businessName: 'Restaurant 1',
                    description: 'Great food',
                    category: 'restaurant',
                    ownerId: userId,
                    ownerName: testUser.username,
                    status: 'active',
                    verified: false,
                },
                {
                    businessName: 'Tech Company',
                    description: 'Software solutions',
                    category: 'technology',
                    ownerId: userId,
                    ownerName: testUser.username,
                    status: 'active',
                    verified: true,
                },
                {
                    businessName: 'Healthcare Clinic',
                    description: 'Medical services',
                    category: 'healthcare',
                    ownerId: userId,
                    ownerName: testUser.username,
                    status: 'draft',
                    verified: false,
                },
            ];
            await Business.insertMany(businesses);
        });
        it('should list all businesses with pagination', async () => {
            const res = await request(app)
                .get('/api/v1/businesses')
                .query({ page: 1, limit: 10 });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(10);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });
        it('should filter businesses by category', async () => {
            const res = await request(app)
                .get('/api/v1/businesses')
                .query({ category: 'restaurant' });
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            res.body.data.forEach((business) => {
                expect(business.category).toBe('restaurant');
            });
        });
        it('should filter businesses by verified status', async () => {
            const res = await request(app)
                .get('/api/v1/businesses')
                .query({ verified: 'true' });
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            res.body.data.forEach((business) => {
                expect(business.verified).toBe(true);
            });
        });
        it('should support pagination with different page numbers', async () => {
            const page1 = await request(app)
                .get('/api/v1/businesses')
                .query({ page: 1, limit: 2 });
            const page2 = await request(app)
                .get('/api/v1/businesses')
                .query({ page: 2, limit: 2 });
            expect(page1.status).toBe(200);
            expect(page2.status).toBe(200);
            expect(page1.body.pagination.page).toBe(1);
            expect(page2.body.pagination.page).toBe(2);
        });
        it('should return pagination info with total count', async () => {
            const res = await request(app)
                .get('/api/v1/businesses')
                .query({ page: 1, limit: 10 });
            expect(res.status).toBe(200);
            expect(res.body.pagination).toHaveProperty('total');
            expect(typeof res.body.pagination.total).toBe('number');
            expect(res.body.pagination.total).toBeGreaterThan(0);
        });
    });
    describe('Get Business Details', () => {
        beforeEach(async () => {
            const business = new Business({
                businessName: 'Detail Test Business',
                description: 'Testing business details endpoint',
                category: 'retail',
                ownerId: userId,
                ownerName: testUser.username,
            });
            const savedBusiness = await business.save();
            businessId = savedBusiness._id.toString();
        });
        it('should get business details by ID', async () => {
            const res = await request(app).get(`/api/v1/businesses/${businessId}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data._id).toBe(businessId);
            expect(res.body.data.businessName).toBe('Detail Test Business');
            expect(res.body.data.category).toBe('retail');
        });
        it('should return 404 for non-existent business', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app).get(`/api/v1/businesses/${fakeId}`);
            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('error', 'Business not found');
        });
        it('should populate owner information', async () => {
            const res = await request(app).get(`/api/v1/businesses/${businessId}`);
            expect(res.status).toBe(200);
            expect(res.body.data.ownerId).toHaveProperty('_id');
            expect(res.body.data.ownerId).toHaveProperty('username');
        });
    });
    describe('Update Business', () => {
        beforeEach(async () => {
            const business = new Business({
                businessName: 'Original Name',
                description: 'Original description',
                category: 'restaurant',
                phone: '+1-000-000-0000',
                ownerId: userId,
                ownerName: testUser.username,
            });
            const savedBusiness = await business.save();
            businessId = savedBusiness._id.toString();
        });
        it('should update business by owner', async () => {
            const updates = {
                businessName: 'Updated Name',
                description: 'Updated description',
            };
            const res = await request(app)
                .put(`/api/v1/businesses/${businessId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updates);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Business updated successfully');
            expect(res.body.business.businessName).toBe('Updated Name');
            expect(res.body.business.description).toBe('Updated description');
        });
        it('should not update restricted fields', async () => {
            const updates = {
                ownerId: 'some_other_user_id',
                verified: true,
            };
            const res = await request(app)
                .put(`/api/v1/businesses/${businessId}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updates);
            expect(res.status).toBe(200);
            // Verify that restricted fields were not updated
            const updated = await Business.findById(businessId);
            expect(updated?.ownerId.toString()).toBe(userId);
            expect(updated?.verified).toBe(false);
        });
        it('should fail if user is not the owner', async () => {
            // Create another user
            const otherUser = new User({
                email: 'other@test.com',
                password: 'Test123',
                username: 'otheruser',
            });
            const savedOtherUser = await otherUser.save();
            const otherToken = generateToken(savedOtherUser._id.toString());
            const updates = { businessName: 'Hacked Business' };
            const res = await request(app)
                .put(`/api/v1/businesses/${businessId}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send(updates);
            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('error', 'You can only update your own businesses');
            // Cleanup
            await User.deleteOne({ _id: savedOtherUser._id });
        });
        it('should fail without authentication', async () => {
            const res = await request(app)
                .put(`/api/v1/businesses/${businessId}`)
                .send({ businessName: 'Updated Name' });
            expect(res.status).toBe(401);
        });
        it('should return 404 for non-existent business', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .put(`/api/v1/businesses/${fakeId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ businessName: 'Updated' });
            expect(res.status).toBe(404);
        });
    });
    describe('Delete Business', () => {
        beforeEach(async () => {
            const business = new Business({
                businessName: 'To Delete',
                description: 'This business will be deleted',
                category: 'retail',
                ownerId: userId,
                ownerName: testUser.username,
            });
            const savedBusiness = await business.save();
            businessId = savedBusiness._id.toString();
        });
        it('should delete business by owner', async () => {
            const res = await request(app)
                .delete(`/api/v1/businesses/${businessId}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Business deleted successfully');
            // Verify it's actually deleted
            const deleted = await Business.findById(businessId);
            expect(deleted).toBeNull();
        });
        it('should fail if user is not the owner', async () => {
            // Create another user
            const otherUser = new User({
                email: 'other2@test.com',
                password: 'Test123',
                username: 'otheruser2',
            });
            const savedOtherUser = await otherUser.save();
            const otherToken = generateToken(savedOtherUser._id.toString());
            const res = await request(app)
                .delete(`/api/v1/businesses/${businessId}`)
                .set('Authorization', `Bearer ${otherToken}`);
            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('error', 'You can only delete your own businesses');
            // Cleanup
            await User.deleteOne({ _id: savedOtherUser._id });
        });
        it('should fail without authentication', async () => {
            const res = await request(app).delete(`/api/v1/businesses/${businessId}`);
            expect(res.status).toBe(401);
        });
        it('should return 404 for non-existent business', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .delete(`/api/v1/businesses/${fakeId}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(404);
        });
    });
    describe('Get Business Reviews', () => {
        beforeEach(async () => {
            const business = new Business({
                businessName: 'Review Test',
                description: 'Testing reviews endpoint',
                category: 'restaurant',
                ownerId: userId,
                ownerName: testUser.username,
            });
            const savedBusiness = await business.save();
            businessId = savedBusiness._id.toString();
        });
        it('should get reviews for a business', async () => {
            const res = await request(app)
                .get(`/api/v1/businesses/${businessId}/reviews`)
                .query({ page: 1, limit: 20 });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('pagination');
            expect(Array.isArray(res.body.data)).toBe(true);
        });
        it('should support pagination for reviews', async () => {
            const res = await request(app)
                .get(`/api/v1/businesses/${businessId}/reviews`)
                .query({ page: 2, limit: 5 });
            expect(res.status).toBe(200);
            expect(res.body.pagination.page).toBe(2);
            expect(res.body.pagination.limit).toBe(5);
        });
        it('should return empty reviews array when no reviews exist', async () => {
            const res = await request(app)
                .get(`/api/v1/businesses/${businessId}/reviews`)
                .query({ page: 1, limit: 20 });
            expect(res.status).toBe(200);
            expect(res.body.data).toEqual([]);
        });
    });
    describe('Data Integrity', () => {
        it('should set default values on business creation', async () => {
            const res = await request(app)
                .post('/api/v1/businesses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                businessName: 'Integrity Test',
                category: 'retail',
            });
            expect(res.status).toBe(201);
            expect(res.body.business.status).toBe('draft');
            expect(res.body.business.verified).toBe(false);
            expect(res.body.business.createdAt).toBeDefined();
        });
        it('should set owner information correctly', async () => {
            const res = await request(app)
                .post('/api/v1/businesses')
                .set('Authorization', `Bearer ${token}`)
                .send(testBusiness);
            expect(res.status).toBe(201);
            expect(res.body.business.ownerId).toBe(userId);
            expect(res.body.business.ownerName).toBe(testUser.username);
        });
        it('should update timestamps on modification', async () => {
            const createRes = await request(app)
                .post('/api/v1/businesses')
                .set('Authorization', `Bearer ${token}`)
                .send(testBusiness);
            const businessId = createRes.body.business._id;
            const createdAt = createRes.body.business.createdAt;
            // Wait a bit before updating
            await new Promise(resolve => setTimeout(resolve, 100));
            const updateRes = await request(app)
                .put(`/api/v1/businesses/${businessId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ businessName: 'Updated Business' });
            expect(updateRes.status).toBe(200);
            expect(updateRes.body.business.updatedAt).toBeDefined();
        });
        it('should trim whitespace from string fields', async () => {
            const res = await request(app)
                .post('/api/v1/businesses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                businessName: '  Test Business With Spaces  ',
                description: '  Description with spaces  ',
                category: 'retail',
            });
            expect(res.status).toBe(201);
            expect(res.body.business.businessName).toBe('Test Business With Spaces');
            expect(res.body.business.description).toBe('Description with spaces');
        });
    });
});
//# sourceMappingURL=business.test.js.map