import { apiRequest } from './api-client'

export async function createAccount(name: string, email: string, password: string): Promise<void> {
  await apiRequest<{ user: { id: string; name: string; email: string } }>('/auth/register', {
    method: 'POST',
    body: { name, email, password },
    skipAuthRedirect: true,
  })
}

export async function requestOneTimeCode(_email: string): Promise<void> {
  throw new Error('One-time code sign-in is not connected yet. Please sign in with your password.')
}

export async function verifyOneTimeCode(_email: string, _code: string): Promise<void> {
  throw new Error('One-time code verification is not connected yet. Please sign in with your password.')
}
