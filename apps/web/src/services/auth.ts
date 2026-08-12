export interface User {
  id: number
  username: string
  displayName: string
  role: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Invalid username or password.'
        : 'The application is temporarily unavailable.',
    )
  }

  return response.json() as Promise<LoginResponse>
}
