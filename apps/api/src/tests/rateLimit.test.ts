import request from 'supertest';
import app from '../app';
import { usersRepository } from '../repositories/users.repository';

jest.mock('../repositories/users.repository');
const users = jest.mocked(usersRepository);

it('blocks login after too many failed attempts', async () => {
  users.findByEmail.mockResolvedValue(null);
  const body = { email: 'x@example.test', password: 'WrongPass123' };

  for (let i = 0; i < 5; i++) {
    const res = await request(app).post('/auth/login').send(body);
    expect(res.status).toBe(401);
  }

  const blocked = await request(app).post('/auth/login').send(body);
  expect(blocked.status).toBe(429);
  expect(blocked.body.error.code).toBe('RATE_LIMITED');
});