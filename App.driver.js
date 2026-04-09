import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, View, Text, StyleSheet, AppState } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/lib/AuthContext';
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  clearBadge,
} from './src/lib/notifications';
import InAppNotification from './src/components/InAppNotification';

// Driver-only
import DriverScreen from './src/screens/driver/DriverScreen';
import DriverDashboardScreen from './src/screens/driver/DriverDashboardScreen';
import DriverDocumentsScreen from './src/screens/driver/DriverDocumentsScreen';
import SubscriptionScreen from './src/screens/driver/SubscriptionScreen';

// Shared screens
import WelcomeScreen from './src/screens/shared/WelcomeScreen';
import LoginScreen from './src/screens/shared/LoginScreen';
import ActivityScreen from './src/screens/shared/ActivityScreen';
import ProfileScreen from './src/screens/shared/ProfileScreen';
import EditProfileScreen from './src/screens/shared/EditProfileScreen';
import AboutScreen from './src/screens/shared/AboutScreen';
import HelpScreen from './src/screens/shared/HelpScreen';
import RideDetailScreen from './src/screens/shared/RideDetailScreen';
import ChatScreen from './src/screens/shared/ChatScreen';
import LiveTrackScreen from './src/screens/shared/LiveTrackScreen';
import TermsScreen from './src/screens/shared/TermsScreen';
import PrivacyScreen from './src/screens/shared/PrivacyScreen';

const COLORS = {
  black: '#080A0D',
  green: '#22C55E',
  dim: '#4A5160',
  white: '#F5F6F7',
  card: '#1A1C20',
  line: 'rgba(255,255,255,0.07)',
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_STYLE = {
  backgroundColor: COLORS.card,
  borderTopColor: COLORS.line,
  borderTopWidth: 1,
  height: 85,
  paddingTop: 8,
  paddingBottom: 28,
};

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: TAB_STYLE,
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.dim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => {
          const icons = { Courses: 'car', Tableau: 'stats-chart', Historique: 'time', Profil: 'person' };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Courses" component={DriverScreen} />
      <Tab.Screen name="Tableau" component={DriverDashboardScreen} />
      <Tab.Screen name="Historique" component={ActivityScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Stack auth (non connecté)
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.black },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="DriverMain" component={DriverTabs} />
    </Stack.Navigator>
  );
}

// Stack principale (connecté)
function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.black },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="DriverMain" component={DriverTabs} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="DriverDashboard" component={DriverDashboardScreen} />
      <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user, loading, profile, switchRole } = useAuth();
  const navigationRef = useNavigationContainerRef();
  const [inAppNotif, setInAppNotif] = useState(null);
  const notifKey = useRef(0);

  // Force le role chauffeur si l'utilisateur utilise l'app driver
  useEffect(() => {
    if (profile && profile.role !== 'chauffeur' && switchRole) {
      switchRole('chauffeur').catch(() => {});
    }
  }, [profile?.role]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') clearBadge();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      notifKey.current += 1;
      setInAppNotif({ title, body, data, key: notifKey.current });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      handleNotifNavigation(data);
    });
    return () => sub.remove();
  }, []);

  const handleNotifNavigation = useCallback((data) => {
    if (!navigationRef.isReady() || !data) return;
    const type = data.type;
    const rideId = data.rideId;

    switch (type) {
      case 'new_ride':
        // Driver gets this — DriverScreen handles via realtime
        break;
      case 'ride_completed':
      case 'rating':
        if (rideId) navigationRef.navigate('RideDetail', { rideId });
        break;
      default:
        break;
    }
  }, [navigationRef]);

  const handleInAppPress = useCallback((notif) => {
    handleNotifNavigation(notif.data);
  }, [handleNotifNavigation]);

  if (loading) {
    return <SplashLoader />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        {user ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
      <InAppNotification
        notification={inAppNotif}
        onPress={handleInAppPress}
        onDismiss={() => setInAppNotif(null)}
      />
    </View>
  );
}

function SplashLoader() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulseAnim.start();
    return () => pulseAnim.stop();
  }, []);

  return (
    <View style={splashStyles.container}>
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <View style={splashStyles.iconWrap}>
          <Animated.View style={[splashStyles.icon, { transform: [{ scale: pulse }] }]}>
            <Ionicons name="car-sport" size={32} color="#fff" />
          </Animated.View>
        </View>
        <Text style={splashStyles.logo}>
          Yokh<Text style={{ color: COLORS.green }}>Laa</Text>
          <Text style={{ color: COLORS.dim, fontSize: 18, fontWeight: '600' }}> Chauffeur</Text>
        </Text>
        <Text style={splashStyles.sub}>0% commission — 18 500 FCFA/mois</Text>
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  logo: { fontSize: 36, fontWeight: '800', color: '#F5F6F7', textAlign: 'center' },
  sub: { fontSize: 13, color: '#8A9099', textAlign: 'center', marginTop: 8 },
});

export default function DriverApp() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
