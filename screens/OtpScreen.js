import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
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
import { sendOtp, verifyOtp } from '../services/api';

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
  label: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: '#888888', marginBottom: 6 },
  track: { height: 5, backgroundColor: '#e0e0e0', borderRadius: 3 },
  fill: { height: 5, backgroundColor: '#7b2fcd', borderRadius: 3 },
});

export default function OtpScreen({ mobileNumber, prefillOtp, onVerified }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill OTP boxes when a prefill value is provided (dev mode)
  useEffect(() => {
    if (prefillOtp && prefillOtp.length === 6) {
      setOtp(prefillOtp.split(''));
    }
  }, [prefillOtp]);

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
      const data = await verifyOtp(mobileNumber, otp.join(''));
      if (data.success) {
        await AsyncStorage.setItem('auth_token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        onVerified?.(data.user);
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Verification failed. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    haptic();
    setResendTimer(30);
    setCanResend(false);
    setError('');
    try {
      await sendOtp(mobileNumber);
    } catch {
      Alert.alert('Error', 'Failed to resend OTP.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Gradient top band */}
      <LinearGradient
        colors={['#7b2fcd', '#c03b8f', '#e8574a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientStrip}
      />

      {/* White rounded card */}
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Logo */}
        <Image
          source={require('../assets/logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />

        <ProgressBar step={2} total={3} />

        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>
          Enter OTP Code Sent to your Mobile Number
        </Text>

        {/* 6 OTP boxes */}
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
          style={[styles.verifyButton, (!isComplete || loading) && styles.disabledButton]}
          disabled={!isComplete || loading}
          onPress={handleVerify}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.verifyText}>Verify</Text>
          }
        </Pressable>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={styles.resendWrap}
          disabled={!canResend}
          onPress={handleResend}
        >
          {canResend ? (
            <Text style={[styles.resendText, { color: '#7b2fcd', fontFamily: 'Nunito_700Bold' }]}>Resend OTP</Text>
          ) : (
            <Text style={styles.resendText}>Resend OTP in {resendTimer}s</Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By clicking 'Login', 'Signup', you accept our
        </Text>
        <Pressable>
          <Text style={styles.privacyText}>Privacy policy</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#7b2fcd' },

  gradientStrip: { height: 110 },

  errorText: {
    color: '#e53935',
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    textAlign: 'center',
    marginTop: 8,
  },

  body: {
    flex: 1,
    backgroundColor: '#ebebeb',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  brandLogo: {
    width: 200,
    height: 62,
    marginBottom: 32,
  },

  title: {
    fontSize: 26,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#111111',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#888888',
    lineHeight: 20,
    marginBottom: 28,
  },

  /* 6 individual OTP boxes */
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#dcdcdc',
    backgroundColor: '#ffffff',
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    color: '#111111',
  },
  otpBoxFilled: {
    borderColor: '#6b21a8',
  },

  /* Verify button */
  verifyButton: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#6b21a8',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  disabledButton: {
    backgroundColor: '#c0c0c0',
  },
  verifyText: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
  },

  resendWrap: { alignItems: 'center', paddingVertical: 6 },
  resendText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: '#888888',
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
    color: '#888888',
  },
  privacyText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    color: '#6e2eb8',
    marginTop: 4,
  },
});
