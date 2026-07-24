import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
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

const CARD_ICON_SIZE = 76;

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
      <StatusBar style="dark" />

      <Pressable
        style={styles.backBtn}
        onPress={() => { haptic(); onBack?.(); }}
      >
        <Text style={styles.backBtnText}>← Back</Text>
      </Pressable>

      <View style={styles.logoWrap}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.card}>
        <ProgressBar step={2} total={3} />
        <Text style={styles.cardTitle}>Who are you?</Text>
        <Text style={styles.cardSubtitle}>
          Tell us about yourself so we can{'\n'}personalise your experience
        </Text>

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

        <Pressable
          style={[styles.continueBtn, (!selected || loading) && styles.continueBtnDisabled]}
          disabled={!selected || loading}
          onPress={handleContinue}
        >
          {loading
            ? <ActivityIndicator color="#ffffff" />
            : <Text style={styles.continueBtnText}>Continue →</Text>
          }
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
  logo: {
    width: 180,
    height: 56,
  },

  backBtn: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  backBtnText: {
    color: '#14141a',
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
  },

  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 24,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#14141a',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#8b8b96',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },

  choicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 32,
  },

  choiceCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ececf2',
    backgroundColor: '#f7f7fb',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 8,
    position: 'relative',
  },
  choiceCardSelected: {
    borderColor: '#7b2fcd',
    backgroundColor: '#f3e8ff',
  },

  iconCircle: {
    width: CARD_ICON_SIZE,
    height: CARD_ICON_SIZE,
    borderRadius: CARD_ICON_SIZE / 2,
    backgroundColor: '#ececf2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircleSelected: {
    backgroundColor: '#e9d5ff',
  },
  iconEmoji: {
    fontSize: 34,
  },

  choiceLabel: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: '#4b4b56',
    textAlign: 'center',
  },
  choiceLabelSelected: {
    color: '#6b21a8',
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

  continueBtn: {
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
  continueBtnDisabled: {
    backgroundColor: '#d8d8e2',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
});
