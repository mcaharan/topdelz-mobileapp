import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { getInterests, saveInterests } from '../services/api';

function haptic() { Vibration.vibrate(8); }

function ProgressBar() {
  return (
    <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Step 3 of 3</Text>
      <View style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
        <View style={{ height: 5, backgroundColor: '#a855f7', borderRadius: 3, width: '100%' }} />
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const INTERESTS = [
  { id: 'dine',    label: 'Dine-Out',         emoji: '🍽️' },
  { id: 'night',   label: 'Night Life',        emoji: '🌙' },
  { id: 'family',  label: 'Family Dining',     emoji: '👨‍👩‍👧' },
  { id: 'veggie',  label: 'Veggies',           emoji: '🥗' },
  { id: 'nonveg',  label: 'Non-veg',           emoji: '🍗' },
  { id: 'beauty',  label: 'Beauty & Grooming', emoji: '💅' },
  { id: 'near',    label: 'Near me',           emoji: '📍' },
  { id: 'events',  label: 'Events',            emoji: '🎉' },
  { id: 'travel',  label: 'Travel',            emoji: '✈️' },
  { id: 'coffee',  label: 'Cafés',             emoji: '☕' },
  { id: 'movies',  label: 'Movies',            emoji: '🎬' },
  { id: 'sports',  label: 'Sports',            emoji: '⚽' },
];

function Chip({ item, selected, onPress }) {
  return (
    <Pressable
      onPress={() => { haptic(); onPress(); }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={styles.chipEmoji}>{item.emoji}</Text>
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {item.label ?? item.name}
      </Text>
    </Pressable>
  );
}

export default function InterestsScreen({ onSave, onBack }) {
  const [interests, setInterests] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getInterests()
      .then((data) => setInterests(data.interests || []))
      .finally(() => setLoadingData(false));
  }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    haptic();
    setSaving(true);
    try {
      await saveInterests([...selected]);
    } catch (e) {
      // non-blocking
    } finally {
      setSaving(false);
      onSave?.([...selected]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Gradient background */}
      <LinearGradient
        colors={['#7b2fcd', '#c03b8f', '#e8574a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={styles.circleTR} />
      <View style={styles.circleBL} />

      <Pressable
        style={styles.backBtn}
        onPress={() => { haptic(); onBack?.(); }}
      >
        <Text style={styles.backBtnText}>← Back</Text>
      </Pressable>

      {/* Logo area */}
      <View style={styles.logoWrap}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <ProgressBar />
      <Text style={styles.pageTitle}>Choose your Interests</Text>
      <Text style={styles.pageSubtitle}>Pick topics you love — we'll show you the best deals</Text>

      {/* Dark card with chips */}
      <View style={styles.darkCard}>
        <ScrollView
          contentContainerStyle={styles.chipsContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chipsWrap}>
            {loadingData ? (
              <ActivityIndicator color="#a855f7" style={{ marginTop: 40 }} />
            ) : interests.map((item) => (
              <Chip
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onPress={() => toggle(item.id)}
              />
            ))}
          </View>

          {/* Selected count badge */}
          {selected.size > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {selected.size} selected
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Save button */}
        <Pressable
          style={[styles.saveBtn, (selected.size === 0 || saving) && styles.saveBtnDisabled]}
          disabled={selected.size === 0 || saving}
          onPress={handleSave}
        >
          <LinearGradient
            colors={selected.size > 0 ? ['#a855f7', '#7b2fcd'] : ['#555', '#444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save & Continue</Text>
            }
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  circleTR: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -60,
  },
  circleBL: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 100,
    left: -50,
  },

  logoWrap: {
    alignItems: 'center',
    marginTop: 56,
    marginBottom: 16,
  },
  logo: {
    width: 190,
    height: 58,
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

  pageTitle: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 32,
  },

  /* Dark bottom card */
  darkCard: {
    flex: 1,
    backgroundColor: '#1e1270',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },

  chipsContainer: {
    paddingBottom: 16,
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  /* Individual chip */
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipSelected: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168,85,247,0.22)',
  },
  chipEmoji: {
    fontSize: 15,
  },
  chipLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: 'rgba(255,255,255,0.85)',
  },
  chipLabelSelected: {
    color: '#e9d5ff',
    fontFamily: 'Nunito_700Bold',
  },

  countBadge: {
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: 'rgba(168,85,247,0.3)',
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  countBadgeText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#e9d5ff',
  },

  /* Save button */
  saveBtn: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});
