import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
import { sendOtp, API_BASE_URL } from '../services/api';

function haptic() { Vibration.vibrate(8); }

export default function LoginScreen({ onOtpSent, onGuestLogin }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    haptic();
    setLoading(true);
    try {
      const data = await sendOtp(mobileNumber);
      if (data.success) {
        onOtpSent?.(mobileNumber, String(data.otp));
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not reach server. Check your connection.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
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

        <Text style={styles.title}>Login with Mobile Number</Text>
        <Text style={styles.subtitle}>
          Enter your mobile number we will sent{'\n'}you OTP to verify
        </Text>

        <Text style={styles.apiText}>API: {API_BASE_URL}</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            value={mobileNumber}
            onChangeText={(value) =>
              setMobileNumber(value.replace(/[^0-9]/g, '').slice(0, 10))
            }
            keyboardType="number-pad"
            maxLength={10}
            placeholder="Enter Mobile No."
            placeholderTextColor="#aaaaaa"
            style={styles.mobileInput}
          />
          {mobileNumber.length === 10 && (
            <Text style={styles.checkMark}>✓</Text>
          )}
        </View>

        <Pressable
          style={[
            styles.sendOtpButton,
            { backgroundColor: mobileNumber.length === 10 ? '#6b21a8' : '#c0c0c0' },
          ]}
          disabled={mobileNumber.length < 10 || loading}
          onPress={handleSendOtp}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.sendOtpText}>Send OTP</Text>
          }
        </Pressable>

        <Pressable style={styles.guestWrap} onPress={() => { haptic(); onGuestLogin?.(); }}>
          <Text style={styles.guestText}>Continue as Guest</Text>
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
    width: 220,
    height: 68,
    marginBottom: 32,
  },

  title: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#111111',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#888888',
    lineHeight: 20,
    marginBottom: 24,
  },

  inputWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  mobileInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 44,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#2c2c2c',
  },
  checkMark: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -11,
    fontSize: 20,
    color: '#22c55e',
    fontFamily: 'Nunito_700Bold',
  },

  sendOtpButton: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  sendOtpText: {
    color: '#f5f5f5',
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
  },

  guestWrap: { alignItems: 'center', paddingVertical: 6 },
  guestText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: '#888888',
  },

  apiText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#555555',
    marginBottom: 12,
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
