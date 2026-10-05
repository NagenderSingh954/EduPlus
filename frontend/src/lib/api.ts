const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('academiq_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export async function loginDemoUser(role: 'STUDENT' | 'TEACHER') {
  const email = role === 'STUDENT' ? 'alex.rivera@campus.edu' : 'dr.sharma@campus.edu';
  const password = 'password123';

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (data.success && data.data?.accessToken) {
    localStorage.setItem('academiq_token', data.data.accessToken);
    localStorage.setItem('academiq_user', JSON.stringify(data.data.user));
    return data.data.user;
  }
  throw new Error(data.message || 'Demo login failed');
}
