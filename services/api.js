import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Base URL of the Laravel backend.
 * For local development:
 *   - iOS Simulator  → http://127.0.0.1:8000/api
 *   - Android Emulator → http://10.0.2.2:8000/api
 *   - Physical device  → use your machine's LAN IP, e.g. http://192.168.1.x:8000/api
 * Set EXPO_PUBLIC_API_BASE_URL in your .env file (copy from .env.example)
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach stored auth token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ─── Auth endpoints ─────────────────────────────────────── */

/**
 * Request an OTP for the given mobile number.
 * @param {string} mobile  10-digit mobile number
 */
export const sendOtp = (mobile) =>
  api.post('/send-otp', { mobile }).then((r) => r.data);

/**
 * Verify the OTP and receive an auth token.
 * @param {string} mobile
 * @param {string} otp     6-digit code
 */
export const verifyOtp = (mobile, otp) =>
  api.post('/verify-otp', { mobile, otp }).then((r) => r.data);

export const getProfile = () =>
  api.get('/profile').then((r) => r.data);

export const updateProfile = (name, email) =>
  api.patch('/profile', { name, email }).then((r) => r.data);

export const saveUserType = (user_type) =>
  api.post('/save-user-type', { user_type }).then((r) => r.data);

export const getInterests = () =>
  api.get('/interests').then((r) => r.data);

export const saveInterests = (interest_ids) =>
  api.post('/save-interests', { interest_ids }).then((r) => r.data);

export const getHomeData = (lat, lng) => {
  const params = lat != null && lng != null ? { lat, lng } : {};
  return api.get('/home-data', { params }).then((r) => r.data);
};

export const getWishlist = () =>
  api.get('/wishlist').then((r) => r.data);

export const getWishlistHistory = () =>
  api.get('/wishlist/history').then((r) => r.data);

export const addToWishlist = (itemType, itemId) =>
  api.post(`/wishlist/${itemType}/${itemId}`).then((r) => r.data);

export const removeFromWishlist = (itemType, itemId) =>
  api.delete(`/wishlist/${itemType}/${itemId}`).then((r) => r.data);

export default api;
