import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { loginWithMobile, API_BASE_URL } from '../services/api';

function haptic() { Vibration.vibrate(8); }

export default function LoginScreen({ onLoggedIn, onGuestLogin }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    haptic();
    setLoading(true);
    try {
      const data = await loginWithMobile(mobileNumber);
      if (data.success) {
        await AsyncStorage.setItem('auth_token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        onLoggedIn?.(mobileNumber, data.user);
      } else {
        Alert.alert('Error', data.message || 'Failed to log in.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not reach server. Check your connection.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const isValid = mobileNumber.length === 10;

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
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Enter your mobile number and we'll get you in — no OTP needed right now.
          </Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>+91</Text>
            <TextInput
              value={mobileNumber}
              onChangeText={(value) =>
                setMobileNumber(value.replace(/[^0-9]/g, '').slice(0, 10))
              }
              keyboardType="number-pad"
              maxLength={10}
              placeholder="Mobile number"
              placeholderTextColor="#a3a3ad"
              style={styles.mobileInput}
            />
            {isValid && <Text style={styles.checkMark}>✓</Text>}
          </View>

          <Pressable
            style={[styles.primaryButton, !isValid && styles.primaryButtonDisabled]}
            disabled={!isValid || loading}
            onPress={handleSendOtp}
          >
            {loading
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={styles.primaryButtonText}>Continue</Text>
            }
          </Pressable>

          <Pressable style={styles.guestWrap} onPress={() => { haptic(); onGuestLogin?.(); }}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </Pressable>
        </View>

        <Text style={styles.apiText}>{API_BASE_URL}</Text>
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

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7fb',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ececf2',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputPrefix: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#8b8b96',
    marginRight: 10,
  },
  mobileInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#14141a',
  },
  checkMark: {
    fontSize: 18,
    color: '#22c55e',
    fontFamily: 'Nunito_700Bold',
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

  guestWrap: { alignItems: 'center', paddingTop: 18 },
  guestText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#8b8b96',
  },

  apiText: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: '#c2c2cc',
    textAlign: 'center',
    marginTop: 16,
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
