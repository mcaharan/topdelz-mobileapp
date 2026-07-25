import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginWithEmail, registerWithEmail } from '../services/api';

function haptic() { Vibration.vibrate(8); }

export default function EmailAuthScreen({ onAuthed, onPhoneTab }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isSignup = mode === 'signup';
  const isValid = email.includes('@') && password.length >= 8 && (!isSignup || name.trim().length > 0);

  const handleSubmit = async () => {
    haptic();
    setError('');
    setLoading(true);
    try {
      const data = isSignup
        ? await registerWithEmail(name.trim(), email.trim(), password)
        : await loginWithEmail(email.trim(), password);

      if (data.success) {
        await AsyncStorage.setItem('auth_token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        onAuthed?.(data.user);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not reach server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.tabRow}>
            <Pressable style={styles.tab} onPress={() => { haptic(); onPhoneTab?.(); }}>
              <Text style={styles.tabText}>Phone</Text>
            </Pressable>
            <View style={[styles.tab, styles.tabActive]}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Email</Text>
            </View>
          </View>

          <Text style={styles.title}>{isSignup ? 'Create account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>
            {isSignup ? 'Sign up with your email to get started.' : 'Log in with your email and password.'}
          </Text>

          {isSignup && (
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor="#a3a3ad"
              style={styles.input}
            />
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Email address"
            placeholderTextColor="#a3a3ad"
            style={styles.input}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Password (min 8 characters)"
            placeholderTextColor="#a3a3ad"
            style={styles.input}
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            style={[styles.primaryButton, (!isValid || loading) && styles.primaryButtonDisabled]}
            disabled={!isValid || loading}
            onPress={handleSubmit}
          >
            {loading
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={styles.primaryButtonText}>{isSignup ? 'Sign Up' : 'Log In'}</Text>
            }
          </Pressable>

          <Pressable
            style={styles.switchWrap}
            onPress={() => { haptic(); setError(''); setMode(isSignup ? 'login' : 'signup'); }}
          >
            <Text style={styles.switchText}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.switchTextBold}>{isSignup ? 'Log in' : 'Sign up'}</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you accept our
        </Text>
        <Pressable>
          <Text style={styles.privacyText}>Privacy policy</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fb' },

  body: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  logoWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandLogo: {
    width: 200,
    height: 62,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f7f7fb',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#a3a3ad',
  },
  tabTextActive: {
    color: '#7b2fcd',
  },

  title: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#14141a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#8b8b96',
    lineHeight: 20,
    marginBottom: 24,
  },

  input: {
    backgroundColor: '#f7f7fb',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ececf2',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: '#14141a',
    marginBottom: 14,
  },

  errorText: {
    color: '#e53935',
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 8,
  },

  primaryButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#7b2fcd',
    shadowColor: '#7b2fcd',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 2,
  },
  primaryButtonDisabled: {
    backgroundColor: '#d8d8e2',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },

  switchWrap: { alignItems: 'center', paddingTop: 18 },
  switchText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#8b8b96',
  },
  switchTextBold: {
    color: '#7b2fcd',
  },

  footer: {
    position: 'absolute',
    bottom: 38,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#a3a3ad',
  },
  privacyText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    color: '#7b2fcd',
    marginTop: 4,
  },
});
