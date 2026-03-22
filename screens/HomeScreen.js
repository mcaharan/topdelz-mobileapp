import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  RefreshControl,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { addToWishlist, getHomeData, getProfile, getWishlist, getWishlistHistory, removeFromWishlist, trackOfferEvent, updateProfile } from '../services/api';

const { width, height } = Dimensions.get('window');
const haptic = () => Vibration.vibrate(8);

const shareItem = (title, message) => {
  haptic();
  Share.share({ title, message });
};

const timeAgo = (value) => {
  if (!value) return 'just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
};

/* ─── Theme ─────────────────────────────────────────────── */
const THEMES = {
  light: {
    bg: '#f2f2f7', card: '#ffffff', text: '#111111', subtext: '#555555',
    border: '#f0f0f0', tabBg: '#ffffff', tabText: '#888888',
    searchBg: '#ffffff', searchInner: '#f5f5f7', searchBorder: '#eeeeee',
    notifPanel: '#f2f2f7', notifRow: '#ffffff', notifRowUnread: '#faf5ff',
    notifUnreadBorder: '#e9d8fd', notifTitle: '#444444', notifBody: '#666666',
    notifTime: '#bbbbbb', sheetBg: '#ffffff', sheetText: '#111111',
    sheetSubText: '#555555', sheetDivider: '#f0f0f0', sheetDealBorder: '#f5f5f5',
    statsRow: '#ffffff', statNum: '#7b2fcd', menuCard: '#ffffff',
    menuLabel: '#111111', menuSub: '#999999', menuBorder: '#f5f5f5',
    mealSection: '#ffffff', mealTitle: '#111111',
    mealTagBg: '#fafafa', mealTagBorder: '#dddddd', mealTagText: '#555555',
  },
  dark: {
    bg: '#0f0f18', card: '#1c1c2a', text: '#f0f0f0', subtext: '#aaaaaa',
    border: '#2a2a3a', tabBg: '#16161f', tabText: '#727282',
    searchBg: '#16161f', searchInner: '#262636', searchBorder: '#333345',
    notifPanel: '#0f0f18', notifRow: '#1c1c2a', notifRowUnread: '#241535',
    notifUnreadBorder: '#4a2070', notifTitle: '#cccccc', notifBody: '#aaaaaa',
    notifTime: '#666666', sheetBg: '#1c1c2a', sheetText: '#f0f0f0',
    sheetSubText: '#aaaaaa', sheetDivider: '#2a2a3a', sheetDealBorder: '#2a2a3a',
    statsRow: '#1c1c2a', statNum: '#a78bfa', menuCard: '#1c1c2a',
    menuLabel: '#f0f0f0', menuSub: '#888888', menuBorder: '#2a2a3a',
    mealSection: '#1c1c2a', mealTitle: '#f0f0f0',
    mealTagBg: '#252535', mealTagBorder: '#3a3a50', mealTagText: '#bbbbbb',
  },
};

const ThemeContext = createContext({
  colors: THEMES.light, dark: false, setDark: () => {}, onLogout: () => {},
});

/* ─── Data ─────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'dine',    emoji: '🍽️', label: 'Dine-Out',        color: '#fff3e0' },
  { id: 'food',    emoji: '🛵',  label: 'Food\nDelivery',   color: '#e3f2fd' },
  { id: 'pharma',  emoji: '💊',  label: 'Pharmacy',         color: '#e8f5e9' },
  { id: 'beauty',  emoji: '💄',  label: 'Beauty &\nGrooming', color: '#fce4ec' },
  { id: 'fashion', emoji: '👗',  label: 'Fashion',          color: '#f3e5f5' },
  { id: 'night',   emoji: '🌙',  label: 'Nightlife',        color: '#ede7f6' },
  { id: 'online',  emoji: '🛒',  label: 'Online\nBrands',   color: '#e0f7fa' },
  { id: 'travel',  emoji: '🧳',  label: 'Travel',           color: '#fff8e1' },
];

const BANNERS = [
  { id: '1', title: '60% + Flat ₹100 off', sub: 'On your next 5 deliveries', badge: '🏠 Home Delivery', colors: ['#1d3fad', '#0d47a1'], emojis: ['🍔', '🍟', '🥤'] },
  { id: '2', title: 'Buy 1 Get 1 Free',    sub: 'On all salon services today', badge: '💄 Beauty Deals',  colors: ['#7b2fcd', '#c03b8f'], emojis: ['💅', '💇', '🧖'] },
  { id: '3', title: 'Up to 50% off',       sub: 'Local restaurants near you',  badge: '🍛 Dine-Out',      colors: ['#e65100', '#f57c00'], emojis: ['🍛', '🍜', '🍱'] },
];

const FLASH_DEALS = [
  { id: '1', name: 'Burger King',   off: '40%', emoji: '🍔', bg: ['#ff6f00', '#f57c00'] },
  { id: '2', name: 'Pizza Hut',     off: '30%', emoji: '🍕', bg: ['#c62828', '#e53935'] },
  { id: '3', name: 'KFC',           off: '25%', emoji: '🍗', bg: ['#827717', '#f9a825'] },
  { id: '4', name: 'Baskin Robbins',off: '20%', emoji: '🍦', bg: ['#ad1457', '#e91e63'] },
];

const DEALS = [
  { id: '1', title: 'Entertainment', desc: 'Save up to 25%', color: ['#e8574a', '#f7a134'], emoji: '🎬' },
  { id: '2', title: 'Electronics',   desc: 'Save up to 40%', color: ['#2563eb', '#7b2fcd'], emoji: '📱' },
  { id: '3', title: 'Dining Out',    desc: 'Save up to 30%', color: ['#059669', '#0d9488'], emoji: '🍕' },
  { id: '4', title: 'Beauty Deals',  desc: 'Save up to 35%', color: ['#c03b8f', '#7b2fcd'], emoji: '💅' },
];

const MEAL_TAGS = [
  { id: 'all',    label: 'All' },
  { id: 'brk',   label: 'Breakfast' },
  { id: 'lnch',  label: 'Lunch' },
  { id: 'si',    label: 'South Indian' },
  { id: 'ch',    label: 'Chinese' },
  { id: 'din',   label: 'Dinner' },
  { id: 'bir',   label: 'Biryani' },
  { id: 'rol',   label: 'Rolls' },
  { id: 'swt',   label: 'Sweets' },
];

const POPULAR_STORES = [
  {
    id: '1', name: 'Burger King', dist: '2km', area: 'White Town', rating: '4.2',
    tag: 'Budget Eats', emoji: '\ud83c\udf54', bg: '#fff3e0', open: true,
    lat: 11.9342, lng: 79.8360,
    deals: [
      { id: 'd1', name: 'Whopper Meal', off: '40% OFF', price: '\u20b9199' },
      { id: 'd2', name: 'Chicken Wings (6 pcs)', off: '25% OFF', price: '\u20b9149' },
      { id: 'd3', name: 'Chocolate Shake', off: '15% OFF', price: '\u20b979' },
    ],
  },
  {
    id: '2', name: 'Pizza Hut', dist: '2km', area: 'White Town', rating: '4.5',
    tag: 'Popular', emoji: '\ud83c\udf55', bg: '#fce4ec', open: true,
    lat: 11.9350, lng: 79.8370,
    deals: [
      { id: 'd1', name: 'Margherita Medium', off: '30% OFF', price: '\u20b9299' },
      { id: 'd2', name: 'Pepperoni Large', off: '20% OFF', price: '\u20b9449' },
      { id: 'd3', name: 'Garlic Bread', off: '10% OFF', price: '\u20b999' },
    ],
  },
  {
    id: '3', name: 'A2B', dist: '1km', area: 'White Town', rating: '4.1',
    tag: 'Veg Only', emoji: '\ud83c\udf5b', bg: '#e8f5e9', open: false,
    lat: 11.9330, lng: 79.8345,
    deals: [
      { id: 'd1', name: 'Meals Combo', off: '20% OFF', price: '\u20b9179' },
      { id: 'd2', name: 'Idli (4 pcs)', off: '10% OFF', price: '\u20b959' },
      { id: 'd3', name: 'Filter Coffee', off: '5% OFF', price: '\u20b939' },
    ],
  },
  {
    id: '4', name: "McDonald's", dist: '3km', area: 'Anna Nagar', rating: '4.3',
    tag: 'Quick Bites', emoji: '\ud83c\udf5f', bg: '#fff8e1', open: true,
    lat: 11.9290, lng: 79.8340,
    deals: [
      { id: 'd1', name: 'McAloo Tikki Burger', off: '30% OFF', price: '\u20b989' },
      { id: 'd2', name: 'McVeggie Combo', off: '25% OFF', price: '\u20b9229' },
      { id: 'd3', name: 'McFlurry', off: '20% OFF', price: '\u20b999' },
    ],
  },
];

const NEARBY_STORES = [
  {
    id: '1', name: 'The Red Box', dist: '2km', area: 'White Town', tag: 'Budget Eats',
    emoji: '\ud83e\udd61', rating: '4.0', open: true, bg: '#fff3e0',
    lat: 11.9338, lng: 79.8355,
    deals: [
      { id: 'd1', name: 'Rice Box Combo', off: '35% OFF', price: '\u20b9159' },
      { id: 'd2', name: 'Noodle Bowl', off: '20% OFF', price: '\u20b9119' },
    ],
  },
  {
    id: '2', name: 'Pizza House', dist: '2km', area: 'White Town', tag: 'Budget Eats',
    emoji: '\ud83c\udf55', rating: '3.8', open: true, bg: '#fce4ec',
    lat: 11.9355, lng: 79.8365,
    deals: [
      { id: 'd1', name: 'Mini Pizza', off: '30% OFF', price: '\u20b9149' },
      { id: 'd2', name: 'Pasta + Garlic Bread', off: '25% OFF', price: '\u20b9199' },
    ],
  },
  {
    id: '3', name: 'KFC', dist: '3km', area: 'Aruthra Nagar', tag: 'Quick Bites',
    emoji: '\ud83c\udf57', rating: '4.4', open: true, bg: '#fff8e1',
    lat: 11.9270, lng: 79.8185,
    deals: [
      { id: 'd1', name: 'Chicken Bucket (8 pcs)', off: '25% OFF', price: '\u20b9499' },
      { id: 'd2', name: 'Zinger Burger', off: '20% OFF', price: '\u20b9179' },
      { id: 'd3', name: 'Popcorn Chicken', off: '15% OFF', price: '\u20b9129' },
    ],
  },
  {
    id: '4', name: 'House Café', dist: '3km', area: 'Aruthra Nagar', tag: 'Café',
    emoji: '\u2615', rating: '4.1', open: false, bg: '#e8f5e9',
    lat: 11.9262, lng: 79.8170,
    deals: [
      { id: 'd1', name: 'Cappuccino', off: '15% OFF', price: '\u20b989' },
      { id: 'd2', name: 'Cold Brew', off: '10% OFF', price: '\u20b9129' },
    ],
  },
  {
    id: '5', name: "Domino's Pizza", dist: '3km', area: 'Anna Nagar', tag: 'Quick Eats',
    emoji: '\ud83c\udf55', rating: '4.2', open: true, bg: '#e3f2fd',
    lat: 11.9282, lng: 79.8330,
    deals: [
      { id: 'd1', name: 'Medium Pizza + Garlic Bread', off: '40% OFF', price: '\u20b9349' },
      { id: 'd2', name: 'Pasta in White Sauce', off: '20% OFF', price: '\u20b9179' },
    ],
  },
  {
    id: '6', name: 'Baskin Robbins', dist: '3km', area: 'Anna Nagar', tag: 'Desserts',
    emoji: '\ud83c\udf66', rating: '4.5', open: true, bg: '#f3e5f5',
    lat: 11.9278, lng: 79.8320,
    deals: [
      { id: 'd1', name: 'Double Scoop', off: '20% OFF', price: '\u20b9129' },
      { id: 'd2', name: 'Ice Cream Cake', off: '15% OFF', price: '\u20b9399' },
      { id: 'd3', name: 'Sundae', off: '10% OFF', price: '\u20b9159' },
    ],
  },
];

/* ─── Countdown hook ────────────────────────────────────── */
function useCountdown(endHour = 23, endMin = 59) {
  const calc = () => {
    const now = new Date();
    const end = new Date(); end.setHours(endHour, endMin, 59, 0);
    const diff = Math.max(0, Math.floor((end - now) / 1000));
    const h = String(Math.floor(diff / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

/* ─── Sub-components ────────────────────────────────────── */
function CategoryItem({ item, active, onPress }) {
  return (
    <Pressable style={styles.catItem} onPress={onPress}>
      <View style={[styles.catIconBox, { backgroundColor: active ? '#7b2fcd' : item.color }]}>
        <Text style={styles.catEmoji}>{item.emoji}</Text>
      </View>
      <Text style={[styles.catLabel, active && { color: '#7b2fcd', fontFamily: 'Nunito_700Bold' }]}>
        {item.label}
      </Text>
      {active && <View style={styles.catActiveDot} />}
    </Pressable>
  );
}

function SectionHeader({ title, subtitle, accent }) {
  const { colors } = useContext(ThemeContext);
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {accent ? <View style={styles.accentBar} /> : null}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <Pressable>
        <Text style={styles.viewAll}>View All ›</Text>
      </Pressable>
    </View>
  );
}

function BannerSlider({ banners = [], onOpenStore, onOpenMultipleStores }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (banners.length === 0) return;
    const t = setInterval(() => {
      const next = (index + 1) % banners.length;
      scrollRef.current?.scrollTo({ x: next * (width - 28), animated: true });
      setIndex(next);
    }, 3500);
    return () => clearInterval(t);
  }, [index, banners.length]);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / (width - 28)))
        }
        contentContainerStyle={{ gap: 0 }}
        style={{ marginHorizontal: 14 }}
      >
        {banners.map((b) => (
          <LinearGradient
            key={b.id}
            colors={b.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroBanner}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{b.badge}</Text>
              </View>
              <Text style={styles.heroOffer}>{b.title}</Text>
              <Text style={styles.heroSub}>{b.sub}</Text>
              {b.cta_enabled && (
                <Pressable
                  style={styles.heroBtn}
                  onPress={() => {
                    const linked = b.linked_stores || [];
                    if (linked.length === 1) {
                      onOpenStore?.(linked[0], 'banner-direct');
                    } else if (linked.length > 1) {
                      onOpenMultipleStores?.(b);
                    }
                  }}
                >
                  <Text style={styles.heroBtnText}>{b.cta_text || 'Order now →'}</Text>
                </Pressable>
              )}
              <Text style={styles.heroFine}>{b.fine_print || '*Valid on orders above ₹200'}</Text>
            </View>
            <View style={styles.heroEmojisCol}>
              {b.image_url ? (
                <Image source={{ uri: b.image_url }} style={styles.heroImage} resizeMode="cover" />
              ) : (
                (b.emojis || []).map((e, i) => (
                  <Text key={i} style={{ fontSize: i === 0 ? 42 : 34 }}>{e}</Text>
                ))
              )}
            </View>
          </LinearGradient>
        ))}
      </ScrollView>
      {/* Dots */}
      <View style={styles.dotsRow}>
        {banners.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function FlashDealCard({ item, countdown, isSaved, onToggleWishlist, onOpen }) {
  return (
    <LinearGradient colors={item.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.flashCard}>
      <Pressable style={styles.quickSaveBtn} onPress={() => onToggleWishlist?.('flash_deal', item)}>
        <Text style={styles.quickSaveText}>{isSaved ? '♥' : '♡'}</Text>
      </Pressable>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.flashImage} resizeMode="cover" />
      ) : (
        <Text style={styles.flashEmoji}>{item.emoji}</Text>
      )}
      <Text style={styles.flashOff}>{item.off} OFF</Text>
      <Text style={styles.flashName}>{item.name}</Text>
      <View style={styles.flashTimerRow}>
        <Text style={styles.flashTimerIcon}>⏱</Text>
        <Text style={styles.flashTimer}>{countdown}</Text>
      </View>
      <Pressable style={styles.flashViewBtn} onPress={() => onOpen?.(item)}>
        <Text style={styles.flashViewText}>View Deal</Text>
      </Pressable>
      <Pressable
        style={styles.flashShareBtn}
        onPress={() => shareItem(
          `${item.name} Flash Deal`,
          `⚡️ ${item.off} OFF at ${item.name}! Ends in ${countdown}.\nGet it on Topdelz 🎉`
        )}
      >
        <Text style={styles.flashShareText}>📤 Share</Text>
      </Pressable>
    </LinearGradient>
  );
}

function SpecialOfferStrip() {
  return (
    <LinearGradient
      colors={['#1a237e', '#283593']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.offerStrip}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.offerStripBadge}>🎉 LIMITED TIME OFFER</Text>
        <Text style={styles.offerStripTitle}>Free Delivery All Day!</Text>
        <Text style={styles.offerStripSub}>
          Use code:{' '}
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', color: '#fbbf24' }}>TOPDELZ</Text>
        </Text>
      </View>
      <Text style={{ fontSize: 56 }}>🛵</Text>
    </LinearGradient>
  );
}

function DealCard({ deal, isSaved, onToggleWishlist, onOpen }) {
  return (
    <LinearGradient colors={deal.color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dealCard}>
      <Pressable style={styles.quickSaveBtn} onPress={() => onToggleWishlist?.('deal_card', deal)}>
        <Text style={styles.quickSaveText}>{isSaved ? '♥' : '♡'}</Text>
      </Pressable>
      {deal.image_url ? (
        <Image source={{ uri: deal.image_url }} style={styles.dealImage} resizeMode="cover" />
      ) : (
        <Text style={styles.dealEmoji}>{deal.emoji}</Text>
      )}
      <Text style={styles.dealSubLabel}>A guide to</Text>
      <Text style={styles.dealTitle}>{deal.title}</Text>
      <Text style={styles.dealDesc}>{deal.desc}</Text>
      <View style={styles.dealBtnRow}>
        <Pressable style={styles.exploreBtn} onPress={() => onOpen?.(deal)}>
          <Text style={styles.exploreBtnText}>Explore now</Text>
        </Pressable>
        <Pressable
          style={styles.dealShareBtn}
          onPress={() => shareItem(
            `${deal.title} Deal`,
            `${deal.emoji} ${deal.desc} on ${deal.title}!\nCheck it out on Topdelz 🎉`
          )}
        >
          <Text style={styles.dealShareText}>📤</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function PopularCard({ store, onPress, isSaved, onToggleWishlist }) {
  const { colors } = useContext(ThemeContext);
  return (
    <Pressable style={[styles.popularCard, { backgroundColor: colors.card }]} onPress={onPress}>
      <View style={[styles.popularImgBox, { backgroundColor: store.bg }]}>
        <Pressable style={styles.quickSaveBtnSmall} onPress={() => onToggleWishlist?.('store', store)}>
          <Text style={styles.quickSaveTextSmall}>{isSaved ? '♥' : '♡'}</Text>
        </Pressable>
        <Text style={styles.popularEmoji}>{store.emoji}</Text>
        {!store.open && (
          <View style={styles.closedOverlay}><Text style={styles.closedText}>Closed</Text></View>
        )}
      </View>
      <View style={styles.popularInfo}>
        <Text style={[styles.popularName, { color: colors.text }]} numberOfLines={1}>{store.name}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.starIcon}>⭐</Text>
          <Text style={[styles.ratingVal, { color: colors.text }]}>{store.rating}</Text>
          <Text style={styles.popularDot}>·</Text>
          <Text style={styles.popularDist}>{store.dist}</Text>
        </View>
        <View style={[styles.tagPill, store.open ? styles.tagOpen : styles.tagClosed]}>
          <Text style={[styles.tagPillText, { color: store.open ? '#15803d' : '#991b1b' }]}>
            {store.tag}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function NearbyCard({ store, onPress, isSaved, onToggleWishlist }) {
  const { colors } = useContext(ThemeContext);
  return (
    <Pressable style={[styles.nearbyCard, { backgroundColor: colors.card }]} onPress={onPress}>
      <View style={[styles.nearbyImgBox, { backgroundColor: store.bg }]}>
        <Pressable style={styles.quickSaveBtnSmall} onPress={() => onToggleWishlist?.('store', store)}>
          <Text style={styles.quickSaveTextSmall}>{isSaved ? '♥' : '♡'}</Text>
        </Pressable>
        <Text style={styles.nearbyEmoji}>{store.emoji}</Text>
        {!store.open && (
          <View style={styles.nearbyClosedBadge}>
            <Text style={styles.nearbyClosedText}>Closed</Text>
          </View>
        )}
        <View style={styles.nearbyRatingBadge}>
          <Text style={styles.nearbyRatingText}>⭐ {store.rating}</Text>
        </View>
      </View>
      <View style={styles.nearbyInfo}>
        <Text style={[styles.nearbyName, { color: colors.text }]} numberOfLines={1}>{store.name}</Text>
        <Text style={styles.nearbyDist} numberOfLines={1}>{store.dist} · {store.area}</Text>
        <View style={styles.nearbyTagPill}>
          <Text style={styles.nearbyTag}>{store.tag}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function TabBar({ activeTab, setActiveTab }) {
  const { colors } = useContext(ThemeContext);
  const tabs = [
    { id: 'home',     emoji: '🏠', label: 'Home' },
    { id: 'wishlist', emoji: '♡',  label: 'Wishlist' },
    { id: 'explore',  emoji: '🗺️', label: 'Explore' },
    { id: 'offers',   emoji: '▶',  label: 'Offers' },
  ];
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.tabBg }]}>
      {tabs.map((t) => (
        <Pressable key={t.id} style={styles.tabItem} onPress={() => setActiveTab(t.id)}>
          {activeTab === t.id ? (
            <LinearGradient colors={['#7b2fcd', '#c03b8f']} style={styles.tabActivePill}>
              <Text style={styles.tabEmojiActive}>{t.emoji}</Text>
              <Text style={styles.tabLabelActive}>{t.label}</Text>
            </LinearGradient>
          ) : (
            <>
              <Text style={styles.tabEmoji}>{t.emoji}</Text>
              <Text style={[styles.tabLabel, { color: colors.tabText }]}>{t.label}</Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

/* ─── Notifications Panel ───────────────────────────────── */
const NOTIFS = [
  {
    id: '1', type: 'deal', read: false,
    icon: '🔥', title: 'Flash Deal Alert!',
    body: 'Burger King 40% off ends in 2 hours. Grab it now!',
    time: '2 min ago',
  },
  {
    id: '2', type: 'order', read: false,
    icon: '📦', title: 'Order on the way',
    body: 'Your order from Pizza Hut has been picked up.',
    time: '18 min ago',
  },
  {
    id: '3', type: 'promo', read: true,
    icon: '🎁', title: 'Weekend Special',
    body: 'Use code WEEKEND20 for 20% off all salon bookings.',
    time: '2 hr ago',
  },
  {
    id: '4', type: 'deal', read: true,
    icon: '⚡', title: 'New deal near you',
    body: 'KFC just dropped a 25% deal 3 km from you.',
    time: 'Yesterday',
  },
  {
    id: '5', type: 'promo', read: true,
    icon: '🎉', title: 'You earned a reward!',
    body: '3-day streak! Here\'s a bonus coupon: STREAK10.',
    time: 'Yesterday',
  },
  {
    id: '6', type: 'order', read: true,
    icon: '✅', title: 'Order delivered',
    body: 'Your Baskin Robbins order was delivered. Enjoy!',
    time: '2 days ago',
  },
];

const NOTIF_FILTERS = [
  { id: 'all',   label: 'All' },
  { id: 'deal',  label: '⚡ Deals' },
  { id: 'order', label: '📦 Orders' },
  { id: 'promo', label: '🎁 Promos' },
];

const NOTIF_TYPE_COLOR = {
  deal:  ['#ff6f00', '#f57c00'],
  order: ['#1d3fad', '#0d47a1'],
  promo: ['#7b2fcd', '#c03b8f'],
};

function NotificationsPanel({ onClose }) {
  const { colors } = useContext(ThemeContext);
  const slideAnim = useRef(new Animated.Value(-700)).current;
  const [notifs, setNotifs] = useState(NOTIFS);
  const [nFilter, setNFilter] = useState('all');

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 55,
      friction: 11,
    }).start();
  }, []);

  const close = () => {
    Animated.timing(slideAnim, {
      toValue: -700,
      duration: 240,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const markAllRead = () => {
    haptic();
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotif = (id) => {
    haptic();
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = nFilter === 'all' ? notifs : notifs.filter((n) => n.type === nFilter);
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <View style={styles.notifsOverlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />
        <Animated.View style={[styles.notifsPanel, { backgroundColor: colors.notifPanel, transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <LinearGradient
            colors={['#7b2fcd', '#c03b8f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.notifsHeaderGrad}
          >
            <View style={styles.notifsHeaderTop}>
              <View>
                <Text style={styles.notifsTitle}>Notifications</Text>
                {unread > 0 && (
                  <Text style={styles.notifsUnreadLabel}>{unread} unread</Text>
                )}
              </View>
              <View style={styles.notifsHeaderRight}>
                {unread > 0 && (
                  <Pressable onPress={markAllRead} style={styles.notifMarkAllBtn}>
                    <Text style={styles.notifMarkAllText}>Mark all read</Text>
                  </Pressable>
                )}
                <Pressable style={styles.notifsCloseBtn} onPress={close}>
                  <Text style={styles.notifsCloseBtnText}>✕</Text>
                </Pressable>
              </View>
            </View>

            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.notifsFilterRow}
            >
              {NOTIF_FILTERS.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => { haptic(); setNFilter(f.id); }}
                  style={[
                    styles.notifsFilterChip,
                    nFilter === f.id && styles.notifsFilterChipActive,
                  ]}
                >
                  <Text style={[styles.notifsFilterText, nFilter === f.id && styles.notifsFilterTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </LinearGradient>

          {/* List */}
          {filtered.length === 0 ? (
            <View style={styles.notifsEmpty}>
              <Text style={{ fontSize: 52 }}>🔕</Text>
              <Text style={styles.notifsEmptyText}>No notifications here</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 28 }}
            >
              {filtered.map((n) => (
                <Pressable
                  key={n.id}
                  style={[
                    styles.notifRow,
                    { backgroundColor: colors.notifRow },
                    !n.read && { backgroundColor: colors.notifRowUnread, borderWidth: 1, borderColor: colors.notifUnreadBorder },
                  ]}
                  onPress={() => {
                    haptic();
                    setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                  }}
                >
                  {/* Colored icon */}
                  <LinearGradient
                    colors={NOTIF_TYPE_COLOR[n.type]}
                    style={styles.notifIconBox}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={{ fontSize: 20 }}>{n.icon}</Text>
                  </LinearGradient>

                  {/* Text */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notifRowTitle, { color: colors.notifTitle }, !n.read && styles.notifRowTitleUnread]}>
                      {n.title}
                    </Text>
                    <Text style={[styles.notifRowBody, { color: colors.notifBody }]} numberOfLines={2}>{n.body}</Text>
                    <Text style={[styles.notifRowTime, { color: colors.notifTime }]}>{n.time}</Text>
                  </View>

                  {/* Unread dot + dismiss */}
                  <View style={styles.notifRowRight}>
                    {!n.read && <View style={styles.notifUnreadDot} />}
                    <Pressable onPress={() => dismissNotif(n.id)} style={styles.notifDismissBtn}>
                      <Text style={styles.notifDismissText}>✕</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ─── Wishlist View ─────────────────────────────────────── */
const WISHLIST_ITEMS = [
  { id: '1', name: 'Burger King',    emoji: '🍔', tag: 'Budget Eats', off: '40% OFF', price: '₹199', bg: ['#ff6f00','#f57c00'], saved: '2 days ago',  category: 'food' },
  { id: '2', name: 'Baskin Robbins', emoji: '🍦', tag: 'Desserts',    off: '20% OFF', price: '₹129', bg: ['#ad1457','#e91e63'], saved: 'Today',       category: 'food' },
  { id: '3', name: 'Pizza Hut',      emoji: '🍕', tag: 'Popular',     off: '30% OFF', price: '₹299', bg: ['#c62828','#e53935'], saved: '1 week ago',  category: 'food' },
  { id: '4', name: 'KFC',            emoji: '🍗', tag: 'Quick Bites', off: '25% OFF', price: '₹499', bg: ['#827717','#f9a825'], saved: '3 days ago',  category: 'food' },
  { id: '5', name: '40% on Salon',   emoji: '💇', tag: 'Beauty Deal', off: '40% OFF', price: '₹599', bg: ['#7b2fcd','#c03b8f'], saved: 'Today',      category: 'deal' },
  { id: '6', name: 'Movie Tickets',  emoji: '🎬', tag: 'Entertainment',off: '25% OFF',price: '₹249', bg: ['#1d3fad','#0d47a1'], saved: 'Yesterday',  category: 'deal' },
];

const W_FILTERS = [
  { id: 'all',  label: 'All Saves' },
  { id: 'food', label: '🍕 Food' },
  { id: 'deal', label: '🎟️ Deals' },
];

function WishlistView({ items = WISHLIST_ITEMS, history = [], onRemove }) {
  const { colors } = useContext(ThemeContext);
  const [filter, setFilter] = useState('all');

  const removeItem = (id) => {
    haptic();
    onRemove?.(id);
  };

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#7b2fcd', '#c03b8f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.wishlistHeader}
      >
        <View style={styles.wishlistHeaderTop}>
          <View>
            <Text style={styles.wishlistHeaderTitle}>My Wishlist</Text>
            <Text style={styles.wishlistHeaderSub}>{items.length} saved items</Text>
          </View>
          <View style={styles.wishlistHeartBubble}>
            <Text style={{ fontSize: 28 }}>🤍</Text>
          </View>
        </View>

        {/* Filter chips inside header */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.wishlistFilterRow}
        >
          {W_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => { haptic(); setFilter(f.id); }}
              style={[
                styles.wishlistFilterChip,
                filter === f.id && styles.wishlistFilterChipActive,
              ]}
            >
              <Text style={[
                styles.wishlistFilterText,
                filter === f.id && styles.wishlistFilterTextActive,
              ]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </LinearGradient>

      {filtered.length === 0 ? (
        <View style={styles.wishlistEmpty}>
          <Text style={{ fontSize: 72 }}>💔</Text>
          <Text style={styles.wishlistEmptyTitle}>Nothing here yet</Text>
          <Text style={styles.wishlistEmptySub}>Tap ♡ on any deal or store to save it here</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 28 }}
        >
          {/* Summary strip */}
          <View style={[styles.wishlistSummaryStrip, { backgroundColor: colors.card }]}>
            <View style={styles.wishlistSummaryItem}>
              <Text style={styles.wishlistSummaryNum}>{items.length}</Text>
              <Text style={styles.wishlistSummaryLabel}>Saved</Text>
            </View>
            <View style={styles.wishlistSummaryDivider} />
            <View style={styles.wishlistSummaryItem}>
              <Text style={styles.wishlistSummaryNum}>₹875</Text>
              <Text style={styles.wishlistSummaryLabel}>Total Savings</Text>
            </View>
            <View style={styles.wishlistSummaryDivider} />
            <View style={styles.wishlistSummaryItem}>
              <Text style={styles.wishlistSummaryNum}>🔥 3</Text>
              <Text style={styles.wishlistSummaryLabel}>Expiring Soon</Text>
            </View>
          </View>

          {filtered.map((item) => (
            <View key={item.id} style={[styles.wishlistCard, { backgroundColor: colors.card }]}>
              {/* Gradient emoji panel */}
              <LinearGradient
                colors={item.bg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.wishlistCardBg}
              >
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <Text style={{ fontSize: 38 }}>{item.emoji}</Text>
                )}
                {/* Discount ribbon */}
                <View style={styles.wishlistRibbon}>
                  <Text style={styles.wishlistRibbonText}>{item.off}</Text>
                </View>
              </LinearGradient>

              {/* Content area */}
              <View style={styles.wishlistCardContent}>
                <View style={styles.wishlistCardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.wishlistCardName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.wishlistCardTag, { color: colors.subtext }]}>{item.tag}</Text>
                  </View>
                  {/* Remove */}
                  <Pressable onPress={() => removeItem(item.id)} style={styles.wishlistRemoveBtn}>
                    <Text style={{ fontSize: 16 }}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.wishlistCardFooter}>
                  <View>
                    <Text style={styles.wishlistSavedLabel}>Saved {item.saved}</Text>
                    <Text style={[styles.wishlistCardPrice, { color: colors.text }]}>From {item.price}</Text>
                  </View>
                  <Pressable onPress={haptic} style={styles.wishlistGetBtn}>
                    <LinearGradient
                      colors={['#7b2fcd', '#c03b8f']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.wishlistGetBtnGrad}
                    >
                      <Text style={styles.wishlistGetBtnText}>Get Offer →</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          {/* Promo nudge */}
          <LinearGradient
            colors={['#1a237e', '#283593']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.wishlistPromo}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.wishlistPromoBadge}>🎉 EXCLUSIVE OFFER</Text>
              <Text style={styles.wishlistPromoTitle}>Extra 10% off</Text>
              <Text style={styles.wishlistPromoSub}>On your first wishlisted order today!</Text>
            </View>
            <Text style={{ fontSize: 44 }}>🎁</Text>
          </LinearGradient>

          {history.length > 0 ? (
            <View style={[styles.wishlistHistoryCard, { backgroundColor: colors.card }]}> 
              <Text style={[styles.wishlistHistoryTitle, { color: colors.text }]}>Recent Wishlist Activity</Text>
              {history.slice(0, 8).map((entry) => (
                <View key={entry.id} style={styles.wishlistHistoryRow}>
                  <Text style={styles.wishlistHistoryEmoji}>{entry.item?.emoji || '🕘'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.wishlistHistoryText, { color: colors.text }]} numberOfLines={1}>
                      {entry.action === 'added' ? 'Saved' : entry.action === 'removed' ? 'Removed' : 'Viewed'} {entry.item?.title || 'item'}
                    </Text>
                    <Text style={styles.wishlistHistorySub}>{timeAgo(entry.created_at)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

/* ─── Profile View ──────────────────────────────────────── */
function ProfileView() {
  const { colors, dark, setDark, onLogout } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [nameEdit, setNameEdit] = useState('');
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { icon: '📦', label: 'My Orders',         sub: '0 orders' },
    { icon: '📍', label: 'Saved Addresses',    sub: 'Home, Office' },
    { icon: '💳', label: 'Payment Methods',    sub: 'UPI, Card' },
    { icon: '🎟️', label: 'My Coupons',         sub: '0 coupons' },
    { icon: '🔔', label: 'Notifications',      sub: 'Manage alerts' },
    { icon: '❓', label: 'Help & Support',      sub: 'FAQs, Chat with us' },
    { icon: 'ℹ️', label: 'About Topdelz',       sub: 'Version 1.0.0' },
  ];

  useEffect(() => {
    getProfile().then(r => {
      setUser(r.user);
      setNameEdit(r.user.name);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSaveName = async () => {
    if (!nameEdit.trim()) return;
    try {
      const res = await updateProfile(nameEdit, user.email);
      setUser(res.user);
      setEditing(false);
      haptic();
    } catch (e) {
      alert('Failed to update profile');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Gradient profile header */}
      <LinearGradient
        colors={['#7b2fcd', '#c03b8f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.profileHeader}
      >
        <View style={styles.profileAvatarRing}>
          <Text style={{ fontSize: 46 }}>👤</Text>
        </View>
        {editing ? (
          <View style={{ gap: 8, flex: 1, justifyContent: 'center' }}>
            <TextInput
              value={nameEdit}
              onChangeText={setNameEdit}
              style={[styles.profileEditInput, { color: '#fff' }]}
              placeholderTextColor="#fff8"
              placeholder="Your name"
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={styles.profileSaveBtn} onPress={handleSaveName}>
                <Text style={styles.profileSaveBtnText}>Save ✓</Text>
              </Pressable>
              <Pressable style={styles.profileCancelBtn} onPress={() => { setEditing(false); setNameEdit(user?.name || ''); haptic(); }}>
                <Text style={styles.profileCancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.profileName}>{loading ? 'Loading...' : user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || '—'}</Text>
            <Text style={styles.profilePhone}>{user?.mobile ? '+91 ' + user.mobile : '—'}</Text>
            <Pressable style={styles.profileEditBtn} onPress={() => { haptic(); setEditing(true); }}>
              <Text style={styles.profileEditText}>✏️  Edit Profile</Text>
            </Pressable>
          </>
        )}
      </LinearGradient>

      {/* Stats row */}
      <View style={[styles.profileStatsRow, { backgroundColor: colors.statsRow }]}>
        <View style={styles.profileStat}>
          <Text style={[styles.profileStatNum, { color: colors.statNum }]}>{user?.orders_count || 0}</Text>
          <Text style={styles.profileStatLabel}>Orders</Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStat}>
          <Text style={[styles.profileStatNum, { color: colors.statNum }]}>{user?.saved_deals || 0}</Text>
          <Text style={styles.profileStatLabel}>Saved Deals</Text>
        </View>
        <View style={styles.profileStatDivider} />
        <View style={styles.profileStat}>
          <Text style={[styles.profileStatNum, { color: colors.statNum }]}>🔥 3</Text>
          <Text style={styles.profileStatLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Menu items card */}
      <View style={[styles.profileMenuCard, { backgroundColor: colors.menuCard }]}>
        {menuItems.map((item, idx) => (
          <Pressable
            key={idx}
            style={[
              styles.profileMenuItem,
              idx < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.menuBorder },
            ]}
            onPress={haptic}
          >
            <View style={[styles.profileMenuIcon, { backgroundColor: dark ? '#2a1a45' : '#f5f0ff' }]}>
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileMenuLabel, { color: colors.menuLabel }]}>{item.label}</Text>
              <Text style={[styles.profileMenuSub, { color: colors.menuSub }]}>{item.sub}</Text>
            </View>
            <Text style={[styles.profileMenuChevron, { color: dark ? '#555555' : '#cccccc' }]}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* Logout */}
      <Pressable
        style={styles.profileLogoutBtn}
        onPress={async () => {
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user');
          onLogout && onLogout();
        }}
      >
        <Text style={styles.profileLogoutText}>🚪  Log Out</Text>
      </Pressable>

      <Text style={styles.profileFooterNote}>Topdelz · Made with ❤️ in Puducherry</Text>
    </ScrollView>
  );
}

/* ─── Linked Stores Page ────────────────────────────────── */
function LinkedStoresPage({ banner, onBack, onOpenStore }) {
  const { colors } = useContext(ThemeContext);
  const linkedStores = banner?.linked_stores || [];

  return (
    <View style={[styles.fullPageWrap, { backgroundColor: colors.bg }]}> 
      <LinearGradient colors={['#7b2fcd', '#c03b8f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fullPageHeader}> 
        <Pressable style={styles.fullPageBackBtn} onPress={onBack}>
          <Text style={styles.fullPageBackText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.fullPageTitle}>Linked Stores</Text>
        <Text style={styles.fullPageSub}>{banner?.title || 'Deal of the Day'}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 20 }}>
        {linkedStores.length === 0 ? (
          <View style={styles.fullPageEmpty}>
            <Text style={styles.fullPageEmptyIcon}>🏬</Text>
            <Text style={[styles.fullPageEmptyText, { color: colors.subtext }]}>No stores linked for this banner.</Text>
          </View>
        ) : (
          linkedStores.map((s) => (
            <Pressable key={`linked-page-${s.id}`} style={[styles.linkedStoreCard, { backgroundColor: colors.card }]} onPress={() => onOpenStore(s, 'banner-multi-page')}>
              <View style={[styles.linkedStoreIcon, { backgroundColor: s.bg || '#f3f4f6' }]}>
                <Text style={{ fontSize: 28 }}>{s.emoji || '🏬'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkedStoreName, { color: colors.text }]} numberOfLines={1}>{s.name}</Text>
                <Text style={styles.linkedStoreMeta}>{s.dist || '—'} · {s.area || 'Area'} · ⭐ {s.rating || '—'}</Text>
                {s.tag ? <Text style={styles.linkedStoreTag}>{s.tag}</Text> : null}
              </View>
              <Text style={styles.linkedStoreArrow}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ─── Store Details Full Page ───────────────────────────── */
function StoreDetailsPage({ store, onBack }) {
  const { colors } = useContext(ThemeContext);

  return (
    <View style={[styles.fullPageWrap, { backgroundColor: colors.bg }]}> 
      <LinearGradient colors={['#7b2fcd', '#c03b8f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fullPageHeader}> 
        <Pressable style={styles.fullPageBackBtn} onPress={onBack}>
          <Text style={styles.fullPageBackText}>‹ Back</Text>
        </Pressable>
        <View style={[styles.fullPageHeroIcon, { backgroundColor: store.bg || '#fff' }]}>
          <Text style={{ fontSize: 42 }}>{store.emoji || '🏬'}</Text>
        </View>
        <Text style={styles.fullPageTitle}>{store.name}</Text>
        <Text style={styles.fullPageSub}>⭐ {store.rating || '—'} · {store.dist || '—'} · {store.area || 'Area'}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 20 }}>
        <View style={[styles.storeInfoCard, { backgroundColor: colors.card }]}> 
          <Text style={[styles.storeInfoTitle, { color: colors.text }]}>Store Details</Text>
          <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>Tag: {store.tag || '—'}</Text>
          <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>Category: {store.category || '—'}</Text>
          <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>Food Type: {store.foodType || '—'}</Text>
          <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>Cuisine: {store.cuisine || '—'}</Text>
          <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>Phone: {store.phone || '—'}</Text>
          <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>Address: {store.address || '—'}</Text>
          <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>Description: {store.description || '—'}</Text>
          <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>Radius: {store.radiusKm != null ? `${store.radiusKm} km` : '—'}</Text>
          <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>Coordinates: {store.lat && store.lng ? `${store.lat}, ${store.lng}` : '—'}</Text>
          <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>Status: {store.open ? 'Open' : 'Closed'}</Text>
          <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>Interests: {(store.interests || []).length ? store.interests.join(', ') : '—'}</Text>
        </View>

        <View style={[styles.storeInfoCard, { backgroundColor: colors.card }]}> 
          <Text style={[styles.storeInfoTitle, { color: colors.text }]}>Deals</Text>
          {(store.deals || []).length === 0 ? (
            <Text style={[styles.storeInfoRow, { color: colors.subtext }]}>No deals available.</Text>
          ) : (
            (store.deals || []).map((d) => (
              <View key={`detail-deal-${d.id}`} style={styles.storeDealRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.storeDealName, { color: colors.text }]}>{d.name}</Text>
                  <Text style={[styles.storeDealMeta, { color: colors.subtext }]}>{d.price || '—'}</Text>
                </View>
                <View style={styles.storeDealOffBadge}>
                  <Text style={styles.storeDealOff}>{d.off || 'Offer'}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ─── Explore Map View ───────────────────────────────── */
// All stores combined for the map
const ALL_MAP_STORES = [
  ...POPULAR_STORES.map((s) => ({ ...s, source: 'popular' })),
  ...NEARBY_STORES.map((s)  => ({ ...s, source: 'nearby'  })),
];

// Lawspet, Puducherry — "You are here"
const USER_LOCATION = { latitude: 11.9416, longitude: 79.8083 };

const MAP_FILTERS = [
  { id: 'interest', label: '❤️ Your Interests' },
  { id: 'hot',      label: '🔥 Hot Deals' },
  { id: 'deals',    label: '🎁 Deals' },
];

const mapInitialRegion = {
  latitude:      11.9340,
  longitude:     79.8300,
  latitudeDelta:  0.028,
  longitudeDelta: 0.028,
};

function ExploreMapView({ onStorePress, allStores, userLocation, interestMatchedStores = [] }) {
  const { colors, dark } = useContext(ThemeContext);
  const [filter, setFilter]     = useState('interest');
  const [selected, setSelected] = useState(null);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);
  const [lockMapGestures, setLockMapGestures] = useState(false);
  const mapRef = useRef(null);

  // Use real GPS if available, else hardcoded default
  const myLat = userLocation?.lat ?? USER_LOCATION.latitude;
  const myLng = userLocation?.lng ?? USER_LOCATION.longitude;
  const myCity = userLocation?.city ?? 'Lawspet, Puducherry';

  const centerOnMe = () => {
    haptic();
    mapRef.current?.animateToRegion({
      latitude:      myLat,
      longitude:     myLng,
      latitudeDelta:  0.018,
      longitudeDelta: 0.018,
    }, 600);
  };

  const storesRaw = allStores || [
    ...POPULAR_STORES.map((s) => ({ ...s, source: 'popular' })),
    ...NEARBY_STORES.map((s)  => ({ ...s, source: 'nearby'  })),
  ];

  const stores = Array.from(
    new Map(
      storesRaw.map((s) => {
        const key = String(s.id ?? '').trim() || `${String(s.name || '').trim().toLowerCase()}-${s.lat}-${s.lng}`;
        return [key, s];
      })
    ).values()
  );

  const interestIds = new Set((interestMatchedStores || []).map((s) => String(s.id)));
  const interestNames = new Set((interestMatchedStores || []).map((s) => String(s.name || '').trim().toLowerCase()).filter(Boolean));

  const filterStore = (s) => {
    if (filter === 'interest') {
      const byId = interestIds.has(String(s.id));
      const byName = interestNames.has(String(s.name || '').trim().toLowerCase());
      return byId || byName;
    }
    if (filter === 'hot') return s.deals && s.deals.length >= 2;
    if (filter === 'deals') return s.deals && s.deals.length > 0;
    return true;
  };

  const visible = stores.filter(filterStore);
  const activeFilterLabel = MAP_FILTERS.find((f) => f.id === filter)?.label || 'All';

  const focusStore = (s) => {
    haptic();
    setSelected(s);
    mapRef.current?.animateToRegion({
      latitude:      s.lat - 0.003,
      longitude:     s.lng,
      latitudeDelta:  0.010,
      longitudeDelta: 0.010,
    }, 500);
  };

  const renderMap = (mapStyle) => (
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      style={mapStyle}
      initialRegion={{
        latitude:      myLat,
        longitude:     myLng,
        latitudeDelta:  0.028,
        longitudeDelta: 0.028,
      }}
      showsUserLocation={!!userLocation}
      showsMyLocationButton={false}
      showsCompass
      showsScale
      scrollEnabled={!lockMapGestures}
      zoomEnabled={!lockMapGestures}
      rotateEnabled={!lockMapGestures}
      pitchEnabled={!lockMapGestures}
      userInterfaceStyle={dark ? 'dark' : 'light'}
    >
      {/* "You" marker — only shown when no native blue dot (i.e. location denied) */}
      {!userLocation && (
        <Marker
          coordinate={{ latitude: myLat, longitude: myLng }}
          title="You are here"
          description={myCity}
          pinColor="#7b2fcd"
        />
      )}

      {/* Store markers */}
      {visible.map((s) => (
        <Marker
          key={`${s.source}-${s.id}`}
          coordinate={{ latitude: s.lat, longitude: s.lng }}
          onPress={() => focusStore(s)}
        >
          <View style={[
            styles.mapMarkerBubble,
            { backgroundColor: s.open ? '#7b2fcd' : '#9e9e9e' },
            selected?.id === s.id && selected?.source === s.source && styles.mapMarkerSelected,
          ]}>
            <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
          </View>

          <Callout tooltip onPress={() => onStorePress(s)}>
            <View style={[styles.mapCallout, { backgroundColor: colors.card }]}>
              <Text style={[styles.mapCalloutName, { color: colors.text }]}>{s.name}</Text>
              <Text style={styles.mapCalloutMeta}>⭐ {s.rating} · {s.dist}</Text>
              <View style={[
                styles.mapCalloutBadge,
                { backgroundColor: s.open ? '#dcfce7' : '#fee2e2' },
              ]}>
                <Text style={{ fontSize: 10, fontFamily: 'Nunito_700Bold', color: s.open ? '#15803d' : '#991b1b' }}>
                  {s.open ? '🟢 Open · Tap for deals' : '🔴 Closed'}
                </Text>
              </View>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );

  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg }, isMapFullScreen && styles.mapFullScreenContainer]}>
      {/* Real MapView */}
      {renderMap(isMapFullScreen ? styles.realMapFullScreen : styles.realMap)}

      {/* Recenter button */}
      <Pressable
        style={[
          styles.recenterBtn,
          isMapFullScreen && styles.recenterBtnFullScreen,
          isMapFullScreen && styles.mapOverlayIconBtn,
        ]}
        onPress={centerOnMe}
      >
        <Text style={[{ fontSize: 20 }, isMapFullScreen && styles.mapOverlayIconText]}>📍</Text>
      </Pressable>

      <Pressable
        style={[
          styles.mapExpandBtn,
          isMapFullScreen && styles.mapExpandBtnFullScreen,
          isMapFullScreen && styles.mapOverlayIconBtn,
        ]}
        onPress={() => { haptic(); setIsMapFullScreen((prev) => !prev); }}
      >
        <Text style={[styles.mapExpandBtnText, isMapFullScreen && styles.mapOverlayIconText]}>{isMapFullScreen ? '✕' : '⤢'}</Text>
      </Pressable>

      {isMapFullScreen && (
        <View style={styles.mapHudCard}>
          <Text style={styles.mapHudTitle}>Explore Map</Text>
          <Text style={styles.mapHudSub}>{visible.length} places · Filter: {activeFilterLabel}</Text>
        </View>
      )}

      {/* Filter chips */}
      <View
        style={[
          styles.mapFilterBar,
          { backgroundColor: colors.card },
          isMapFullScreen && styles.mapFilterBarFullScreen,
        ]}
        onTouchStart={() => setLockMapGestures(true)}
        onTouchEnd={() => setLockMapGestures(false)}
        onTouchCancel={() => setLockMapGestures(false)}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setLockMapGestures(true)}
          onScrollEndDrag={() => setLockMapGestures(false)}
          onMomentumScrollEnd={() => setLockMapGestures(false)}
          contentContainerStyle={[
            { gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
            isMapFullScreen && styles.mapFilterContentFullScreen,
          ]}
        >
          {MAP_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => { haptic(); setFilter(f.id); setSelected(null); }}
              onPressIn={() => setLockMapGestures(true)}
              onPressOut={() => setLockMapGestures(false)}
              style={[
                styles.mapFilterChip,
                { borderColor: filter === f.id ? '#7b2fcd' : (dark ? '#3a3a50' : '#e0e0e0') },
                isMapFullScreen && styles.mapFilterChipFullScreen,
                filter === f.id && styles.mapFilterChipActive,
                isMapFullScreen && filter === f.id && styles.mapFilterChipActiveFullScreen,
              ]}
            >
              <Text style={[
                styles.mapFilterText,
                isMapFullScreen && styles.mapFilterTextFullScreen,
                filter === f.id && styles.mapFilterTextActive,
                isMapFullScreen && filter === f.id && styles.mapFilterTextActiveFullScreen,
              ]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Store list below */}
      {!isMapFullScreen && (
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.bg }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 24 }}
        >
          <Text style={[styles.mapListTitle, { color: colors.text }]}> 
            {visible.length} store{visible.length !== 1 ? 's' : ''} nearby
          </Text>

          {visible.map((s) => (
            <Pressable
              key={`${s.source}-${s.id}`}
              style={[
                styles.mapListCard,
                { backgroundColor: colors.card },
                selected?.id === s.id && selected?.source === s.source && styles.mapListCardSelected,
              ]}
              onPress={() => focusStore(s)}
              onLongPress={() => onStorePress(s)}
            >
              <View style={[styles.mapListIconBox, { backgroundColor: s.bg }]}> 
                <Text style={{ fontSize: 32 }}>{s.emoji}</Text>
                {!s.open && (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 16, justifyContent: 'center', alignItems: 'center' }]}> 
                    <Text style={{ fontSize: 10, fontFamily: 'Nunito_700Bold', color: '#fff' }}>Closed</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.mapListName, { color: colors.text }]} numberOfLines={1}>{s.name}</Text>
                  <View style={[styles.mapListBadge, { backgroundColor: s.open ? '#dcfce7' : '#fee2e2' }]}> 
                    <Text style={{ fontSize: 9, fontFamily: 'Nunito_700Bold', color: s.open ? '#15803d' : '#991b1b' }}>
                      {s.open ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.mapListMeta, { color: colors.subtext }]}>⭐ {s.rating} · {s.dist} · {s.area}</Text>
                <View style={styles.mapListTagRow}>
                  <View style={[styles.mapListTag, { backgroundColor: dark ? '#2a1a45' : '#f0ebff' }]}>
                    <Text style={[styles.mapListTagText, { color: dark ? '#c4b5fd' : '#7b2fcd' }]}>{s.tag}</Text>
                  </View>
                  {s.deals?.length > 0 && (
                    <Text style={styles.mapListDealsHint}>⚡ {s.deals.length} deal{s.deals.length !== 1 ? 's' : ''}</Text>
                  )}
                </View>
              </View>

              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={[styles.mapListChevron, { color: colors.subtext }]}>›</Text>
                <Text style={{ fontSize: 9, fontFamily: 'Nunito_400Regular', color: '#aaa' }}>Hold for{`\n`}deals</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/* ─── Walkthrough Overlay ───────────────────────────────── */
const WALKTHROUGH_STEPS = [
  {
    icon: '🔍',
    title: 'Search Anything',
    body: 'Find stores, dishes, and deals near you instantly.',
    arrowDir: 'up',
    tipTop: 200,
  },
  {
    icon: '🔔',
    title: 'Flash Deal Alerts',
    body: 'Tap the bell to get instant notifications on the hottest deals.',
    arrowDir: 'up',
    tipTop: 190,
  },
  {
    icon: '⚡',
    title: 'Flash Deals',
    body: 'These expire soon — grab them before the timer hits zero!',
    arrowDir: 'down',
    tipTop: 340,
  },
  {
    icon: '🏪',
    title: 'Tap Any Store',
    body: 'Store cards open a deal sheet with today\'s best offers inside.',
    arrowDir: 'down',
    tipTop: 390,
  },
  {
    icon: '🗂️',
    title: 'Navigate Tabs',
    body: 'Switch between Home, Wishlist, and Profile at the bottom.',
    arrowDir: 'down',
    tipTop: 480,
  },
];

function WalkthroughOverlay({ onDone }) {
  const [step, setStep] = useState(0);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => { animateIn(); }, [step]);

  const next = () => {
    haptic();
    if (step < WALKTHROUGH_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      onDone();
    }
  };

  const skip = () => { haptic(); onDone(); };

  const s = WALKTHROUGH_STEPS[step];
  const isLast = step === WALKTHROUGH_STEPS.length - 1;

  return (
    <Modal transparent visible animationType="none">
      <View style={styles.wtOverlay}>
        {/* Tip bubble */}
        <Animated.View
          style={[
            styles.wtCard,
            { top: s.tipTop, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Arrow up */}
          {s.arrowDir === 'up' && <View style={styles.wtArrowUp} />}

          {/* Content */}
          <View style={styles.wtCardInner}>
            <View style={styles.wtIconBubble}>
              <Text style={{ fontSize: 28 }}>{s.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.wtTitle}>{s.title}</Text>
              <Text style={styles.wtBody}>{s.body}</Text>
            </View>
          </View>

          {/* Arrow down */}
          {s.arrowDir === 'down' && <View style={styles.wtArrowDown} />}

          {/* Footer */}
          <View style={styles.wtFooter}>
            {/* Step dots */}
            <View style={styles.wtDots}>
              {WALKTHROUGH_STEPS.map((_, i) => (
                <View key={i} style={[styles.wtDot, i === step && styles.wtDotActive]} />
              ))}
            </View>
            <View style={styles.wtBtns}>
              <Pressable onPress={skip} style={styles.wtSkipBtn}>
                <Text style={styles.wtSkipText}>Skip</Text>
              </Pressable>
              <Pressable onPress={next}>
                <LinearGradient
                  colors={['#7b2fcd', '#c03b8f']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.wtNextBtn}
                >
                  <Text style={styles.wtNextText}>{isLast ? 'Done ✓' : 'Next →'}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ─── Main Screen ───────────────────────────────────────── */
export default function HomeScreen({ onLogout }) {
  const [activeTab, setActiveTab] = useState('home');
  const [activeCategory, setActiveCategory] = useState('dine');
  const [activeMealTag, setActiveMealTag] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);  // Default to false
  const [darkMode, setDarkMode] = useState(false);
  const themeColors = darkMode ? THEMES.dark : THEMES.light;
  const countdown = useCountdown(23, 59);

  // ── Check if user already saw walkthrough on first mount ──
  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem('walkthrough_done');
      if (!seen) {
        setShowWalkthrough(true);
      }
    })();
  }, []);

  // ── Location + Home data from API ──
  const [userLocation, setUserLocation] = useState(null);  // { lat, lng, city }
  const [locLoading, setLocLoading]     = useState(false);
  const watcherRef      = useRef(null);   // Location.watchPositionAsync subscription
  const lastLatLngRef   = useRef(null);   // last coords sent to API (avoid redundant calls)
  const [banners, setBanners]           = useState([]);
  const [flashDeals, setFlashDeals]     = useState([]);
  const [dealCards, setDealCards]       = useState([]);
  const [popularStores, setPopularStores] = useState([]);
  const [nearbyStores, setNearbyStores]   = useState([]);
  const [interestMatchedStores, setInterestMatchedStores] = useState([]);
  const [serviceability, setServiceability] = useState({ in_service_area: true, service_area_name: 'Pondicherry', areas: [] });
  const [bannerStorePicker, setBannerStorePicker] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistHistory, setWishlistHistory] = useState([]);
  const [wishlistMap, setWishlistMap] = useState({});

  const normalizeWishlistItems = useCallback((rows = []) => {
    return rows.map((row) => {
      const item = row.item || {};
      const id = `${row.item_type}:${row.item_id}`;
      const category = row.item_type === 'store' ? 'food' : 'deal';

      return {
        id,
        rawId: row.item_id,
        item_type: row.item_type,
        name: item.title || 'Offer',
        emoji: item.emoji || '🎁',
        tag: item.subtitle || row.item_type,
        off: item.off_text || 'Saved',
        price: item.price || '—',
        image_url: item.image_url || null,
        bg: [item.bg_color || '#7b2fcd', '#c03b8f'],
        saved: timeAgo(row.saved_at),
        category,
      };
    });
  }, []);

  const syncWishlistData = useCallback(async () => {
    try {
      const [wishlistRes, historyRes] = await Promise.all([getWishlist(), getWishlistHistory()]);
      const normalized = normalizeWishlistItems(wishlistRes.data || []);

      setWishlistItems(normalized);
      setWishlistHistory(historyRes.data || []);

      const map = {};
      normalized.forEach((item) => {
        map[item.id] = true;
      });
      setWishlistMap(map);
    } catch (_) {
      // Ignore when unauthenticated or network is unavailable.
    }
  }, [normalizeWishlistItems]);

  const toggleWishlist = useCallback(async (itemType, item) => {
    const key = `${itemType}:${item.id}`;
    const isSaved = !!wishlistMap[key];

    try {
      if (isSaved) {
        await removeFromWishlist(itemType, item.id);
      } else {
        await addToWishlist(itemType, item.id);
      }

      await syncWishlistData();
      haptic();
    } catch (_) {
      // Keep UX non-blocking on API failure.
    }
  }, [wishlistMap, syncWishlistData]);

  const removeWishlistItem = useCallback(async (compositeId) => {
    const [itemType, rawId] = String(compositeId).split(':');
    if (!itemType || !rawId) return;

    try {
      await removeFromWishlist(itemType, Number(rawId));
      await syncWishlistData();
    } catch (_) {
      // Ignore remove failures in offline mode.
    }
  }, [syncWishlistData]);

  const logOfferEvent = useCallback((itemType, itemId, action, extra = {}) => {
    trackOfferEvent(itemType, Number(itemId), action, extra).catch(() => {
      // Keep UX smooth even if analytics call fails.
    });
  }, []);

  const openStore = useCallback((store, source = 'home') => {
    haptic();
    setSelectedStore(store);
    logOfferEvent('store', Number(store.id), 'opened', {
      source,
      distance_km: store?.distKm ?? null,
    });
  }, [logOfferEvent]);

  const applyHomeData = (data, lat, lng) => {
    setServiceability(data?.serviceability || { in_service_area: true, service_area_name: 'Pondicherry', areas: [] });

    const normalize = (s, idx = 0) => {
      const src = s?.store || s || {};
      const safeId = src.id ?? s?.store_id ?? `${src.name || 'store'}-${idx}`;
      return {
        id: String(safeId),
        name: src.name,
        emoji: src.emoji,
        bg: src.bg_color || src.bg,
        area: src.area,
        dist: src.dist_display || src.distance,
        distKm: src.user_distance_km ?? null,
        rating: src.rating,
        tag: src.tag,
        category: src.category,
        foodType: src.food_type,
        cuisine: src.cuisine,
        phone: src.phone,
        address: src.address,
        description: src.description,
        radiusKm: src.radius_km,
        type: src.type,
        interests: (src.interests || []).map((i) => i.name).filter(Boolean),
        open: src.is_open,
        lat: src.lat,
        lng: src.lng,
        deals: (src.deals || []).map((d) => ({ id: String(d.id), name: d.name, off: d.off_text, price: d.price })),
      };
    };

    if (Array.isArray(data.banners)) {
      setBanners(data.banners.map((b) => ({
        id: String(b.id),
        title: b.title,
        sub: b.sub,
        badge: b.badge,
        image_url: b.image_url || null,
        cta_enabled: !!b.cta_enabled,
        cta_text: b.cta_text || 'Order now →',
        fine_print: b.fine_print || '*Valid on orders above ₹200',
        colors: [b.color_start, b.color_end],
        emojis: [b.emoji_1, b.emoji_2, b.emoji_3].filter(Boolean),
        linked_stores: (b.linked_stores || []).map((s, idx) => normalize(s, idx)).filter((s) => s.name),
      })));
    } else {
      setBanners([]);
    }

    if (data.flash_deals?.length) {
      setFlashDeals(data.flash_deals.map(d => ({ id: String(d.id), name: d.name, off: d.off_text, emoji: d.emoji, image_url: d.image_url || null, bg: [d.bg_start, d.bg_end] })));
    } else {
      setFlashDeals([]);
    }

    if (data.deal_cards?.length) {
      setDealCards(data.deal_cards.map(c => ({ id: String(c.id), title: c.title, desc: c.description, emoji: c.emoji, image_url: c.image_url || null, color: [c.color_start, c.color_end] })));
    } else {
      setDealCards([]);
    }

    const interestRaw =
      data.interest_matched_stores ||
      data.interest_stores ||
      data.stores_by_interest ||
      [];

    if (Array.isArray(interestRaw) && interestRaw.length) {
      const interestStores = interestRaw
        .map((s, idx) => normalize(s, idx))
        .filter((s) => s.name);
      setInterestMatchedStores(interestStores);
    } else {
      setInterestMatchedStores([]);
    }

    if (data.stores?.length) {
      setPopularStores(data.stores.filter(s => s.type === 'popular' || s.type === 'both').map((s, idx) => normalize(s, idx)));
      const nearby = data.stores
        .filter(s => s.type === 'nearby' || s.type === 'both')
        .map((s, idx) => normalize(s, idx));
      setNearbyStores(nearby);
    } else {
      setPopularStores([]);
      setNearbyStores([]);
    }
  };

  const showNotServiceable = serviceability?.in_service_area === false;

  // Called every time watchPositionAsync fires (or on first fix)
  const handleNewPosition = async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // Only call the API if the user moved more than ~30 m from the last call
    const last = lastLatLngRef.current;
    const movedEnough = !last ||
      Math.abs(lat - last.lat) > 0.0003 ||
      Math.abs(lng - last.lng) > 0.0003;

    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      setUserLocation({
        lat, lng,
        city:  place?.city || place?.district || place?.subregion || 'Your Location',
        state: place?.region || '',
      });
    } catch (_) {
      setUserLocation(prev => prev ? { ...prev, lat, lng } : { lat, lng, city: 'Your Location', state: '' });
    }

    if (movedEnough) {
      lastLatLngRef.current = { lat, lng };
      getHomeData(lat, lng).then(data => applyHomeData(data, lat, lng)).catch(() => {});
    }
  };

  // Start continuous GPS watcher — restartable (called on mount and on manual refresh tap)
  const startLocationWatch = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocLoading(false); return; }

      // Get an immediate fix first so the UI isn't blank
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await handleNewPosition(pos);
      setLocLoading(false);

      // Then start the realtime watcher (fires every 30 s or every 50 m of movement)
      if (watcherRef.current) watcherRef.current.remove();
      watcherRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 30000 },
        (newPos) => handleNewPosition(newPos)
      );
    } catch (_) { setLocLoading(false); }
  };

  // Manual pull-to-refresh: force re-fetch from API using last known coords
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const last = lastLatLngRef.current;
      if (last) {
        const data = await getHomeData(last.lat, last.lng);
        applyHomeData(data, last.lat, last.lng);
      } else {
        await startLocationWatch();
      }
      await syncWishlistData();
    } catch (_) {}
    setRefreshing(false);
  }, [syncWishlistData]);

  useEffect(() => {
    startLocationWatch();
    syncWishlistData();
    // Poll every 30s so admin panel changes reflect automatically
    const pollInterval = setInterval(async () => {
      const last = lastLatLngRef.current;
      if (last) {
        try {
          const data = await getHomeData(last.lat, last.lng);
          applyHomeData(data, last.lat, last.lng);
        } catch (_) {}
      }
    }, 30000);
    return () => {
      if (watcherRef.current) watcherRef.current.remove();
      clearInterval(pollInterval);
    };
  }, [syncWishlistData]);

  return (
    <ThemeContext.Provider value={{ colors: themeColors, dark: darkMode, setDark: setDarkMode, onLogout }}>
    {selectedStore ? (
      <StoreDetailsPage store={selectedStore} onBack={() => setSelectedStore(null)} />
    ) : bannerStorePicker ? (
      <LinkedStoresPage
        banner={bannerStorePicker}
        onBack={() => setBannerStorePicker(null)}
        onOpenStore={(store, source) => openStore(store, source)}
      />
    ) : (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar style="light" />

      {/* ── Gradient Top Bar ── */}
      <LinearGradient
        colors={['#7b2fcd', '#c03b8f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBar}
      >
        <View style={styles.locationRow}>
          <Pressable onPress={() => { haptic(); startLocationWatch(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.locPin}>{locLoading ? '⏳' : '📍'}</Text>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.locCity}>{userLocation?.city ?? (locLoading ? 'Locating…' : 'Tap to locate')}</Text>
                <Text style={styles.locChevron}>▾</Text>
              </View>
              <Text style={styles.locState}>{userLocation?.state ?? ''}</Text>
            </View>
          </Pressable>
        </View>
        <View style={styles.topRightRow}>
          <Pressable style={styles.bellWrap} onPress={() => { haptic(); setShowNotifs(true); }}>
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.bellBadge} />
          </Pressable>
          <Pressable style={styles.avatarCircle} onPress={() => { haptic(); setActiveTab('profile'); }}>
            <Text style={{ fontSize: 16 }}>👤</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* ── Search (floats below gradient) ── */}
      {activeTab !== 'profile' && activeTab !== 'wishlist' && activeTab !== 'explore' && activeTab !== 'offers' && (
      <View style={[styles.searchOuter, { backgroundColor: themeColors.searchBg, borderBottomColor: themeColors.border }]}>
        <View style={[styles.searchWrap, { backgroundColor: themeColors.searchInner, borderColor: themeColors.searchBorder }]}>
          <Text style={styles.searchIconText}>🔍</Text>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search stores, dishes, offers..."
            placeholderTextColor="#aaaaaa"
            style={[styles.searchInput, { color: themeColors.text }]}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => setSearchText('')}>
              <Text style={{ fontSize: 16, color: '#aaa' }}>✕</Text>
            </Pressable>
          )}
        </View>
        <Pressable style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </Pressable>
      </View>
      )}

      {/* ── Non-home Tabs ── */}
      {activeTab === 'wishlist' && (
        <WishlistView
          items={wishlistItems}
          history={wishlistHistory}
          onRemove={removeWishlistItem}
        />
      )}
      {activeTab === 'profile' && <ProfileView />}
      {(activeTab === 'explore' || activeTab === 'offers') && (
        <ExploreMapView
          onStorePress={(s) => openStore(s, 'explore-map')}
          allStores={[
            ...popularStores.map((s) => ({ ...s, source: 'popular' })),
            ...nearbyStores.map((s) => ({ ...s, source: 'nearby'  })),
            ...interestMatchedStores.map((s) => ({ ...s, source: s.source || 'interest' })),
          ]}
          userLocation={userLocation}
          interestMatchedStores={interestMatchedStores}
        />
      )}

      {/* ── Scrollable Content ── */}
      {activeTab !== 'profile' && activeTab !== 'wishlist' && activeTab !== 'explore' && activeTab !== 'offers' && (
      <ScrollView
        style={{ flex: 1, backgroundColor: themeColors.bg }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7b2fcd', '#c03b8f']}
            tintColor="#7b2fcd"
          />
        }
      >
        {showNotServiceable ? (
          <View style={styles.notServiceableCard}>
            <Text style={styles.notServiceableEmoji}>📍</Text>
            <Text style={styles.notServiceableTitle}>Currently Not Serviceable</Text>
            <Text style={styles.notServiceableText}>
              Topdelz currently serves only configured service areas.
            </Text>
            {Array.isArray(serviceability?.areas) && serviceability.areas.length > 0 ? (
              <Text style={styles.notServiceableMeta}>
                Service areas: {serviceability.areas.map((a) => a.name).filter(Boolean).join(', ')}
              </Text>
            ) : null}
            {serviceability?.distance_from_center_km != null && serviceability?.radius_km != null ? (
              <Text style={styles.notServiceableMeta}>
                You are {Math.round(serviceability.distance_from_center_km)} km away. Service radius: {Math.round(serviceability.radius_km)} km.
              </Text>
            ) : null}
            <Pressable style={styles.notServiceableBtn} onPress={() => startLocationWatch()}>
              <Text style={styles.notServiceableBtnText}>Retry Location</Text>
            </Pressable>
          </View>
        ) : (
          <>
        {/* Greeting Strip */}
        <LinearGradient
          colors={['#ede9fe', '#fce7f3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.greetingStrip}
        >
          <View>
            <Text style={styles.greetingHi}>👋 Welcome back!</Text>
            <Text style={styles.greetingTagline}>Best deals near Lawspet today</Text>
          </View>
          <View style={styles.greetingStreakBox}>
            <Text style={{ fontSize: 26 }}>🔥</Text>
            <Text style={styles.greetingStreakNum}>3</Text>
            <Text style={styles.greetingStreakLabel}>Day Streak</Text>
          </View>
        </LinearGradient>

        {/* Categories */}
        <View style={[styles.categorySection, { backgroundColor: themeColors.card }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <CategoryItem
                key={cat.id}
                item={cat}
                active={activeCategory === cat.id}
                onPress={() => setActiveCategory(cat.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Deal of the Day Banner */}
        <SectionHeader title="Deal of the Day" subtitle="Based on your Interest" accent />
        <BannerSlider
          banners={banners}
          onOpenStore={(store) => openStore(store, 'banner-direct')}
          onOpenMultipleStores={(banner) => setBannerStorePicker(banner)}
        />

        {/* Special Offer Strip */}
        <SpecialOfferStrip />

        {/* Flash Deals */}
        <SectionHeader title="⚡ Flash Deals" subtitle={`Ends in ${countdown}`} accent />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 12, paddingBottom: 4 }}>
          {flashDeals.map((item) => (
            <FlashDealCard
              key={item.id}
              item={item}
              countdown={countdown}
              isSaved={!!wishlistMap[`flash_deal:${item.id}`]}
              onToggleWishlist={toggleWishlist}
              onOpen={(deal) => {
                haptic();
                logOfferEvent('flash_deal', Number(deal.id), 'viewed', { source: 'home-flash' });
              }}
            />
          ))}
        </ScrollView>

        {/* Featured Deals */}
        <SectionHeader title="Featured Deals" subtitle="Offers You Will Love" accent />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 12, paddingBottom: 4 }}>
          {dealCards.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              isSaved={!!wishlistMap[`deal_card:${deal.id}`]}
              onToggleWishlist={toggleWishlist}
              onOpen={(card) => {
                haptic();
                logOfferEvent('deal_card', Number(card.id), 'viewed', { source: 'home-featured' });
              }}
            />
          ))}
        </ScrollView>

        {/* Interest Matched Stores */}
        {interestMatchedStores.length > 0 && (
          <>
            <SectionHeader title="Based on Your Interests" subtitle="Stores matching your preferences" accent />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 14, gap: 14, paddingBottom: 4 }}>
              {interestMatchedStores.map((s) => (
                <PopularCard
                  key={`interest-${s.id}`}
                  store={s}
                  onPress={() => openStore(s, 'interest-matched')}
                  isSaved={!!wishlistMap[`store:${s.id}`]}
                  onToggleWishlist={toggleWishlist}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Need More Deals – meal tag filter */}
        <View style={[styles.moreDealsSection, { backgroundColor: themeColors.mealSection }]}>
          <Text style={[styles.moreDealsTitle, { color: themeColors.mealTitle }]}>Need more deals on Monday?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}>
            {MEAL_TAGS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setActiveMealTag(t.id)}
                style={[
                  styles.mealTag,
                  { backgroundColor: themeColors.mealTagBg, borderColor: themeColors.mealTagBorder },
                  activeMealTag === t.id && styles.mealTagActive,
                ]}
              >
                <Text style={[
                  styles.mealTagText,
                  { color: themeColors.mealTagText },
                  activeMealTag === t.id && styles.mealTagTextActive,
                ]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Popular in City */}
        <SectionHeader title="Popular in City" subtitle="Top rated stores near you" accent />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 14, paddingBottom: 4 }}>
          {popularStores.map((s) => (
            <PopularCard
              key={s.id}
              store={s}
              onPress={() => openStore(s, 'popular')}
              isSaved={!!wishlistMap[`store:${s.id}`]}
              onToggleWishlist={toggleWishlist}
            />
          ))}
        </ScrollView>

        {/* Close to You */}
        <SectionHeader title="Close to you" subtitle="Within 5 Km" accent />
        <View style={styles.nearbyGrid}>
          {nearbyStores.map((s) => (
            <NearbyCard
              key={s.id}
              store={s}
              onPress={() => openStore(s, 'nearby')}
              isSaved={!!wishlistMap[`store:${s.id}`]}
              onToggleWishlist={toggleWishlist}
            />
          ))}
        </View>

        {/* Footer */}
        <LinearGradient colors={['#f0e9ff', '#fce4ec']} style={styles.footerWrap}>
          <Text style={styles.footerTagline}>Good to know Local Deals</Text>
          <Text style={styles.footerHashtag}>#supportlocal</Text>
          <Image source={require('../assets/logo.png')} style={styles.footerLogo} resizeMode="contain" />
          <Text style={styles.footerCredit}>Crafted with love in Puducherry, India 🇮🇳</Text>
        </LinearGradient>
          </>
        )}
      </ScrollView>
      )}

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {showNotifs && (
        <NotificationsPanel onClose={() => setShowNotifs(false)} />
      )}

      {showWalkthrough && (
        <WalkthroughOverlay onDone={async () => {
          await AsyncStorage.setItem('walkthrough_done', 'true');
          setShowWalkthrough(false);
        }} />
      )}
    </View>
    )}
    </ThemeContext.Provider>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  notServiceableCard: {
    marginHorizontal: 14,
    marginTop: 24,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    alignItems: 'center',
  },
  notServiceableEmoji: { fontSize: 34, marginBottom: 8 },
  notServiceableTitle: { fontSize: 18, color: '#0f172a', fontFamily: 'Nunito_800ExtraBold', textAlign: 'center' },
  notServiceableText: { fontSize: 13, color: '#475569', fontFamily: 'Nunito_600SemiBold', textAlign: 'center', marginTop: 8 },
  notServiceableMeta: { fontSize: 12, color: '#64748b', fontFamily: 'Nunito_600SemiBold', textAlign: 'center', marginTop: 8 },
  notServiceableBtn: {
    marginTop: 12,
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  notServiceableBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Nunito_700Bold' },

  /* Full-page navigation views */
  fullPageWrap: { flex: 1 },
  fullPageHeader: { paddingTop: 54, paddingHorizontal: 16, paddingBottom: 14 },
  fullPageBackBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  fullPageBackText: { color: '#fff', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  fullPageTitle: { color: '#fff', fontSize: 22, fontFamily: 'Nunito_800ExtraBold' },
  fullPageSub: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  fullPageHeroIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  fullPageEmpty: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  fullPageEmptyIcon: { fontSize: 32, marginBottom: 8 },
  fullPageEmptyText: { fontSize: 14, fontFamily: 'Nunito_600SemiBold' },
  linkedStoreCard: {
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#eef2ff',
  },
  linkedStoreIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkedStoreName: { fontSize: 15, fontFamily: 'Nunito_700Bold' },
  linkedStoreMeta: { fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
  linkedStoreTag: { fontSize: 11, color: '#7b2fcd', marginTop: 4, fontFamily: 'Nunito_700Bold' },
  linkedStoreArrow: { fontSize: 24, color: '#7b2fcd', fontFamily: 'Nunito_800ExtraBold' },
  storeInfoCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eef2ff',
  },
  storeInfoTitle: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', marginBottom: 8 },
  storeInfoRow: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', marginBottom: 5, lineHeight: 19 },
  storeDealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 10,
  },
  storeDealName: { fontSize: 14, fontFamily: 'Nunito_700Bold' },
  storeDealMeta: { fontSize: 12, marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
  storeDealOffBadge: { backgroundColor: '#ede9fe', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  storeDealOff: { color: '#6d28d9', fontSize: 11, fontFamily: 'Nunito_800ExtraBold' },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locPin: { fontSize: 20, color: '#ffffff' },
  locCity: { fontSize: 17, fontFamily: 'Nunito_700Bold', color: '#ffffff' },
  locChevron: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  locState: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.75)' },
  topRightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellWrap: { position: 'relative' },
  bellIcon: { fontSize: 22 },
  bellBadge: {
    position: 'absolute', top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#e8574a', borderWidth: 1.5, borderColor: '#9c3fd6',
  },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },

  /* Search row */
  searchOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eeeeee',
    gap: 8,
  },
  searchIconText: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Nunito_400Regular', color: '#333333' },
  filterBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#f0ebff',
    justifyContent: 'center', alignItems: 'center',
  },
  filterIcon: { fontSize: 18 },

  /* Categories */
  categorySection: { backgroundColor: '#ffffff', paddingVertical: 8 },
  categoryRow: { paddingHorizontal: 10, gap: 4 },
  catItem: { alignItems: 'center', width: 72, paddingVertical: 6 },
  catIconBox: {
    width: 58, height: 58, borderRadius: 29,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  catEmoji: { fontSize: 26 },
  catLabel: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: '#444444', textAlign: 'center', lineHeight: 14 },
  catActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7b2fcd', marginTop: 3 },

  /* Section headers */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 20, marginBottom: 10,
  },
  accentBar: { width: 4, height: 20, borderRadius: 2, backgroundColor: '#7b2fcd' },
  sectionTitle: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: '#111111' },
  sectionSubtitle: { fontSize: 11.5, fontFamily: 'Nunito_400Regular', color: '#888888', marginTop: 1 },
  viewAll: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#7b2fcd' },

  /* Hero Banner */
  heroBanner: {
    width: width - 28,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 160,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10,
  },
  heroBadgeText: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: '#ffffff' },
  heroOffer: { fontSize: 23, fontFamily: 'Nunito_800ExtraBold', color: '#ffffff', lineHeight: 28, marginBottom: 4 },
  heroSub: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  heroBtn: {
    backgroundColor: '#ffffff', alignSelf: 'flex-start',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 6,
  },
  heroBtnText: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#1a1060' },
  heroFine: { fontSize: 10, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.6)' },
  bannerStoreOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 18,
  },
  bannerStoreSheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bannerStoreTitle: { fontSize: 18, color: '#111827', fontFamily: 'Nunito_800ExtraBold' },
  bannerStoreSub: { fontSize: 13, color: '#64748b', marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
  bannerStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eef2ff',
    padding: 10,
    backgroundColor: '#f8fafc',
  },
  bannerStoreEmojiWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerStoreName: { color: '#0f172a', fontSize: 14, fontFamily: 'Nunito_700Bold' },
  bannerStoreMeta: { color: '#94a3b8', fontSize: 12, marginTop: 2, fontFamily: 'Nunito_600SemiBold' },
  bannerStoreArrow: { color: '#6366f1', fontSize: 22, fontFamily: 'Nunito_800ExtraBold' },
  bannerStoreClose: {
    marginTop: 12,
    alignSelf: 'flex-end',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bannerStoreCloseText: { color: '#fff', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  heroEmojisCol: { alignItems: 'center', gap: 2, marginLeft: 10 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#dddddd' },
  dotActive: { width: 18, backgroundColor: '#7b2fcd' },

  /* Flash deals */
  flashCard: {
    width: 140, borderRadius: 16, padding: 14,
    alignItems: 'flex-start', gap: 4,
  },
  flashEmoji: { fontSize: 34, marginBottom: 4 },
  flashOff: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: '#ffffff' },
  flashName: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: 'rgba(255,255,255,0.9)' },
  flashTimerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  flashTimerIcon: { fontSize: 11 },
  flashTimer: { fontSize: 12, fontFamily: 'Nunito_700Bold', color: '#ffffff' },

  /* Featured deal cards */
  dealCard: { width: 155, borderRadius: 16, padding: 16, justifyContent: 'space-between', minHeight: 175 },
  dealEmoji: { fontSize: 32, marginBottom: 6 },
  dealSubLabel: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.8)' },
  dealTitle: { fontSize: 17, fontFamily: 'Nunito_800ExtraBold', color: '#ffffff', marginBottom: 3 },
  dealDesc: { fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: 'rgba(255,255,255,0.9)', marginBottom: 10 },
  exploreBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start',
  },
  exploreBtnText: { fontSize: 12, fontFamily: 'Nunito_700Bold', color: '#ffffff' },

  /* More Deals / meal tags */
  moreDealsSection: {
    marginHorizontal: 14, marginTop: 20,
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    gap: 12,
  },
  moreDealsTitle: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: '#111111' },
  mealTag: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fafafa',
  },
  mealTagActive: { borderColor: '#7b2fcd', backgroundColor: '#f0ebff' },
  mealTagText: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: '#555555' },
  mealTagTextActive: { color: '#7b2fcd', fontFamily: 'Nunito_700Bold' },

  /* Popular in City */
  popularCard: {
    width: 148, backgroundColor: '#ffffff', borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  popularImgBox: { width: '100%', height: 100, justifyContent: 'center', alignItems: 'center' },
  popularEmoji: { fontSize: 44 },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center',
  },
  closedText: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#ffffff' },
  popularInfo: { padding: 10 },
  popularName: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#111111', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  starIcon: { fontSize: 11 },
  ratingVal: { fontSize: 12, fontFamily: 'Nunito_700Bold', color: '#111111' },
  popularDot: { fontSize: 12, color: '#aaaaaa' },
  popularDist: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: '#888888' },
  tagPill: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  tagOpen: { backgroundColor: '#dcfce7' },
  tagClosed: { backgroundColor: '#fee2e2' },
  tagPillText: { fontSize: 10, fontFamily: 'Nunito_700Bold' },

  /* Close to You */
  nearbyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 4,
  },
  nearbyCard: {
    width: (width - 40) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  nearbyImgBox: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  nearbyEmoji: { fontSize: 46 },
  nearbyClosedBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearbyClosedText: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#ffffff' },
  nearbyInfo: { padding: 10 },
  nearbyName: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#111111', marginBottom: 2 },
  nearbyDist: { fontSize: 10, fontFamily: 'Nunito_400Regular', color: '#888888', marginBottom: 6 },
  nearbyTagPill: {
    backgroundColor: '#f0ebff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  nearbyTag: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: '#7b2fcd' },
  nearbyRatingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#15803d',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  nearbyRatingText: { fontSize: 10, fontFamily: 'Nunito_700Bold', color: '#ffffff' },

  /* Footer */
  footerWrap: { marginTop: 20, paddingVertical: 30, paddingHorizontal: 20, alignItems: 'center', gap: 6 },
  footerTagline: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: '#7b2fcd', textAlign: 'center' },
  footerHashtag: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: '#a855f7' },
  footerLogo: { width: 160, height: 50, marginVertical: 8 },
  footerCredit: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: '#aaaaaa', textAlign: 'center' },

  /* Greeting Strip */
  greetingStrip: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingHi: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold', color: '#4c1d95' },
  greetingTagline: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: '#7c3aed', marginTop: 2 },
  greetingStreakBox: { alignItems: 'center' },
  greetingStreakNum: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: '#7b2fcd' },
  greetingStreakLabel: { fontSize: 10, fontFamily: 'Nunito_600SemiBold', color: '#888888' },

  /* Special Offer Strip */
  offerStrip: {
    marginHorizontal: 14,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerStripBadge: {
    fontSize: 10,
    fontFamily: 'Nunito_700Bold',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  offerStripTitle: {
    fontSize: 19,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#ffffff',
    marginBottom: 4,
  },
  offerStripSub: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.85)',
  },

  /* Tab Bar */
  tabBar: {
    flexDirection: 'row', backgroundColor: '#ffffff',
    borderTopWidth: 1, borderTopColor: '#eeeeee',
    paddingBottom: 28, paddingTop: 8,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 12,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabActivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  tabEmojiActive: { fontSize: 15, color: '#ffffff' },
  tabLabelActive: { fontSize: 12, fontFamily: 'Nunito_700Bold', color: '#ffffff' },
  tabEmoji: { fontSize: 22, color: '#888888' },
  tabLabel: { fontSize: 10, fontFamily: 'Nunito_400Regular', color: '#999999' },

  /* Store Detail Sheet */
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 25,
  },
  sheetHandle: {
    width: 42, height: 5, borderRadius: 3,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center', marginBottom: 16,
  },
  sheetCloseBtn: {
    position: 'absolute', top: 20, right: 20,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center', alignItems: 'center',
  },
  sheetCloseBtnText: { fontSize: 14, color: '#666666' },
  sheetIconBox: {
    width: 96, height: 96, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 12,
  },
  sheetStoreName: {
    fontSize: 22, fontFamily: 'Nunito_800ExtraBold',
    color: '#111111', textAlign: 'center', marginBottom: 6,
  },
  sheetMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 },
  sheetMetaText: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: '#555555' },
  sheetMetaDot: { fontSize: 13, color: '#cccccc' },
  sheetStatusBadge: {
    alignSelf: 'center', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14,
  },
  sheetOpen: { backgroundColor: '#dcfce7' },
  sheetClosed: { backgroundColor: '#fee2e2' },
  sheetStatusText: { fontSize: 13, fontFamily: 'Nunito_700Bold' },
  sheetDivider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 14 },
  sheetDealsTitle: {
    fontSize: 15, fontFamily: 'Nunito_800ExtraBold',
    color: '#111111', marginBottom: 10,
  },
  sheetDealRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  sheetDealName: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#111111', marginBottom: 2 },
  sheetDealPrice: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: '#888888' },
  sheetDealBadge: {
    backgroundColor: '#f0ebff', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  sheetDealOff: { fontSize: 12, fontFamily: 'Nunito_700Bold', color: '#7b2fcd' },
  sheetCta: {
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetCtaText: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: '#ffffff', letterSpacing: 0.5 },
  sheetCtaRow: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'center' },
  sheetShareBtn: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#f0ebff',
    justifyContent: 'center', alignItems: 'center',
  },
  sheetShareIcon: { fontSize: 22 },

  /* Flash deal share */
  heroImage: { width: 96, height: 96, borderRadius: 14 },
  flashImage: { width: 62, height: 62, borderRadius: 14, marginBottom: 2 },
  dealImage: { width: 56, height: 56, borderRadius: 14, marginBottom: 8 },
  quickSaveBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 5,
  },
  quickSaveText: { color: '#ffffff', fontSize: 14, fontFamily: 'Nunito_800ExtraBold' },
  quickSaveBtnSmall: {
    position: 'absolute', top: 6, right: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center', zIndex: 5,
  },
  quickSaveTextSmall: { color: '#7b2fcd', fontSize: 13, fontFamily: 'Nunito_800ExtraBold' },
  flashShareBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start',
  },
  flashShareText: { fontSize: 11, fontFamily: 'Nunito_700Bold', color: '#ffffff' },

  /* Deal card share */
  dealBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dealShareBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  dealShareText: { fontSize: 16 },

  /* Profile View */
  profileHeader: {
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 4,
  },
  profileAvatarRing: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  profileName: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: '#ffffff' },
  profileEmail: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.85)' },
  profilePhone: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  profileEditBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 18, paddingVertical: 8, marginTop: 4,
  },
  profileEditText: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#ffffff' },
  profileEditInput: {
    borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, fontFamily: 'Nunito_600SemiBold',
  },
  profileSaveBtn: {
    flex: 1, backgroundColor: '#4caf50', borderRadius: 8, paddingVertical: 8,
    alignItems: 'center',
  },
  profileSaveBtnText: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#fff' },
  profileCancelBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8, paddingVertical: 8,
    alignItems: 'center',
  },
  profileCancelBtnText: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#fff' },

  profileStatsRow: {
    flexDirection: 'row',
    marginHorizontal: 14, marginTop: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  profileStat: { flex: 1, alignItems: 'center', gap: 3 },
  profileStatNum: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: '#7b2fcd' },
  profileStatLabel: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: '#888888' },
  profileStatDivider: { width: 1, backgroundColor: '#f0f0f0' },

  profileMenuCard: {
    marginHorizontal: 14, marginTop: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  profileMenuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 15, gap: 14,
  },
  profileMenuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  profileMenuIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#f5f0ff',
    justifyContent: 'center', alignItems: 'center',
  },
  profileMenuLabel: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#111111', marginBottom: 2 },
  profileMenuSub: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: '#999999' },
  profileMenuChevron: { fontSize: 22, color: '#cccccc', fontFamily: 'Nunito_400Regular' },

  profileLogoutBtn: {
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
    paddingVertical: 16, alignItems: 'center',
  },
  profileLogoutText: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: '#e53935' },
  profileFooterNote: {
    textAlign: 'center', marginTop: 20,
    fontSize: 12, fontFamily: 'Nunito_400Regular', color: '#bbbbbb',
  },

  /* Wishlist View */
  wishlistHeader: {
    paddingTop: 28, paddingBottom: 14,
    paddingHorizontal: 20, gap: 14,
  },
  wishlistHeaderTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  wishlistHeaderTitle: { fontSize: 24, fontFamily: 'Nunito_800ExtraBold', color: '#ffffff' },
  wishlistHeaderSub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  wishlistHeartBubble: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  wishlistFilterRow: { gap: 8, paddingVertical: 4 },
  wishlistFilterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  wishlistFilterChipActive: {
    backgroundColor: '#ffffff',
  },
  wishlistFilterText: {
    fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: 'rgba(255,255,255,0.9)',
  },
  wishlistFilterTextActive: { color: '#7b2fcd' },

  wishlistEmpty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40,
  },
  wishlistEmptyTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: '#333333' },
  wishlistEmptySub: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: '#999999', textAlign: 'center', lineHeight: 20 },

  wishlistSummaryStrip: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16, paddingVertical: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  wishlistSummaryItem: { flex: 1, alignItems: 'center', gap: 3 },
  wishlistSummaryNum: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: '#7b2fcd' },
  wishlistSummaryLabel: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: '#888888' },
  wishlistSummaryDivider: { width: 1, backgroundColor: '#f0f0f0' },

  wishlistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#7b2fcd', shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  wishlistCardBg: {
    height: 120,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  wishlistRibbon: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  wishlistRibbonText: { fontSize: 12, fontFamily: 'Nunito_800ExtraBold', color: '#ffffff' },
  wishlistCardContent: { padding: 14, gap: 10 },
  wishlistCardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  wishlistCardName: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: '#111111' },
  wishlistCardTag: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: '#999999', marginTop: 2 },
  wishlistRemoveBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fee2e2',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 2,
  },
  wishlistCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wishlistSavedLabel: { fontSize: 11, fontFamily: 'Nunito_400Regular', color: '#aaaaaa', marginBottom: 2 },
  wishlistCardPrice: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#111111' },
  wishlistGetBtn: { borderRadius: 12, overflow: 'hidden' },
  wishlistGetBtnGrad: { paddingHorizontal: 18, paddingVertical: 10 },
  wishlistGetBtnText: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: '#ffffff' },

  wishlistPromo: {
    borderRadius: 20, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  wishlistPromoBadge: {
    fontSize: 10, fontFamily: 'Nunito_700Bold',
    color: 'rgba(255,255,255,0.7)', letterSpacing: 0.6, marginBottom: 4,
  },
  wishlistPromoTitle: { fontSize: 18, fontFamily: 'Nunito_800ExtraBold', color: '#ffffff', marginBottom: 3 },
  wishlistPromoSub: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.85)' },
  wishlistHistoryCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  wishlistHistoryTitle: { fontSize: 15, fontFamily: 'Nunito_800ExtraBold' },
  wishlistHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  wishlistHistoryEmoji: { fontSize: 20 },
  wishlistHistoryText: { fontSize: 13, fontFamily: 'Nunito_700Bold' },
  wishlistHistorySub: { fontSize: 11, color: '#9ca3af', marginTop: 1, fontFamily: 'Nunito_400Regular' },

  /* Notifications Panel */
  notifsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
  },
  notifsPanel: {
    backgroundColor: '#f2f2f7',
    maxHeight: '88%',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  notifsHeaderGrad: {
    paddingTop: 54, paddingBottom: 14,
    paddingHorizontal: 18, gap: 12,
  },
  notifsHeaderTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  notifsTitle: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: '#ffffff' },
  notifsUnreadLabel: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  notifsHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  notifMarkAllBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  notifMarkAllText: { fontSize: 11, fontFamily: 'Nunito_700Bold', color: '#ffffff' },
  notifsCloseBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  notifsCloseBtnText: { fontSize: 13, color: '#ffffff' },

  notifsFilterRow: { gap: 8, paddingVertical: 2 },
  notifsFilterChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  notifsFilterChipActive: { backgroundColor: '#ffffff' },
  notifsFilterText: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: 'rgba(255,255,255,0.9)' },
  notifsFilterTextActive: { color: '#7b2fcd' },

  notifsEmpty: {
    height: 200, alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  notifsEmptyText: { fontSize: 15, fontFamily: 'Nunito_600SemiBold', color: '#aaaaaa' },

  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#ffffff', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  notifRowUnread: {
    backgroundColor: '#faf5ff',
    borderWidth: 1, borderColor: '#e9d8fd',
  },
  notifIconBox: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  notifRowTitle: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: '#444444', marginBottom: 3 },
  notifRowTitleUnread: { fontFamily: 'Nunito_800ExtraBold', color: '#111111' },
  notifRowBody: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: '#666666', lineHeight: 17, marginBottom: 4 },
  notifRowTime: { fontSize: 10, fontFamily: 'Nunito_400Regular', color: '#bbbbbb' },
  notifRowRight: { alignItems: 'center', gap: 8, paddingTop: 2 },
  notifUnreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#7b2fcd',
  },
  notifDismissBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center',
  },
  notifDismissText: { fontSize: 10, color: '#999999' },

  /* Walkthrough */
  wtOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  wtCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#7b2fcd',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 24,
  },
  wtArrowUp: {
    alignSelf: 'center',
    marginTop: -1,
    width: 0, height: 0,
    borderLeftWidth: 12, borderLeftColor: 'transparent',
    borderRightWidth: 12, borderRightColor: 'transparent',
    borderBottomWidth: 14, borderBottomColor: '#ffffff',
  },
  wtArrowDown: {
    alignSelf: 'center',
    marginBottom: -1,
    width: 0, height: 0,
    borderLeftWidth: 12, borderLeftColor: 'transparent',
    borderRightWidth: 12, borderRightColor: 'transparent',
    borderTopWidth: 14, borderTopColor: '#ffffff',
  },
  wtCardInner: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 14, padding: 18,
  },
  wtIconBubble: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#f0ebff',
    justifyContent: 'center', alignItems: 'center',
  },
  wtTitle: { fontSize: 17, fontFamily: 'Nunito_800ExtraBold', color: '#111111', marginBottom: 5 },
  wtBody: { fontSize: 13, fontFamily: 'Nunito_400Regular', color: '#555555', lineHeight: 19 },
  wtFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingBottom: 16, paddingTop: 4,
  },
  wtDots: { flexDirection: 'row', gap: 5 },
  wtDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e0d7f5' },
  wtDotActive: { width: 20, backgroundColor: '#7b2fcd' },
  wtBtns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wtSkipBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  wtSkipText: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: '#aaaaaa' },
  wtNextBtn: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  wtNextText: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#ffffff' },

  /* Explore Map View */
  realMap: { height: 300, width: '100%' },
  realMapFullScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  recenterBtn: {
    position: 'absolute', top: 258, right: 14,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, elevation: 6,
    zIndex: 10,
  },
  recenterBtnFullScreen: {
    top: 64,
    right: 14,
  },
  mapExpandBtn: {
    position: 'absolute', top: 258, right: 62,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, elevation: 6,
    zIndex: 10,
  },
  mapExpandBtnFullScreen: {
    top: 64,
    right: 62,
  },
  mapExpandBtnText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#222222',
  },
  mapOverlayIconBtn: {
    backgroundColor: 'rgba(20,20,28,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mapOverlayIconText: {
    color: '#ffffff',
  },
  mapMarkerBubble: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#ffffff',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
  },
  mapMarkerSelected: {
    borderColor: '#c03b8f', borderWidth: 3,
    transform: [{ scale: 1.2 }],
  },
  mapCallout: {
    borderRadius: 14, padding: 12, minWidth: 150,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, elevation: 12,
  },
  mapCalloutName: { fontSize: 14, fontFamily: 'Nunito_800ExtraBold', marginBottom: 3 },
  mapCalloutMeta: { fontSize: 12, fontFamily: 'Nunito_400Regular', color: '#888888', marginBottom: 6 },
  mapCalloutBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },

  mapListCardSelected: {
    borderWidth: 1.5, borderColor: '#7b2fcd',
  },
  mapFilterBar: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 3 },
  mapFilterBarFullScreen: {
    position: 'absolute',
    top: 154,
    left: 12,
    right: 12,
    borderRadius: 16,
    zIndex: 35,
    elevation: 35,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  mapFilterContentFullScreen: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mapHudCard: {
    position: 'absolute',
    left: 12,
    right: 112,
    top: 64,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(20,20,28,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    zIndex: 36,
    elevation: 36,
  },
  mapHudTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 2,
  },
  mapHudSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
  },
  mapFilterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
  },
  mapFilterChipFullScreen: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  mapFilterChipActiveFullScreen: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  mapFilterChipActive: { backgroundColor: '#f0ebff', borderColor: '#7b2fcd' },
  mapFilterText: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: '#888888' },
  mapFilterTextFullScreen: { color: 'rgba(255,255,255,0.86)' },
  mapFilterTextActiveFullScreen: { color: '#1a1a1a' },
  mapFilterTextActive: { color: '#7b2fcd', fontFamily: 'Nunito_700Bold' },

  mapListTitle: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', marginBottom: 2 },
  mapListCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  mapListIconBox: {
    width: 64, height: 64, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  mapListName: { fontSize: 14, fontFamily: 'Nunito_700Bold', marginBottom: 2 },
  mapListBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  mapListMeta: { fontSize: 11, fontFamily: 'Nunito_400Regular', marginBottom: 5 },
  mapListTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapListTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  mapListTagText: { fontSize: 11, fontFamily: 'Nunito_600SemiBold' },
  mapListDealsHint: { fontSize: 11, fontFamily: 'Nunito_700Bold', color: '#f97316' },
  mapListChevron: { fontSize: 22, fontFamily: 'Nunito_400Regular' },
});

