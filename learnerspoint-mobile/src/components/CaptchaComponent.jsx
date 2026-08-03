import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { apiRequest } from '../services/api';

export default function CaptchaComponent({ onCaptchaVerify }) {
  const [captchaId, setCaptchaId] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('Loading...');
  const [captchaSignature, setCaptchaSignature] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [clientFallbackAnswer, setClientFallbackAnswer] = useState('');
  const [fetchingCaptcha, setFetchingCaptcha] = useState(true);

  const abortControllerRef = useRef(null);

  const generateFallbackCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    const ans = n1 + n2;

    const mockId = "client-fallback";
    const mockQuestion = `Solve: ${n1} + ${n2}`;
    const mockSig = "client-fallback-signature";
    const mockAns = ans.toString();

    setCaptchaId(mockId);
    setCaptchaQuestion(mockQuestion);
    setCaptchaSignature(mockSig);
    setClientFallbackAnswer(mockAns);
    setCaptchaImage('');
    setFetchingCaptcha(false);

    // Notify parent component of current state
    if (onCaptchaVerify) {
      onCaptchaVerify({
        captchaId: mockId,
        captchaAnswer: captchaAnswer,
        captchaSignature: mockSig,
        clientFallbackAnswer: mockAns
      });
    }
  };

  const fetchCaptcha = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setFetchingCaptcha(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Task 3: 5-second fetch timeout

    try {
      const response = await apiRequest(`/api/auth/captcha?t=${Date.now()}`, {
        method: 'GET',
        signal: controller.signal
      });

      if (response.captchaId) {
        setCaptchaId(response.captchaId);
        setCaptchaQuestion(response.question);
        setCaptchaSignature(response.signature);
        setClientFallbackAnswer('');
        if (response.image) {
          setCaptchaImage(response.image);
        }

        if (onCaptchaVerify) {
          onCaptchaVerify({
            captchaId: response.captchaId,
            captchaAnswer: captchaAnswer,
            captchaSignature: response.signature,
            clientFallbackAnswer: ''
          });
        }
      }
    } catch (e) {
      console.log('[CaptchaComponent] Falling back to local captcha due to API error:', e.message);
      generateFallbackCaptcha(); // Task 3: Fallback on fails/timeouts
    } finally {
      clearTimeout(timeoutId);
      if (abortControllerRef.current === controller) {
        setFetchingCaptcha(false);
        abortControllerRef.current = null;
      }
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleAnswerChange = (text) => {
    setCaptchaAnswer(text);
    if (onCaptchaVerify) {
      onCaptchaVerify({
        captchaId,
        captchaAnswer: text,
        captchaSignature,
        clientFallbackAnswer
      });
    }
  };

  return (
    <View style={styles.captchaBox}>
      <View style={styles.captchaHeader}>
        <Text style={styles.captchaLabel}>Security Verification</Text>
        <TouchableOpacity onPress={fetchCaptcha} disabled={fetchingCaptcha}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.captchaQuestionRow}>
        {fetchingCaptcha ? (
          <ActivityIndicator size="small" color="#3DBFF2" />
        ) : (Platform.OS === 'web' && captchaImage) ? (
          <Image 
            source={{ uri: captchaImage }} 
            style={styles.captchaImage} 
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.captchaQuestionText}>{captchaQuestion}</Text>
        )}
      </View>
      <TextInput
        placeholder="Your Answer"
        placeholderTextColor="#64748b"
        value={captchaAnswer}
        onChangeText={handleAnswerChange}
        style={styles.captchaInput}
        keyboardType="numeric"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  captchaBox: {
    width: '100%',
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  captchaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  captchaLabel: {
    color: '#3DBFF2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  refreshBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  captchaQuestionRow: {
    marginVertical: 4,
    height: 50,
    justifyContent: 'center',
  },
  captchaImage: {
    width: 160,
    height: 50,
    borderRadius: 4,
  },
  captchaQuestionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  captchaInput: {
    width: '100%',
    height: 40,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 8,
  },
});
