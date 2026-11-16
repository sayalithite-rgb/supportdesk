import { randomBytes } from 'crypto';
import { hashPassword, verifyPassword } from '../utils/password';

describe('password hashing', () => {
  const plain = `T${randomBytes(8).toString('hex')}9a`; // random, not a real password

  it('stores a bcrypt hash and not the plain password', async () => {
    const hash = await hashPassword(plain);
    expect(hash).not.toContain(plain);
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('accepts the right password and rejects a wrong one', async () => {
    const hash = await hashPassword(plain);
    await expect(verifyPassword(plain, hash)).resolves.toBe(true);
    await expect(verifyPassword(`${plain}x`, hash)).resolves.toBe(false);
  });
});