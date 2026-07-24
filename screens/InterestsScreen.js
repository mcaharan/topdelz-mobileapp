import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
    <View style={progStyles.wrap}>
      <Text style={progStyles.label}>Step 3 of 3</Text>
      <View style={progStyles.track}>
        <View style={progStyles.fill} />
      </View>
    </View>
  );
}

const progStyles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  label: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: '#a3a3ad', marginBottom: 6 },
  track: { height: 4, backgroundColor: '#ececf2', borderRadius: 3 },
  fill: { height: 4, backgroundColor: '#7b2fcd', borderRadius: 3, width: '100%' },
});

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

      <ProgressBar />
      <Text style={styles.pageTitle}>Choose your Interests</Text>
      <Text style={styles.pageSubtitle}>Pick topics you love — we'll show you the best deals</Text>

      <View style={styles.card}>
        <ScrollView
          contentContainerStyle={styles.chipsContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chipsWrap}>
            {loadingData ? (
              <ActivityIndicator color="#7b2fcd" style={{ marginTop: 40 }} />
            ) : interests.map((item) => (
              <Chip
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onPress={() => toggle(item.id)}
              />
            ))}
          </View>

          {selected.size > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {selected.size} selected
              </Text>
            </View>
          )}
        </ScrollView>

        <Pressable
          style={[styles.saveBtn, (selected.size === 0 || saving) && styles.saveBtnDisabled]}
          disabled={selected.size === 0 || saving}
          onPress={handleSave}
        >
          {saving
            ? <ActivityIndicator color="#ffffff" />
            : <Text style={styles.saveBtnText}>Save & Continue</Text>
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
    marginTop: 56,
    marginBottom: 16,
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

  pageTitle: {
    fontSize: 22,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#14141a',
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#8b8b96',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 32,
  },

  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },

  chipsContainer: {
    paddingBottom: 16,
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#ececf2',
    backgroundColor: '#f7f7fb',
  },
  chipSelected: {
    borderColor: '#7b2fcd',
    backgroundColor: '#f3e8ff',
  },
  chipEmoji: {
    fontSize: 15,
  },
  chipLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#4b4b56',
  },
  chipLabelSelected: {
    color: '#6b21a8',
    fontFamily: 'Nunito_700Bold',
  },

  countBadge: {
    alignSelf: 'flex-start',
    marginTop: 16,
    backgroundColor: '#f3e8ff',
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  countBadgeText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#6b21a8',
  },

  saveBtn: {
    marginTop: 16,
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
  saveBtnDisabled: {
    backgroundColor: '#d8d8e2',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});
