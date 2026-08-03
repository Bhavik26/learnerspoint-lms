import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // 1. Primary: EXPO_PUBLIC_API_URL environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '');
  }

  // 2. Secondary: Web Client localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3000';
  }

  // 3. Tertiary: Mobile Dynamic hostUri detection
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }

  // Final Fallback: Active local IP
  return 'http://192.168.1.2:3000';
};

export const BASE_URL = getBaseUrl();
console.log('[LearnersPoint API] Dynamic BASE_URL:', BASE_URL);

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  category: string;
}

export interface CartItem {
  id: string;
  courseId: string;
  userId: string;
  course: Course;
}

export interface UserSession {
  userId: string;
  email: string;
  role: string;
  name?: string;
  token: string;
}

export async function getStoredToken(): Promise<string | null> {
  try {
    const sessionStr = await AsyncStorage.getItem('user_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr) as UserSession;
      return session.token;
    }
  } catch (e) {
    console.error('Failed to get token', e);
  }
  return null;
}

export async function getStoredUser(): Promise<UserSession | null> {
  try {
    const sessionStr = await AsyncStorage.getItem('user_session');
    if (sessionStr) {
      return JSON.parse(sessionStr) as UserSession;
    }
  } catch (e) {
    console.error('Failed to get user session', e);
  }
  return null;
}

export async function setStoredSession(session: UserSession): Promise<void> {
  try {
    await AsyncStorage.setItem('user_session', JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

export async function clearStoredSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem('user_session');
  } catch (e) {
    console.error('Failed to clear session', e);
  }
}

export async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const token = await getStoredToken();
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  headers.set('bypass-tunnel-reminder', 'true');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { text };
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || `API error status: ${response.status}`);
  }

  return data;
}
