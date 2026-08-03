import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../services/api';

export default function SignupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Captcha State variables
  const [captchaId, setCaptchaId] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('Loading...');
  const [captchaSignature, setCaptchaSignature] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetchingCaptcha, setFetchingCaptcha] = useState(true);

  const fetchCaptcha = async () => {
    setFetchingCaptcha(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

    try {
      const response = await apiRequest(`/api/auth/captcha?t=${Date.now()}`, {
        method: 'GET',
        signal: controller.signal
      });
      if (response.captchaId) {
        setCaptchaId(response.captchaId);
        setCaptchaQuestion(response.question);
        setCaptchaSignature(response.signature);
        if (response.image) {
          setCaptchaImage(response.image);
        }
      }
    } catch (e: any) {
      console.error('[Captcha Sync Error]', e);
      setCaptchaQuestion('Failed to load captcha. Tap refresh.');
    } finally {
      clearTimeout(timeoutId);
      setFetchingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !captchaAnswer.trim()) {
      Alert.alert('Validation Error', 'Please fill in all inputs including the Captcha solution.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          captchaId,
          captchaAnswer: captchaAnswer.trim(),
          captchaSignature
        }),
      });

      if (response.success) {
        Alert.alert(
          'Registration Success', 
          'Account created successfully! Please log in.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Signup Failed', response.error || 'Registration failed');
        // Refresh Captcha on error
        fetchCaptcha();
        setCaptchaAnswer('');
      }
    } catch (error: any) {
      console.error('[API Register Fault]', error);
      Alert.alert('Registration Error', error.message || 'Cannot establish network connection');
      fetchCaptcha();
      setCaptchaAnswer('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        <View style={styles.card}>
          <Text style={styles.brandTitle}>LearnersPoint<Text style={styles.dot}>.</Text></Text>
          <Text style={styles.subtitle}>Create your student credentials</Text>

          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TextInput
            placeholder="E-mail Address"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#94a3b8"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* Captcha Box */}
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
              ) : captchaImage ? (
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
              onChangeText={setCaptchaAnswer}
              style={styles.captchaInput}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSignup}
            disabled={loading || fetchingCaptcha}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  card: {
    width: '90%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(61, 191, 242, 0.2)',
    shadowColor: '#3dbff2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  dot: {
    color: '#3DBFF2',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#020617',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
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
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#0B58CA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0b58ca',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  linkText: {
    color: '#3DBFF2',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
