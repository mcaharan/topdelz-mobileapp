import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
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
import auth from '@react-native-firebase/auth';
import { firebaseLogin } from '../services/api';

function haptic() { Vibration.vibrate(8); }

function ProgressBar({ step, total }) {
  return (
    <View style={progStyles.wrap}>
      <Text style={progStyles.label}>Step {step} of {total}</Text>
      <View style={progStyles.track}>
        <View style={[progStyles.fill, { width: `${(step / total) * 100}%` }]} />
      </View>
    </View>
  );
}

const progStyles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  label: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: '#a3a3ad', marginBottom: 6 },
  track: { height: 4, backgroundColor: '#ececf2', borderRadius: 3 },
  fill: { height: 4, backgroundColor: '#7b2fcd', borderRadius: 3 },
});

export default function OtpScreen({ mobileNumber, allowSkip, onVerified, onSkip }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const [sent, setSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    if (resendTimer <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleChange = (text, index) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit) { haptic(); }
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const isComplete = otp.every((d) => d !== '');

  const handleVerify = async () => {
    haptic();
    setLoading(true);
    setError('');
    try {
      if (!confirmation) {
        setError('Please send the OTP first.');
        return;
      }
      const credential = await confirmation.confirm(otp.join(''));
      const idToken = await credential.user.getIdToken();
      const data = await firebaseLogin(idToken);
      if (data.success) {
        await AsyncStorage.setItem('auth_token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        onVerified?.(data.user);
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch (err) {
      const msg = err?.code === 'auth/invalid-verification-code'
        ? 'Incorrect code. Please try again.'
        : (err?.response?.data?.message || 'Verification failed. Try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    setError('');
    try {
      const conf = await auth().signInWithPhoneNumber('+91' + mobileNumber);
      setConfirmation(conf);
      setSent(true);
      setResendTimer(30);
      setCanResend(false);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to send OTP.');
    }
  };

  useEffect(() => {
    if (mobileNumber) { sendOtp(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResend = () => {
    if (!canResend) return;
    haptic();
    sendOtp();
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
          <ProgressBar step={2} total={3} />

          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>
            Enter the OTP code sent to your mobile number
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputs.current[index] = ref)}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <Pressable
            style={[styles.primaryButton, (!isComplete || loading) && styles.primaryButtonDisabled]}
            disabled={!isComplete || loading}
            onPress={handleVerify}
          >
            {loading
              ? <ActivityIndicator color="#ffffff" />
              : <Text style={styles.primaryButtonText}>Verify</Text>
            }
          </Pressable>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            style={styles.resendWrap}
            disabled={!sent || !canResend}
            onPress={handleResend}
          >
            {!sent ? (
              <Text style={styles.resendText}>Sending OTP...</Text>
            ) : canResend ? (
              <Text style={[styles.resendText, styles.resendTextActive]}>Resend OTP</Text>
            ) : (
              <Text style={styles.resendText}>Resend OTP in {resendTimer}s</Text>
            )}
          </Pressable>

          {allowSkip && (
            <Pressable style={styles.skipWrap} onPress={() => { haptic(); onSkip?.(); }}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          )}
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
    width: 180,
    height: 56,
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

  errorText: {
    color: '#e53935',
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },

  title: {
    fontSize: 22,
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

  /* 6 individual OTP boxes */
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpBox: {
    width: 44,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#f7f7fb',
    borderWidth: 1.5,
    borderColor: '#ececf2',
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#14141a',
  },
  otpBoxFilled: {
    backgroundColor: '#ffffff',
    borderColor: '#7b2fcd',
  },

  primaryButton: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#7b2fcd',
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 6,
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

  resendWrap: { alignItems: 'center', paddingVertical: 10 },
  resendText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#a3a3ad',
  },
  resendTextActive: {
    color: '#7b2fcd',
  },

  skipWrap: { alignItems: 'center', paddingTop: 4 },
  skipText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: '#c2c2cc',
    textDecorationLine: 'underline',
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
