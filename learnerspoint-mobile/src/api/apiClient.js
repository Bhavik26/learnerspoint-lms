import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // 1. Primary: EXPO_PUBLIC_API_URL environment variable (Localtunnel / Ngrok)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Secondary: Web Client localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }

  // 3. Android Emulator fallback
  if (Platform.OS === 'android' && !Constants.expoConfig?.hostUri) {
    return 'http://10.0.2.2:3000/api';
  }

  // 4. Mobile Dynamic hostUri detection (Physical / Expo Go)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api`;
  }

  // Final Fallback: Active local IP
  return 'http://192.168.1.2:3000/api';
};

export const BASE_URL = getBaseUrl();
console.log('[LearnersPoint API] Dynamic BASE_URL:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-client-platform': Platform.OS, // Task 4: Add default headers x-client-platform
  },
  timeout: 15000,
});

// Request Interceptor: Inject token, platform OS, and normalize double '/api' prefixes
apiClient.interceptors.request.use(
  async (config) => {
    config.headers['x-client-platform'] = Platform.OS;

    // Prevent double '/api/api' path concatenation if url has a leading '/api'
    if (config.baseURL?.endsWith('/api') && config.url?.startsWith('/api/')) {
      config.url = config.url.replace('/api/', '/');
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[apiClient] AsyncStorage token lookup failure:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Uniform connection logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error) || error.code === 'ECONNABORTED' || error.message?.includes('canceled')) {
      console.log('[apiClient] Request was cancelled or timed out.');
    } else {
      console.error('[apiClient Connection Fault]', error.response?.status, error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
