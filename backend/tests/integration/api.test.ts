import request from 'supertest';
import { app } from '../../src/index';

describe('API Endpoints', () => {
  it('should return a health check status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
  });
});
