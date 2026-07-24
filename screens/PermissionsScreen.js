import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import * as Location from 'expo-location';

function haptic() { Vibration.vibrate(8); }

function PermissionCard({ icon, title, description, status, onPress, actionLabel }) {
  return (
    <View style={styles.permCard}>
      <View style={styles.permIconCircle}>
        <Text style={styles.permIcon}>{icon}</Text>
      </View>
      <View style={styles.permTextWrap}>
        <Text style={styles.permTitle}>{title}</Text>
        <Text style={styles.permDescription}>{description}</Text>
      </View>
      {status ? (
        <View style={[styles.statusBadge, status === 'Granted' && styles.statusBadgeGranted]}>
          <Text style={[styles.statusBadgeText, status === 'Granted' && styles.statusBadgeTextGranted]}>
            {status}
          </Text>
        </View>
      ) : (
        <Pressable style={styles.allowBtn} onPress={onPress}>
          <Text style={styles.allowBtnText}>{actionLabel ?? 'Allow'}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function PermissionsScreen({ onContinue }) {
  const [locationStatus, setLocationStatus] = useState(null);

  const requestLocation = async () => {
    haptic();
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationStatus(status === 'granted' ? 'Granted' : 'Denied');
    } catch {
      setLocationStatus('Denied');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.logoWrap}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>App Permissions</Text>
        <Text style={styles.subtitle}>
          We use a couple of permissions to make Topdelz work better for you
        </Text>

        <PermissionCard
          icon="📍"
          title="Location"
          description="Shows nearby stores and deals around you"
          status={locationStatus}
          onPress={requestLocation}
        />

        <PermissionCard
          icon="💬"
          title={Platform.OS === 'ios' ? 'SMS auto-fill' : 'SMS access'}
          description={
            Platform.OS === 'ios'
              ? 'Your OTP code is suggested automatically above the keyboard — no permission needed on iOS'
              : 'Used only to auto-read your OTP — message content is never stored'
          }
          status="Automatic"
        />

        <Pressable style={styles.continueBtn} onPress={() => { haptic(); onContinue?.(); }}>
          <Text style={styles.continueBtnText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fb' },

  logoWrap: {
    alignItems: 'center',
    marginTop: 64,
    marginBottom: 24,
  },
  logo: { width: 180, height: 56 },

  card: {
    marginHorizontal: 24,
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

  permCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  permIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permIcon: { fontSize: 20 },
  permTextWrap: { flex: 1 },
  permTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: '#14141a',
    marginBottom: 2,
  },
  permDescription: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#8b8b96',
    lineHeight: 16,
  },

  allowBtn: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#f3e8ff',
  },
  allowBtnText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    color: '#7b2fcd',
  },

  statusBadge: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#f2f2f7',
  },
  statusBadgeGranted: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: '#8b8b96',
  },
  statusBadgeTextGranted: {
    color: '#166534',
  },

  continueBtn: {
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: '#7b2fcd',
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#7b2fcd',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 2,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
});
