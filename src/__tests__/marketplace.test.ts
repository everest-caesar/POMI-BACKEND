import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import User from '../models/User';
import Listing from '../models/Listing';

describe('Marketplace API', () => {
  let authToken: string;
  let userId: string;
  let secondUserToken: string;
  let secondUserId: string;
  let listingId: string;

  // Setup: Connect to test database
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://pomi_user:pomi_password@localhost:27017/pomi?authSource=admin';
    await mongoose.connect(mongoUri);
  });

  // Cleanup: Clear collections after all tests
  afterAll(async () => {
    await User.deleteMany({});
    await Listing.deleteMany({});
    await mongoose.disconnect();
  });

  describe('Authentication Setup', () => {
    test('should register first user for testing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'seller1',
          email: 'seller1@example.com',
          password: 'SellerPassword123',
          age: 32,
          area: 'Downtown Ottawa',
          workOrSchool: 'Tech Hub Ottawa',
        });

      expect(response.status).toBe(201);
      authToken = response.body.token;
      userId = response.body.user._id;
    });

    test('should register second user for testing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'seller2',
          email: 'seller2@example.com',
          password: 'SellerPassword123',
          age: 29,
          area: 'Kanata',
          workOrSchool: 'Shopify',
        });

      expect(response.status).toBe(201);
      secondUserToken = response.body.token;
      secondUserId = response.body.user._id;
    });
  });

  describe('POST /api/v1/marketplace/listings - Create Listing', () => {
    test('should create a new listing successfully', async () => {
      const listingData = {
        title: 'iPhone 14 Pro',
        description: 'Excellent condition, barely used iPhone 14 Pro with original box',
        category: 'electronics',
        price: 900,
        location: 'New York, NY',
        condition: 'like-new',
      };

      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(listingData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('listing');
      expect(response.body.listing.title).toBe(listingData.title);
      expect(response.body.listing.price).toBe(listingData.price);
      expect(response.body.listing.status).toBe('active');

      listingId = response.body.listing._id;
    });

    test('should require authentication to create listing', async () => {
      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .send({
          title: 'Test Item',
          description: 'Test description',
          category: 'electronics',
          price: 100,
          location: 'Test Location',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should validate title is provided', async () => {
      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test description',
          category: 'electronics',
          price: 100,
          location: 'Test Location',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should validate price is provided', async () => {
      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Item',
          description: 'Test description',
          category: 'electronics',
          location: 'Test Location',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should validate category is provided', async () => {
      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Item',
          description: 'Test description',
          price: 100,
          location: 'Test Location',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should validate price cannot be negative', async () => {
      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Item',
          description: 'Test description',
          category: 'electronics',
          price: -50,
          location: 'Test Location',
        });

      expect(response.status).toBe(500);
    });

    test('should validate title minimum length', async () => {
      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'abc', // Less than 5 characters
          description: 'Test description',
          category: 'electronics',
          price: 100,
          location: 'Test Location',
        });

      expect(response.status).toBe(500);
    });

    test('should set default status to active', async () => {
      const listingData = {
        title: 'Used Laptop',
        description: 'Good condition laptop for sale',
        category: 'electronics',
        price: 500,
        location: 'Los Angeles, CA',
      };

      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(listingData);

      expect(response.status).toBe(201);
      expect(response.body.listing.status).toBe('active');
    });

    test('should store seller information in listing', async () => {
      const listingData = {
        title: 'Mountain Bike',
        description: 'Trek mountain bike in good condition',
        category: 'sports',
        price: 400,
        location: 'Denver, CO',
      };

      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(listingData);

      expect(response.status).toBe(201);
      expect(response.body.listing.sellerName).toBe('seller1');
      expect(response.body.listing.sellerId).toBe(userId);
    });
  });

  describe('GET /api/v1/marketplace/listings - List Listings', () => {
    test('should list all active listings', async () => {
      const response = await request(app)
        .get('/api/v1/marketplace/listings');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination.page).toBe(1);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/marketplace/listings?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    test('should filter by category', async () => {
      const response = await request(app)
        .get('/api/v1/marketplace/listings?category=electronics');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      // All items should be electronics category
      response.body.data.forEach((item: any) => {
        expect(item.category).toBe('electronics');
      });
    });

    test('should only show active listings by default', async () => {
      const response = await request(app)
        .get('/api/v1/marketplace/listings');

      expect(response.status).toBe(200);
      response.body.data.forEach((item: any) => {
        expect(item.status).toBe('active');
      });
    });

    test('should populate seller information', async () => {
      const response = await request(app)
        .get('/api/v1/marketplace/listings');

      expect(response.status).toBe(200);
      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('sellerName');
      }
    });

    test('should sort by newest first', async () => {
      const response = await request(app)
        .get('/api/v1/marketplace/listings');

      expect(response.status).toBe(200);
      if (response.body.data.length > 1) {
        const date1 = new Date(response.body.data[0].createdAt);
        const date2 = new Date(response.body.data[1].createdAt);
        expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
      }
    });

    test('should return total count in pagination', async () => {
      const response = await request(app)
        .get('/api/v1/marketplace/listings');

      expect(response.status).toBe(200);
      expect(response.body.pagination).toHaveProperty('total');
      expect(typeof response.body.pagination.total).toBe('number');
    });
  });

  describe('GET /api/v1/marketplace/listings/:id - Get Listing Details', () => {
    test('should get listing details by id', async () => {
      const response = await request(app)
        .get(`/api/v1/marketplace/listings/${listingId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data._id).toBe(listingId);
      expect(response.body.data.title).toBe('iPhone 14 Pro');
    });

    test('should increment view count when retrieving listing', async () => {
      const before = await Listing.findById(listingId);
      const initialViews = before?.views || 0;

      await request(app).get(`/api/v1/marketplace/listings/${listingId}`);

      const after = await Listing.findById(listingId);
      expect(after?.views).toBe(initialViews + 1);
    });

    test('should return 404 for non-existent listing', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/marketplace/listings/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should populate seller information in response', async () => {
      const response = await request(app)
        .get(`/api/v1/marketplace/listings/${listingId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('sellerName');
    });
  });

  describe('PUT /api/v1/marketplace/listings/:id - Update Listing', () => {
    test('should update listing as seller', async () => {
      const updateData = {
        title: 'iPhone 14 Pro - Updated',
        price: 850,
      };

      const response = await request(app)
        .put(`/api/v1/marketplace/listings/${listingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.listing.title).toBe(updateData.title);
      expect(response.body.listing.price).toBe(updateData.price);
    });

    test('should require authentication to update listing', async () => {
      const response = await request(app)
        .put(`/api/v1/marketplace/listings/${listingId}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(401);
    });

    test('should not allow other users to update listing', async () => {
      const response = await request(app)
        .put(`/api/v1/marketplace/listings/${listingId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ title: 'Hacked Title' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 404 for non-existent listing', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/marketplace/listings/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
    });

    test('should only allow specific fields to be updated', async () => {
      const response = await request(app)
        .put(`/api/v1/marketplace/listings/${listingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Title',
          status: 'sold',
          sellerId: secondUserId, // Try to change seller
        });

      expect(response.status).toBe(200);
      // sellerId should NOT change
      expect(response.body.listing.sellerId).toBe(userId);
    });

    test('should update listing status', async () => {
      const response = await request(app)
        .put(`/api/v1/marketplace/listings/${listingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'sold' });

      expect(response.status).toBe(200);
      expect(response.body.listing.status).toBe('sold');
    });
  });

  describe('POST /api/v1/marketplace/listings/:id/favorite - Favorite Listing', () => {
    test('should favorite a listing', async () => {
      // Create a new listing to favorite
      const listingRes = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Bookshelf',
          description: 'Wooden bookshelf for sale',
          category: 'furniture',
          price: 150,
          location: 'Chicago, IL',
        });

      const newListingId = listingRes.body.listing._id;

      const response = await request(app)
        .post(`/api/v1/marketplace/listings/${newListingId}/favorite`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(response.status).toBe(201);
      expect(response.body.message).toMatch(/added to favorites/i);
      expect(response.body.favorited).toBe(true);
    });

    test('should require authentication to favorite', async () => {
      const response = await request(app)
        .post(`/api/v1/marketplace/listings/${listingId}/favorite`);

      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent listing', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/v1/marketplace/listings/${fakeId}/favorite`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    test('should toggle favorite status', async () => {
      const listingRes = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Desk Chair',
          description: 'Comfortable office chair',
          category: 'furniture',
          price: 200,
          location: 'Seattle, WA',
        });

      const newListingId = listingRes.body.listing._id;

      // First favorite
      const favor1 = await request(app)
        .post(`/api/v1/marketplace/listings/${newListingId}/favorite`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(favor1.status).toBe(201);
      expect(favor1.body.favorited).toBe(true);

      // Unfavorite
      const favor2 = await request(app)
        .post(`/api/v1/marketplace/listings/${newListingId}/favorite`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(favor2.status).toBe(200);
      expect(favor2.body.favorited).toBe(false);
    });

    test('should store favorite users in listing', async () => {
      const listingRes = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Gaming Console',
          description: 'Latest gaming console',
          category: 'electronics',
          price: 500,
          location: 'Boston, MA',
        });

      const newListingId = listingRes.body.listing._id;

      await request(app)
        .post(`/api/v1/marketplace/listings/${newListingId}/favorite`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      const listing = await Listing.findById(newListingId);
      expect(listing?.favorites.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/v1/marketplace/listings/:id - Delete Listing', () => {
    test('should delete listing as seller', async () => {
      // Create a listing to delete
      const listingRes = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Item to Delete',
          description: 'This will be deleted',
          category: 'electronics',
          price: 50,
          location: 'Miami, FL',
        });

      const deleteListingId = listingRes.body.listing._id;

      const response = await request(app)
        .delete(`/api/v1/marketplace/listings/${deleteListingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/deleted successfully/i);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/v1/marketplace/listings/${deleteListingId}`);

      expect(getResponse.status).toBe(404);
    });

    test('should require authentication to delete', async () => {
      const response = await request(app)
        .delete(`/api/v1/marketplace/listings/${listingId}`);

      expect(response.status).toBe(401);
    });

    test('should not allow other users to delete listing', async () => {
      const response = await request(app)
        .delete(`/api/v1/marketplace/listings/${listingId}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 404 for non-existent listing', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/marketplace/listings/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    test('should remove listing from database', async () => {
      const listingRes = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Another Item to Delete',
          description: 'Testing deletion',
          category: 'books',
          price: 20,
          location: 'Atlanta, GA',
        });

      const deleteListingId = listingRes.body.listing._id;

      // Delete
      await request(app)
        .delete(`/api/v1/marketplace/listings/${deleteListingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Check database
      const listing = await Listing.findById(deleteListingId);
      expect(listing).toBeNull();
    });
  });

  describe('Data Integrity', () => {
    test('should store listing with all required fields', async () => {
      const listingData = {
        title: 'Complete Item',
        description: 'Full detailed description of the item',
        category: 'home',
        price: 300,
        location: 'Portland, OR',
        condition: 'good',
      };

      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(listingData);

      expect(response.status).toBe(201);

      const listing = await Listing.findById(response.body.listing._id);
      expect(listing?.title).toBe(listingData.title);
      expect(listing?.description).toBe(listingData.description);
      expect(listing?.category).toBe(listingData.category);
      expect(listing?.price).toBe(listingData.price);
      expect(listing?.condition).toBe(listingData.condition);
    });

    test('should have timestamps for listing creation', async () => {
      const beforeTime = new Date();

      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Timestamp Test Item',
          description: 'Testing timestamp creation',
          category: 'toys',
          price: 25,
          location: 'Austin, TX',
        });

      const afterTime = new Date();

      expect(response.status).toBe(201);
      const createdAt = new Date(response.body.listing.createdAt);
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    test('should initialize views to 0', async () => {
      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'View Count Test',
          description: 'Testing initial view count',
          category: 'sports',
          price: 75,
          location: 'Philadelphia, PA',
        });

      expect(response.status).toBe(201);
      expect(response.body.listing.views).toBe(0);
    });

    test('should initialize favorites as empty array', async () => {
      const response = await request(app)
        .post('/api/v1/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Favorites Test',
          description: 'Testing initial favorites',
          category: 'electronics',
          price: 150,
          location: 'Miami, FL',
        });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body.listing.favorites)).toBe(true);
      expect(response.body.listing.favorites.length).toBe(0);
    });
  });
});
