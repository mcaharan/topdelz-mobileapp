import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { saveUserType } from '../services/api';

function haptic() { Vibration.vibrate(8); }

function ProgressBar({ step, total }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: '#aaaaaa', marginBottom: 6 }}>Step {step} of {total}</Text>
      <View style={{ height: 5, backgroundColor: '#e0e0e0', borderRadius: 3 }}>
        <View style={{ height: 5, backgroundColor: '#7b2fcd', borderRadius: 3, width: `${(step / total) * 100}%` }} />
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const CARD_ICON_SIZE = 80;

function ChoiceCard({ icon, label, selected, onPress }) {
  return (
    <Pressable
      onPress={() => { haptic(); onPress(); }}
      style={[styles.choiceCard, selected && styles.choiceCardSelected]}
    >
      <View style={[styles.iconCircle, selected && styles.iconCircleSelected]}>
        <Text style={styles.iconEmoji}>{icon}</Text>
      </View>
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
        {label}
      </Text>
      {selected && <View style={styles.selectedDot} />}
    </Pressable>
  );
}

export default function UserTypeScreen({ onSelect, onBack }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    haptic();
    setLoading(true);
    try {
      await saveUserType(selected);
    } catch (e) {
      // non-blocking — still continue if fails
    } finally {
      setLoading(false);
      onSelect?.(selected);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full gradient background */}
      <LinearGradient
        colors={['#7b2fcd', '#c03b8f', '#e8574a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={styles.circleLarge} />
      <View style={styles.circleSmall} />

      {/* Logo */}
      <Pressable
        style={styles.backBtn}
        onPress={() => { haptic(); onBack?.(); }}
      >
        <Text style={styles.backBtnText}>← Back</Text>
      </Pressable>

      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* White card */}
      <View style={styles.card}>
        <ProgressBar step={2} total={3} />
        <Text style={styles.cardTitle}>Who are you?</Text>
        <Text style={styles.cardSubtitle}>
          Tell us about yourself so we can{'\n'}personalise your experience
        </Text>

        {/* Choice tiles */}
        <View style={styles.choicesRow}>
          <ChoiceCard
            icon="✈️"
            label="Tourist"
            selected={selected === 'tourist'}
            onPress={() => setSelected('tourist')}
          />
          <ChoiceCard
            icon="🏠"
            label="Local People"
            selected={selected === 'local'}
            onPress={() => setSelected('local')}
          />
        </View>

        {/* Continue button */}
        <Pressable
          style={[styles.continueBtn, (!selected || loading) && styles.continueBtnDisabled]}
          disabled={!selected || loading}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={selected ? ['#7b2fcd', '#c03b8f'] : ['#cccccc', '#bbbbbb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtnGradient}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.continueBtnText}>Continue →</Text>
            }
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Decorative background circles */
  circleLarge: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -80,
  },
  circleSmall: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: 160,
    left: -50,
  },

  logo: {
    width: 200,
    height: 62,
    alignSelf: 'center',
    marginTop: 64,
    marginBottom: 32,
  },

  backBtn: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
  },

  /* Main white card */
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },

  cardTitle: {
    fontSize: 26,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#1a1060',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },

  /* Choice cards row */
  choicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 36,
  },

  choiceCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9f9ff',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 8,
    position: 'relative',
  },
  choiceCardSelected: {
    borderColor: '#7b2fcd',
    backgroundColor: '#f3ecff',
  },

  iconCircle: {
    width: CARD_ICON_SIZE,
    height: CARD_ICON_SIZE,
    borderRadius: CARD_ICON_SIZE / 2,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircleSelected: {
    backgroundColor: '#d8b4fe',
  },
  iconEmoji: {
    fontSize: 36,
  },

  choiceLabel: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: '#555555',
    textAlign: 'center',
  },
  choiceLabelSelected: {
    color: '#7b2fcd',
  },

  selectedDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7b2fcd',
  },

  /* Continue button */
  continueBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
});
