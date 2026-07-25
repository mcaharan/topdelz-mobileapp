import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

/* ── Animated Splash Screen ── */
function SplashScreen({ onDone }) {
  const logoScale   = useRef(new Animated.Value(0.25)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const tagSlide    = useRef(new Animated.Value(20)).current;
  const subtOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacity  = useRef(new Animated.Value(0)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const exitScale   = useRef(new Animated.Value(1)).current;
  // Pulsing rings
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rings pulse
    const pulseRing = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    pulseRing(ring1, 0);
    pulseRing(ring2, 600);

    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Tagline after 400ms
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(tagOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(tagSlide, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    }, 400);

    // Subtitle after 750ms
    setTimeout(() => {
      Animated.timing(subtOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 750);

    // Dots after 900ms
    setTimeout(() => {
      Animated.timing(dotOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 900);

    // Exit at 2400ms
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(exitOpacity, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(exitScale,   { toValue: 1.12, duration: 500, useNativeDriver: true }),
      ]).start(() => onDone());
    }, 2400);
  }, []);

  const ring1Style = {
    opacity: ring1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.55, 0.2, 0] }),
    transform: [{ scale: ring1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] }) }],
  };
  const ring2Style = {
    opacity: ring2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.45, 0.15, 0] }),
    transform: [{ scale: ring2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.75] }) }],
  };

  return (
    <Animated.View style={{ flex: 1, opacity: exitOpacity, transform: [{ scale: exitScale }] }}>
      <LinearGradient
        colors={['#4a0e8f', '#7b2fcd', '#c03b8f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={sp.container}
      >
        <StatusBar style="light" />

        {/* Decorative circles */}
        <View style={sp.decorTop} />
        <View style={sp.decorBottom} />

        {/* Pulse rings */}
        <View style={sp.ringsWrap}>
          <Animated.View style={[sp.ring, ring1Style]} />
          <Animated.View style={[sp.ring, ring2Style]} />

          {/* Logo */}
          <Animated.View style={[sp.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <Image source={require('./assets/logo.png')} style={sp.logo} resizeMode="contain" />
          </Animated.View>
        </View>

        {/* App name */}
        <Animated.Text style={[sp.appName, { opacity: tagOpacity, transform: [{ translateY: tagSlide }] }]}>
          Topdelz
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[sp.tagline, { opacity: subtOpacity }]}>
          Discover · Save · Enjoy
        </Animated.Text>

        {/* Loading dots */}
        <Animated.View style={[sp.dotsRow, { opacity: dotOpacity }]}>
          {[0, 1, 2].map((i) => <LoadingDot key={i} delay={i * 160} />)}
        </Animated.View>

        {/* Bottom badge */}
        <Animated.Text style={[sp.bottomBadge, { opacity: subtOpacity }]}>
          🇮🇳  Made in Puducherry
        </Animated.Text>
      </LinearGradient>
    </Animated.View>
  );
}

function LoadingDot({ delay }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounceAnim, { toValue: -10, duration: 300, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0,   duration: 300, useNativeDriver: true }),
        Animated.delay(500 - delay),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[sp.dot, { transform: [{ translateY: bounceAnim }] }]} />
  );
}

const sp = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  decorTop: {
    position: 'absolute', top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  decorBottom: {
    position: 'absolute', bottom: -100, left: -60,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  ringsWrap: { alignItems: 'center', justifyContent: 'center', width: 180, height: 180 },
  ring: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)',
  },
  logoWrap: {
    width: 130, height: 130, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  logo: { width: 110, height: 110 },
  appName: {
    fontSize: 38,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#ffffff',
    letterSpacing: 1.5,
    marginTop: 28,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 2,
    marginTop: 8,
  },
  dotsRow: { flexDirection: 'row', gap: 10, marginTop: 40 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.8)' },
  bottomBadge: {
    position: 'absolute', bottom: 48,
    fontSize: 12, fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
  },
});


function SkeletonBlock({ w, h, radius = 8, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
  return (
    <Animated.View
      style={[
        { width: w, height: h, borderRadius: radius, backgroundColor: '#d0d0d8', opacity },
        style,
      ]}
    />
  );
}

function SkeletonLoader() {
  return (
    <View style={sk.container}>
      {/* Top bar */}
      <View style={sk.topBar}>
        <View style={{ gap: 6 }}>
          <SkeletonBlock w={100} h={14} radius={6} />
          <SkeletonBlock w={60} h={10} radius={5} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SkeletonBlock w={28} h={28} radius={14} />
          <SkeletonBlock w={36} h={36} radius={18} />
        </View>
      </View>
      {/* Search */}
      <View style={sk.searchRow}>
        <SkeletonBlock w={width - 72} h={42} radius={12} />
        <SkeletonBlock w={42} h={42} radius={12} />
      </View>
      {/* Category row */}
      <View style={sk.catRow}>
        {[0,1,2,3,4].map((i) => (
          <View key={i} style={{ alignItems: 'center', gap: 6 }}>
            <SkeletonBlock w={54} h={54} radius={27} />
            <SkeletonBlock w={44} h={10} radius={5} />
          </View>
        ))}
      </View>
      {/* Banner */}
      <SkeletonBlock w={width - 28} h={160} radius={18} style={{ alignSelf: 'center', marginTop: 16 }} />
      {/* Flash row */}
      <View style={sk.flashRow}>
        {[0,1,2].map((i) => <SkeletonBlock key={i} w={130} h={120} radius={16} />)}
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 14, backgroundColor: '#d8c8f5' },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#ffffff' },
  catRow: { flexDirection: 'row', gap: 14, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#ffffff', marginTop: 2 },
  flashRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 14, marginTop: 20 },
});
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from './services/api';
import LoginScreen from './screens/LoginScreen';
import EmailAuthScreen from './screens/EmailAuthScreen';
import PermissionsScreen from './screens/PermissionsScreen';
import OtpScreen from './screens/OtpScreen';
import UserTypeScreen from './screens/UserTypeScreen';
import InterestsScreen from './screens/InterestsScreen';
import HomeScreen from './screens/HomeScreen';

/* ── Smooth animated wrapper for every screen transition ── */
function FadeScreen({ children, slideFrom = 'bottom' }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(slideFrom === 'bottom' ? 40 : -40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(translate, {
        toValue: 0,
        damping: 18,
        stiffness: 180,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const transform = slideFrom === 'bottom'
    ? [{ translateY: translate }]
    : [{ translateX: translate }];

  return (
    <Animated.View style={{ flex: 1, opacity, transform }}>
      {children}
    </Animated.View>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [showLoginScreen, setShowLoginScreen] = useState(false);
  const [showEmailAuthScreen, setShowEmailAuthScreen] = useState(false);
  const [showPermissionsScreen, setShowPermissionsScreen] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [showUserTypeScreen, setShowUserTypeScreen] = useState(false);
  const [showInterestsScreen, setShowInterestsScreen] = useState(false);
  const [showHomeScreen, setShowHomeScreen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [user, setUser] = useState(null);
  const [reverifyMode, setReverifyMode] = useState(false);
  const lastBackPressRef = useRef(0);

  const navigateTo = (screen) => {
    setShowLoginScreen(false);
    setShowEmailAuthScreen(false);
    setShowPermissionsScreen(false);
    setShowOtpScreen(false);
    setShowUserTypeScreen(false);
    setShowInterestsScreen(false);
    setShowHomeScreen(false);

    if (screen === 'login') setShowLoginScreen(true);
    if (screen === 'emailAuth') setShowEmailAuthScreen(true);
    if (screen === 'permissions') setShowPermissionsScreen(true);
    if (screen === 'otp') setShowOtpScreen(true);
    if (screen === 'userType') setShowUserTypeScreen(true);
    if (screen === 'interests') setShowInterestsScreen(true);
    if (screen === 'home') setShowHomeScreen(true);
  };

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const handleSplashDone = async () => {
    setSplashDone(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        try {
          const data = await getProfile();
          const user = data.user;
          setUser(user);
          if (user?.user_type && user?.interests_count > 0) {
            navigateTo('home');
          } else {
            navigateTo('userType');
          }
        } catch {
          // Token invalid / network error — go to login
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user');
          navigateTo('login');
        }
      } else {
        navigateTo('login');
      }
    } catch {
      navigateTo('login');
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'android' || !splashDone) return undefined;

    const onBackPress = () => {
      const now = Date.now();

      if (showInterestsScreen) {
        navigateTo('userType');
        return true;
      }

      if (showUserTypeScreen) {
        navigateTo(mobileNumber ? 'otp' : 'login');
        return true;
      }

      if (showOtpScreen) {
        navigateTo(reverifyMode ? 'home' : 'permissions');
        return true;
      }

      if (showPermissionsScreen) {
        navigateTo('login');
        return true;
      }

      if (showEmailAuthScreen) {
        navigateTo('login');
        return true;
      }

      if (showHomeScreen || showLoginScreen) {
        if (now - lastBackPressRef.current < 2000) {
          BackHandler.exitApp();
        } else {
          lastBackPressRef.current = now;
          ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        }
        return true;
      }

      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [
    splashDone,
    showHomeScreen,
    showLoginScreen,
    showEmailAuthScreen,
    showPermissionsScreen,
    showOtpScreen,
    showUserTypeScreen,
    showInterestsScreen,
    mobileNumber,
    reverifyMode,
  ]);

  if (!fontsLoaded) {
    return <SkeletonLoader />;
  }

  if (!splashDone) {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  const handleLogout = () => {
    setMobileNumber('');
    setUser(null);
    setReverifyMode(false);
    navigateTo('login');
  };

  const openVerifyPhone = () => {
    setReverifyMode(true);
    navigateTo('otp');
  };

  if (showHomeScreen) {
    return (
      <FadeScreen slideFrom="right">
        <HomeScreen
          onLogout={handleLogout}
          phoneVerified={user?.phone_verified === true}
          onVerifyPhone={openVerifyPhone}
        />
      </FadeScreen>
    );
  }

  if (showInterestsScreen) {
    return (
      <FadeScreen slideFrom="right">
        <InterestsScreen onSave={() => navigateTo('home')} onBack={() => navigateTo('userType')} />
      </FadeScreen>
    );
  }

  if (showUserTypeScreen) {
    return (
      <FadeScreen slideFrom="right">
        <UserTypeScreen onSelect={() => navigateTo('interests')} onBack={() => navigateTo(mobileNumber ? 'otp' : 'login')} />
      </FadeScreen>
    );
  }

  if (showOtpScreen) {
    return (
      <FadeScreen slideFrom="right">
        <OtpScreen
          mobileNumber={mobileNumber}
          allowSkip={true}
          onVerified={(verifiedUser) => {
            setUser(verifiedUser);
            if (reverifyMode) {
              navigateTo('home');
            } else if (verifiedUser?.user_type && verifiedUser?.interests_count > 0) {
              navigateTo('home');
            } else {
              navigateTo('userType');
            }
          }}
          onSkip={() => {
            if (reverifyMode) {
              navigateTo('home');
            } else if (user?.user_type && user?.interests_count > 0) {
              navigateTo('home');
            } else {
              navigateTo('userType');
            }
          }}
        />
      </FadeScreen>
    );
  }

  if (showPermissionsScreen) {
    return (
      <FadeScreen slideFrom="right">
        <PermissionsScreen onContinue={() => navigateTo('otp')} />
      </FadeScreen>
    );
  }

  if (showEmailAuthScreen) {
    return (
      <FadeScreen slideFrom="bottom">
        <EmailAuthScreen
          onAuthed={(authedUser) => {
            setUser(authedUser);
            setReverifyMode(false);
            if (authedUser?.user_type && authedUser?.interests_count > 0) {
              navigateTo('home');
            } else {
              navigateTo('userType');
            }
          }}
          onPhoneTab={() => navigateTo('login')}
        />
      </FadeScreen>
    );
  }

  return (
    <FadeScreen slideFrom="bottom">
      <LoginScreen
        onPhoneSubmit={(mobile) => {
          setMobileNumber(mobile);
          setReverifyMode(false);
          navigateTo('permissions');
        }}
        onEmailTab={() => navigateTo('emailAuth')}
        onGuestLogin={() => navigateTo('home')}
      />
    </FadeScreen>
  );
}

const styles = StyleSheet.create({
});
