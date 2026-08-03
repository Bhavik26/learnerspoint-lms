import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, setStoredSession } from '../services/api';

// Conditionally require the native Google Sign-in module to prevent web compilation crashes
let GoogleSignin = null;
let statusCodes = null;
if (Platform.OS !== 'web') {
  const nativeModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = nativeModule.GoogleSignin;
  statusCodes = nativeModule.statusCodes;
}

export default function GoogleLoginButton({ onLoginSuccess, onLoadingStateChange }: any) {
  const [loading, setLoading] = React.useState(false);

  const setLocalLoading = (state) => {
    setLoading(state);
    if (onLoadingStateChange) {
      onLoadingStateChange(state);
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'mock-web-client-id.apps.googleusercontent.com',
        offlineAccess: false,
      });
    }
  }, []);

  const handleGoogleAuthToken = async (idToken) => {
    setLocalLoading(true);
    try {
      const result = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });

      if (result.success && result.token) {
        await setStoredSession({
          userId: result.user?.id || 'unknown',
          email: result.user?.email || '',
          role: result.user?.role || 'STUDENT',
          name: result.user?.name || 'Google User',
          token: result.token,
        });

        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        Alert.alert('Authentication Failed', result.error || 'Unable to register Google session');
      }
    } catch (error) {
      console.error('[Google Auth Backend Error]', error);
      Alert.alert('Network Error', 'Cannot establish connection to authentication server.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePress = async () => {
    // 1. Web Flow: Redirect directly to Next.js Web Google Auth
    if (Platform.OS === 'web') {
      const baseUrlClean = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/api$/, '');
      window.location.href = `${baseUrlClean}/api/auth/google`;
      return;
    }

    // 2. Native Flow
    if (!GoogleSignin) {
      Alert.alert('Configuration Error', 'Native Google Sign-in library is not loaded.');
      return;
    }

    setLocalLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed to generate a valid ID token.');
      }

      await handleGoogleAuthToken(idToken);
    } catch (error: any) {
      if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[GoogleSignin] Sign in cancelled by user.');
      } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
        console.log('[GoogleSignin] Sign in already in progress.');
      } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Google Play Services', 'Google Play Services are not available or outdated.');
      } else {
        console.error('[Google Sign-In Exception]', error);
        Alert.alert('Google Sign-In Error', error.message || 'An unexpected error occurred during Google Sign-in.');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.googleButton} 
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#030712" />
      ) : (
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
