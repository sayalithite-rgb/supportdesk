import { randomBytes } from 'crypto';
import request from 'supertest';
import app from '../app';
import { usersRepository } from '../repositories/users.repository';
import { hashPassword } from '../utils/password';
import { verifyAccessToken } from '../utils/jwt';

jest.mock('../repositories/users.repository');
const users = jest.mocked(usersRepository);

const password = `T${randomBytes(8).toString('hex')}9a`;
const safeUser = { id: 'u1', name: 'Asha', email: 'asha@example.test', role: 'customer' as const };

beforeEach(() => jest.resetAllMocks());

describe('POST /auth/register', () => {
  it('creates a customer, hashes the password and never returns passwordHash', async () => {
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue(safeUser);

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Asha', email: 'asha@example.test', password });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('customer');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');

    const stored = users.create.mock.calls[0][0];
    expect(stored.passwordHash).not.toBe(password);
    expect(stored.passwordHash.startsWith('$2')).toBe(true);
  });

  it('returns 409 for a duplicate email', async () => {
    users.findByEmail.mockResolvedValue({
      ...safeUser,
      passwordHash: 'x',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Asha', email: 'asha@example.test', password });
    expect(res.status).toBe(409);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid input', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: '', email: 'bad', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('does not let a public user choose a role', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Eve', email: 'eve@example.test', password, role: 'admin' });
    expect(res.status).toBe(400);
    expect(users.create).not.toHaveBeenCalled();
  });
});

describe('POST /auth/login', () => {
  it('returns a verifiable token and no passwordHash for valid credentials', async () => {
    const passwordHash = await hashPassword(password);
    users.findByEmail.mockResolvedValue({
      ...safeUser,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).post('/auth/login').send({ email: safeUser.email, password });

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    expect(verifyAccessToken(res.body.data.accessToken)).toEqual({ id: 'u1', role: 'customer' });
  });

  it('gives the same generic 401 for a wrong password and an unknown email', async () => {
    const passwordHash = await hashPassword(password);
    users.findByEmail.mockResolvedValueOnce({
      ...safeUser,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const wrong = await request(app)
      .post('/auth/login')
      .send({ email: safeUser.email, password: `${password}x` });

    users.findByEmail.mockResolvedValueOnce(null);
    const unknown = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.test', password });

    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });
});