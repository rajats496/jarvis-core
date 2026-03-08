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

/* ── OTP signup ── */
export async function sendSignupOtp(email) {
  const { data } = await api.post('/auth/send-otp', { email });
  return data;
}

export async function verifySignupOtp(email, otp, password, name = '') {
  const { data } = await api.post('/auth/verify-otp', { email, otp, password, name });
  return data;
}

/* ── Forgot / reset password ── */
export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function verifyResetOtp(email, otp) {
  const { data } = await api.post('/auth/verify-reset-otp', { email, otp });
  return data;
}

export async function resetPassword(resetToken, password) {
  const { data } = await api.post('/auth/reset-password', { resetToken, password });
  return data;
}
