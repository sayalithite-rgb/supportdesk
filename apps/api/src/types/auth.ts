export type UserRole = 'customer' | 'agent' | 'admin';

export interface AuthUser {
  id: string;
  role: UserRole;
}

// Lets TypeScript know that req.user exists after requireAuth
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}