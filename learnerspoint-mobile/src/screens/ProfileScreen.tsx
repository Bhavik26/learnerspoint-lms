import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredUser, fetchMeProfile, clearStoredSession, UserSession } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ route, onLogoutSuccess }: any) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      // 1. Try fetching live user profile from protected endpoint /api/auth/me
      const remoteUser = await fetchMeProfile();
      if (remoteUser) {
        setUser(remoteUser);
      } else {
        // 2. Read from standardized AsyncStorage keys 'user' and 'token'
        const userStr = await AsyncStorage.getItem('user');
        const token = (await AsyncStorage.getItem('token')) || (await AsyncStorage.getItem('userToken'));

        if (userStr) {
          const parsed = JSON.parse(userStr);
          setUser({
            userId: parsed.id || parsed.userId || 'unknown',
            email: parsed.email || '',
            name: parsed.name || 'Student Account',
            role: parsed.role || 'STUDENT',
            token: token || '',
          });
        } else {
          // Fallback to getStoredUser
          const storedSession = await getStoredUser();
          if (storedSession) {
            setUser(storedSession);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load profile data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to end your LearnersPoint session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            await clearStoredSession();
            if (auth && auth.logout) {
              await auth.logout();
            }
            const logoutCallback = onLogoutSuccess || route?.params?.onLogoutSuccess;
            if (logoutCallback) {
              logoutCallback();
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3DBFF2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Account</Text>
      </View>

      <View style={styles.content}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.substring(0, 1).toUpperCase() : 'S'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Student Account'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'STUDENT'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out of Application</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0B58CA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#3DBFF2',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(61, 191, 242, 0.1)',
    borderWidth: 1,
    borderColor: '#3DBFF2',
  },
  roleText: {
    color: '#3DBFF2',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
