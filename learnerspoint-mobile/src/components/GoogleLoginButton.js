import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, setStoredSession } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleLoginButton({ onLoginSuccess, onLoadingStateChange }: any) {
  // Replace these with your Client IDs in production
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID || 'mock-android-id',
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID || 'mock-ios-id',
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID || 'mock-web-id',
  });

  const [loading, setLoading] = React.useState(false);

  const setLocalLoading = (state) => {
    setLoading(state);
    if (onLoadingStateChange) {
      onLoadingStateChange(state);
    }
  };

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      handleGoogleAuthToken(response.authentication.idToken);
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-In Error', 'Unable to complete sign-in with Google.');
    }
  }, [response]);

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
      console.error('[Google Auth Error]', error);
      Alert.alert('Network Error', 'Cannot establish connection to authentication server.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePress = () => {
    // If no client IDs are configured in development, offer sandbox login
    const isMockAndroid = !process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;
    const isMockWeb = !process.env.EXPO_PUBLIC_WEB_CLIENT_ID;

    if (isMockAndroid && isMockWeb) {
      Alert.alert(
        'Sandbox Mode Active',
        'Google OAuth IDs are not configured. Would you like to log in with a mock sandbox instructor profile?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Sandbox Login', onPress: () => handleGoogleAuthToken('mock_oauth_success_token') }
        ]
      );
      return;
    }

    setLocalLoading(true);
    promptAsync().finally(() => setLocalLoading(false));
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
