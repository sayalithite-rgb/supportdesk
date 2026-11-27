import { AppError } from '../utils/AppError';
import { usersRepository } from '../repositories/users.repository';
import { DUMMY_HASH, hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import type { LoginInput, RegisterInput } from '../validation/auth.validation';

export const authService = {
  async register(input: RegisterInput) {
    const existing = await usersRepository.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict('Email is already registered', 'EMAIL_ALREADY_REGISTERED');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await usersRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return { user };
  },

  async login(input: LoginInput) {
    const user = await usersRepository.findByEmail(input.email);

    // Always compare, even if the user does not exist (similar timing, same message)
    const passwordOk = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !passwordOk) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const accessToken = signAccessToken({ id: user.id, role: user.role });

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },
};