import request from 'supertest';
import { app } from '../../src/index';
import pool from '../../src/database/connection';

describe('Authentication Endpoints', () => {
  // Test user data
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@example.com',
    phoneNumber: '1234567890',
    password: 'Password123',
    address: '123 Test St',
    latitude: 37.7749,
    longitude: -122.4194,
  };

  // Test hospital data
  const testHospital = {
    name: 'Test Hospital',
    email: 'testhospital@example.com',
    phoneNumber: '1234567890',
    password: 'Password123',
    address: '456 Hospital Ave',
    latitude: 37.7849,
    longitude: -122.4294,
    maxCapacity: 50,
  };

  // Test driver data
  const testDriver = {
    firstName: 'Test',
    lastName: 'Driver',
    email: 'testdriver@example.com',
    phoneNumber: '1234567890',
    password: 'Password123',
    licenseNumber: 'DL12345678',
  };

  // Clean up the database after tests
  afterAll(async () => {
    try {
      // Delete test records from database
      await pool.query('DELETE FROM drivers WHERE license_number = $1', [testDriver.licenseNumber]);
      await pool.query('DELETE FROM hospitals WHERE email = $1', [testHospital.email]);
      await pool.query('DELETE FROM users WHERE email IN ($1, $2, $3)', [
        testUser.email,
        testHospital.email,
        testDriver.email,
      ]);
      await pool.end();
    } catch (error) {
      console.error('Error cleaning up database:', error);
    }
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register/user')
        .send(testUser)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('firstName', testUser.firstName);
      expect(response.body.data).toHaveProperty('lastName', testUser.lastName);
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject registration with existing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register/user')
        .send(testUser)
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email already registered');
    });

    it('should reject registration with invalid data', async () => {
      const invalidUser = {
        firstName: 'T', // Too short
        lastName: 'User',
        email: 'invalid-email', // Invalid email format
        phoneNumber: 'invalid', // Invalid phone format
        password: '123', // Too short
      };

      const response = await request(app)
        .post('/api/v1/auth/register/user')
        .send(invalidUser)
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Hospital Registration', () => {
    it('should register a new hospital successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register/hospital')
        .send(testHospital)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Hospital registered successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', testHospital.name);
      expect(response.body.data).toHaveProperty('email', testHospital.email);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject registration with existing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register/hospital')
        .send(testHospital)
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email already registered');
    });
  });

  describe('Driver Registration', () => {
    it('should register a new driver successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register/driver')
        .send(testDriver)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Driver registration submitted successfully. Awaiting hospital approval.',
      );
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('firstName', testDriver.firstName);
      expect(response.body.data).toHaveProperty('lastName', testDriver.lastName);
      expect(response.body.data).toHaveProperty('email', testDriver.email);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject registration with existing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register/driver')
        .send(testDriver)
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email already registered');
    });
  });

  describe('Login', () => {
    it('should login a user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          userType: 'user',
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('userType', 'user');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should login a hospital successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testHospital.email,
          password: testHospital.password,
          userType: 'hospital',
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', testHospital.email);
      expect(response.body.data).toHaveProperty('userType', 'hospital');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should login a driver successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testDriver.email,
          password: testDriver.password,
          userType: 'driver',
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', testDriver.email);
      expect(response.body.data).toHaveProperty('userType', 'driver');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
          userType: 'user',
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    it('should reject login with wrong user type', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          userType: 'hospital', // User is registered as 'user', not 'hospital'
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid account type');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123',
          userType: 'user',
        })
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
    });
  });
});
