import { api } from './axios';

export async function register(email, password, name = '') {
  const { data } = await api.post('/auth/register', { email, password, name });
  return data;
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function refreshToken() {
  const { data } = await api.post('/auth/refresh');
  return data;
}

export async function googleAuth(accessToken) {
  const { data } = await api.post('/auth/google', { accessToken });
  return data;
}

/* ── Email link signup ── */
export async function sendVerificationEmail(email, password, name = '') {
  const { data } = await api.post('/auth/send-verification', { email, password, name });
  return data;
}

export async function verifyEmailToken(token, email) {
  const { data } = await api.post('/auth/verify-email', { token, email });
  return data;
}

/* ── Forgot / reset password ── */
export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token, email, password) {
  const { data } = await api.post('/auth/reset-password', { token, email, password });
  return data;
}

