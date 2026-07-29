import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://192.168.1.102:3000'; // Match current host Wi-Fi IP address

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
