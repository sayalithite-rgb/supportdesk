import request from 'supertest';
import app from '../../app'; // Apni Express app file ka path check kar lein

describe('Tickets Integration Tests (Supertest)', () => {
  it('should return 401 Unauthorized when accessing tickets without token', async () => {
    const response = await request(app).get('/tickets');
    expect(response.status).toBe(401);
    expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });
});