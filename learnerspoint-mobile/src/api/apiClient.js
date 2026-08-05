import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // 1️⃣ EXPO_PUBLIC_API_URL (localtunnel/ngrok)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2️⃣ Web client (localhost)
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }

  // 3️⃣ Mobile – dynamic host from Expo Go / physical device
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api`;
  }

  // 4️⃣ Android emulator fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  // 5️⃣ Hard‑coded LAN fallback
  return 'http://192.168.1.2:3000/api';
};

export const BASE_URL = getBaseUrl();
console.log('[LearnersPoint API] Dynamic BASE_URL:', BASE_URL);

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-client-platform': Platform.OS,
    'bypass-tunnel-reminder': 'true',
  },
  timeout: 15000,
});

// Request interceptor – inject token, platform header and avoid duplicate `/api` segments
apiClient.interceptors.request.use(
  async (config) => {
    config.headers['x-client-platform'] = Platform.OS;

    // Guard against `baseURL` ending with `/api` and `url` starting with `/api/`
    if (config.baseURL?.endsWith('/api') && config.url?.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api\//, '/');
    }

    try {
      const token = (await AsyncStorage.getItem('token')) || (await AsyncStorage.getItem('userToken'));
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[apiClient] AsyncStorage token lookup failure:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – normalise errors for the UI layer
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error) || error.code === 'ECONNABORTED' || error.message?.includes('canceled')) {
      console.log('[apiClient] Request was cancelled or timed out.');
    } else {
      console.error(
        '[apiClient Connection Fault]',
        error.response?.status || 'NO_STATUS',
        error.response?.data?.message || error.message
      );
    }

    const formattedError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      data: error.response?.data || null,
    };
    return Promise.reject(formattedError);
  }
);

export default apiClient;
