import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { apiRequest, getStoredUser } from '../services/api';

export default function AiChatModal() {
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: 'Hello! I am your LearnersPoint AI Guide. How can I assist you with your courses today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('Guest');

  useEffect(() => {
    getStoredUser().then(user => {
      if (user && user.userId) {
        setUserId(user.userId);
      }
    });
  }, [visible]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const prompt = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: prompt }]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiRequest('/api/ai-chat', {
        method: 'POST',
        body: JSON.stringify({ prompt, userId }),
      });

      if (response.success) {
        setMessages(prev => [...prev, { sender: 'ai', text: response.text }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: response.error || 'Connection offline. Please try again.' }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: e.message || 'API request error. Check your connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity 
        style={styles.floatingButton} 
        onPress={() => setVisible(true)}
      >
        <Text style={styles.floatingText}>💬</Text>
      </TouchableOpacity>

      {/* Expanded Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleGroup}>
                <View style={styles.statusDot} />
                <Text style={styles.headerTitle}>LearnersPoint AI Core</Text>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Chat Body */}
            <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatScrollContent}>
              {messages.map((msg, idx) => (
                <View key={idx} style={[styles.bubbleWrapper, msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
                  <View style={[styles.bubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                    <Text style={styles.bubbleText}>{msg.text}</Text>
                  </View>
                </View>
              ))}
              {loading && (
                <View style={styles.loaderBubble}>
                  <ActivityIndicator size="small" color="#3DBFF2" />
                  <Text style={styles.loaderText}>Thinking...</Text>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask anything about LearnersPoint..."
                placeholderTextColor="#94a3b8"
                style={styles.textInput}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <Text style={styles.sendText}>➔</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B58CA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3DBFF2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#3DBFF2',
  },
  floatingText: {
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    height: 60,
    backgroundColor: '#0B58CA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 191, 242, 0.3)',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  closeText: {
    color: '#cbd5e1',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 16,
  },
  chatScrollContent: {
    paddingBottom: 24,
  },
  bubbleWrapper: {
    width: '100%',
    marginVertical: 4,
    flexDirection: 'row',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  aiWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
  },
  userBubble: {
    backgroundColor: '#0B58CA',
    borderTopRightRadius: 0,
  },
  aiBubble: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 0,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bubbleText: {
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 18,
  },
  loaderBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  loaderText: {
    color: '#94a3b8',
    fontSize: 13,
    marginLeft: 8,
  },
  inputBar: {
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#020617',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#ffffff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0B58CA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
