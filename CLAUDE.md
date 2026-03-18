# Yokh Laa - Project Instructions

## Project Overview
**Yokh Laa** ("Aller là-bas" en wolof) — Application mobile de transport/covoiturage pour Dakar, Sénégal.
- **Business model:** Drivers pay 18,500 FCFA/month (flat subscription), 0% commission on rides
- **Bundle ID:** com.yokhlaa.app
- **Language:** French (interface)

## Tech Stack
- **Framework:** React Native + Expo SDK 55
- **Backend:** Supabase (PostgreSQL + Realtime + Auth + RLS)
- **Navigation:** React Navigation v6 (Stack + Bottom Tabs)
- **Maps:** react-native-maps (native) / Leaflet + OpenStreetMap (web)
- **Routing:** OSRM + TomTom Traffic API (fallback)
- **Geocoding:** Nominatim (OpenStreetMap)
- **Auth:** Supabase OTP SMS (+221 Sénégal) via Twilio Verify
- **Storage:** AsyncStorage (search history), expo-secure-store (auth tokens)
- **Notifications:** expo-notifications + Expo Push API

## Commands
```bash
npm start          # Start Expo dev server
expo start --web   # Web dev
expo run:ios       # iOS native
expo run:android   # Android native
npx expo export --platform web  # Build verification (web)
```

## Project Structure
```
/App.js                          # Entry point, navigation, deep linking, in-app notifications
/src/
  /screens/                      # 17 screens
    PassengerMapScreen.js        # Main passenger screen (map, search, ride flow)
    DriverScreen.js              # Driver mode (online toggle, accept rides, status updates)
    DriverDashboardScreen.js     # Driver stats, earnings chart, subscription
    ChatScreen.js                # Real-time messaging (Supabase Realtime)
    LiveTrackScreen.js           # Shared ride tracking (public access via share_token)
    RideDetailScreen.js          # Ride history detail, receipt, re-order
    ActivityScreen.js            # Ride history list with filters
    ProfileScreen.js             # User profile, settings menu
    EditProfileScreen.js         # Edit name, phone, saved addresses
    LoginScreen.js               # OTP login (+221)
    WelcomeScreen.js             # Landing page
    RoleSelectScreen.js          # Choose passenger/driver role
    AboutScreen.js               # App info
    HelpScreen.js                # FAQ
  /components/                   # 10 reusable components
    DakarMap.js                  # Map component (native + web)
    GreenButton.js               # Primary CTA with loading/disabled/icon
    RatingModal.js               # Star rating + tags + animations
    InAppNotification.js         # Animated notification banner
    SkeletonLoader.js            # Shimmer loading placeholders
    AnimatedScreen.js            # Fade/slide/stagger animations
    FAQItem.js, FeatureCard.js, StatCard.js, StepItem.js
  /lib/                          # 7 utility modules
    AuthContext.js               # Auth provider + useAuth hook
    supabase.js                  # Supabase client init
    notifications.js             # Push notifications (14 functions)
    haptics.js                   # Haptic feedback (7 functions)
    traffic.js                   # TomTom + OSRM routing
    searchHistory.js             # AsyncStorage search history + popular places
    backgroundLocation.js        # Background GPS tracking for drivers
    sms.js                       # Twilio SMS
  /constants/
    theme.js                     # COLORS (16 keys), SIZES, FONTS
```

## Database Schema (Supabase - PostgreSQL)

### Tables
- **profiles** — Users (id, phone, nom, role, zone, vehicule, plaque, rating, rating_count, is_online, push_token, latitude, longitude, home/work addresses, timestamps)
- **rides** — Rides (id, passenger_id, driver_id, status, pickup/dropoff coords+address, distance_km, duration_min, price, ride_class, payment_method, ratings, share_token, timestamps)
- **messages** — Chat (id, ride_id, sender_id, content, read, created_at)
- **subscriptions** — Driver subscriptions (driver_id, status, starts_at, ends_at, amount)
- **waitlist** — Pre-registration

### Ride Statuses
`pending` → `accepted` → `arriving` → `in_progress` → `completed` | `cancelled`

### RLS Policies
All tables have RLS enabled. Key policies:
- profiles: authenticated users can CRUD own data
- rides: passengers/drivers can read/update own rides, anon can view shared rides (share_token)
- messages: only ride participants can read/write

### Realtime Channels
- `r-{rideId}` — Ride status updates (passenger listens)
- `driver-ride-{rideId}` — Ride cancellation (driver listens)
- `new-rides` — New ride requests (online drivers listen)
- `chat-{rideId}` — Chat messages
- `track-{rideId}` — Live tracking updates

### Indexes
- rides: status, driver_id, passenger_id, created_at, share_token (unique)
- messages: ride_id, (ride_id, created_at)
- profiles: role, is_online

## Supabase Access
- **Project ID:** oxzczrwsyvuavgevfhko
- **API Endpoint:** Use `EXPO_PUBLIC_SUPABASE_URL` in your local `.env`
- **Management API Token:** Use local env var `SUPABASE_MANAGEMENT_TOKEN` only
- **SQL Execution:**
```bash
curl -s -X POST "https://api.supabase.com/v1/projects/oxzczrwsyvuavgevfhko/database/query" \
  -H "Authorization: Bearer $SUPABASE_MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR SQL HERE"}'
```

## Pricing Model
- Base: 500 FCFA + 400 FCFA/km
- Classes: Start (0.85x), Confort (1x), Premium (1.5x)
- Surge pricing based on TomTom traffic congestion ratio
- Payment: cash, Wave, Orange Money

## Color Theme
```javascript
black: '#080A0D'    // Background
card: '#1A1C20'     // Card surfaces
surface: '#12141A'  // Elevated surfaces
green: '#22C55E'    // Primary accent
greenLight: 'rgba(34,197,94,0.08)'
greenBorder: 'rgba(34,197,94,0.2)'
white: '#F5F6F7'    // Primary text
dim: '#4A5160'      // Secondary text
dim2: '#2A2E35'     // Tertiary/placeholder
red: '#EF4444'      // Danger
blue: '#4A90FF'     // Info/arriving
orange: '#FFB800'   // Warning/stars
```

## Architecture Rules
1. **Dark mode only** — All screens use COLORS.black background
2. **Dakar-bounded** — Location restricted to Dakar area (14.7167, -17.4677)
3. **Driver location updates** every 5 seconds when online
4. **Demo mode** — Mock data fallback if backend unavailable
5. **No external chart libraries** — Pure RN views for charts
6. **Haptic feedback** on all interactions (via src/lib/haptics.js)
7. **Skeleton loading** for all list screens
8. **Animated transitions** — Spring animations, staggered lists
9. **French UI** — All text in French, no i18n library

## Code Conventions
- Functional components only (no class components)
- Inline StyleSheet.create at bottom of each file
- `s` or `st` for style variable names
- COLORS imported from `../constants/theme`
- `useAuth()` hook for user/profile/auth state
- Supabase client from `../lib/supabase`
- Haptic feedback from `../lib/haptics` (tapLight, tapMedium, tapHeavy, notifySuccess, etc.)
- Navigation via `navigation.navigate()` or `navigation.getParent()?.navigate()`

## Important Notes
- Always run SQL migrations via Supabase Management API using local env var `SUPABASE_MANAGEMENT_TOKEN`
- Build verification: `npx expo export --platform web` must pass
- Never add new npm dependencies without checking Expo SDK compatibility
- All new screens must be registered in App.js (both MainStack and AuthStack if needed)
- Deep linking configured for `yokhlaa://` and `https://yokhlaa.app`
