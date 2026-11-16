import express from 'express';
import request from 'supertest';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { errorHandler } from '../middleware/errorHandler';
import { expiredToken, tokenFor, wrongSecretToken } from './helpers';

const app = express();
app.get('/private', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
app.get('/staff', requireAuth, requireRole('agent', 'admin'), (_req, res) => {
  res.json({ ok: true });
});
app.use(errorHandler);

describe('requireAuth', () => {
  it('returns 401 when the token is missing', async () => {
    expect((await request(app).get('/private')).status).toBe(401);
  });

  it('returns 401 for a malformed token', async () => {
    const res = await request(app).get('/private').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const res = await request(app)
      .get('/private')
      .set('Authorization', `Bearer ${expiredToken('u1', 'customer')}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with another secret', async () => {
    const res = await request(app)
      .get('/private')
      .set('Authorization', `Bearer ${wrongSecretToken('u1', 'agent')}`);
    expect(res.status).toBe(401);
  });

  it('accepts a valid token', async () => {
    const res = await request(app)
      .get('/private')
      .set('Authorization', `Bearer ${tokenFor('u1', 'customer')}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 'u1', role: 'customer' });
  });
});

describe('requireRole', () => {
  it('returns 403 for a customer on a staff route', async () => {
    const res = await request(app)
      .get('/staff')
      .set('Authorization', `Bearer ${tokenFor('u1', 'customer')}`);
    expect(res.status).toBe(403);
  });

  it('allows an agent', async () => {
    const res = await request(app)
      .get('/staff')
      .set('Authorization', `Bearer ${tokenFor('a1', 'agent')}`);
    expect(res.status).toBe(200);
  });
});