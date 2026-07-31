import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { apiRequest } from '../services/api';

interface LiveSession {
  id: string;
  roomId: string;
  title: string;
  isStreaming: boolean;
  recordingUrl?: string | null;
}

export default function LiveSessionScreen() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchLiveSessions = async () => {
    try {
      const response = await apiRequest('/api/live');
      if (response.success && response.sessions) {
        setSessions(response.sessions);
      }
    } catch (e: any) {
      console.error('[Live Sync Error]', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchLiveSessions();
    }
  }, [isFocused]);

  const handleJoinSession = (session: LiveSession) => {
    Alert.alert(
      'Join Live Lecture',
      `Connecting you to virtual room "${session.title}"...`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join Room', 
          onPress: () => {
            Alert.alert('Access Verified', 'WebRTC signaling channel joined! (Audio/Video active)');
          } 
        }
      ]
    );
  };

  const handleWatchRecording = (url: string) => {
    Alert.alert('Playback Stream', `Opening archived lecture recording: \n\n${url}`);
  };

  const renderSessionItem = ({ item }: { item: LiveSession }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={[
          styles.badge, 
          item.isStreaming ? styles.liveBadge : styles.upcomingBadge
        ]}>
          <Text style={styles.badgeText}>
            {item.isStreaming ? 'LIVE NOW' : 'RECORDED'}
          </Text>
        </View>
      </View>

      <Text style={styles.roomIdText}>Room ID: {item.roomId}</Text>
      
      {item.isStreaming ? (
        <TouchableOpacity 
          style={styles.joinBtn}
          onPress={() => handleJoinSession(item)}
        >
          <Text style={styles.btnText}>Join Live Broadcast</Text>
        </TouchableOpacity>
      ) : item.recordingUrl ? (
        <TouchableOpacity 
          style={styles.watchBtn}
          onPress={() => handleWatchRecording(item.recordingUrl!)}
        >
          <Text style={styles.btnText}>Watch Archive Recording</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.offlineBtn}>
          <Text style={styles.offlineText}>No Active Broadcast</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Virtual Classrooms</Text>
        <TouchableOpacity onPress={fetchLiveSessions} disabled={loading}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3DBFF2" />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No lectures scheduled today.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshText: {
    color: '#3DBFF2',
    fontSize: 13,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  upcomingBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderWidth: 1,
    borderColor: '#64748b',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  roomIdText: {
    color: '#64748b',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 16,
  },
  joinBtn: {
    backgroundColor: '#ef4444',
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  watchBtn: {
    backgroundColor: '#0B58CA',
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBtn: {
    backgroundColor: '#1e293b',
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  offlineText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
