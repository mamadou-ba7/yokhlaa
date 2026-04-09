/**
 * Configuration Expo dynamique — choisit passenger ou driver selon APP_ROLE
 *
 * Usage :
 *   APP_ROLE=passenger npx expo run:ios
 *   APP_ROLE=driver    npx expo run:ios
 *   APP_ROLE=passenger npx expo export --platform web
 *
 * Par defaut : passenger
 */

const role = process.env.APP_ROLE || 'passenger';

const GOOGLE_MAPS_KEY = 'AIzaSyDTK9VG9QU_b5hSKVXf4bNQG1cnv1ZHaQM';

const baseLocationStrings = {
  locationAlwaysAndWhenInUsePermission:
    'Yokh Laa utilise votre position pour vous connecter avec les chauffeurs a proximite.',
  locationAlwaysPermission:
    'Yokh Laa a besoin de votre position pour vous offrir le meilleur service.',
  locationWhenInUsePermission:
    'Yokh Laa utilise votre position pour trouver des chauffeurs proches.',
};

const driverLocationStrings = {
  locationAlwaysAndWhenInUsePermission:
    'Yokh Laa Chauffeur utilise votre position en permanence pour recevoir des courses.',
  locationAlwaysPermission:
    'Yokh Laa Chauffeur a besoin de votre position en arriere-plan pour recevoir des courses meme ecran eteint.',
  locationWhenInUsePermission:
    'Yokh Laa Chauffeur utilise votre position pour matcher les passagers proches.',
  isAndroidBackgroundLocationEnabled: true,
  isAndroidForegroundServiceEnabled: true,
};

const passengerConfig = {
  name: 'Yokh Laa',
  slug: 'yokhlaa',
  scheme: 'yokhlaa',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    backgroundColor: '#080A0D',
  },
  assetBundlePatterns: ['**/*'],
  plugins: [
    ['expo-location', baseLocationStrings],
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#22C55E',
      },
    ],
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
  ],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.yokhlaa.passenger',
    config: {
      googleMapsApiKey: GOOGLE_MAPS_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription: baseLocationStrings.locationWhenInUsePermission,
      UIBackgroundModes: ['fetch', 'remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#080A0D',
    },
    package: 'com.yokhlaa.passenger',
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_KEY,
      },
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'VIBRATE',
    ],
  },
  web: {
    bundler: 'metro',
  },
  extra: {
    appRole: 'passenger',
  },
};

const driverConfig = {
  name: 'Yokh Laa Chauffeur',
  slug: 'yokhlaa-driver',
  scheme: 'yokhlaadriver',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    backgroundColor: '#080A0D',
  },
  assetBundlePatterns: ['**/*'],
  plugins: [
    ['expo-location', driverLocationStrings],
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#22C55E',
      },
    ],
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
  ],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.yokhlaa.driver',
    config: {
      googleMapsApiKey: GOOGLE_MAPS_KEY,
    },
    infoPlist: {
      NSLocationAlwaysAndWhenInUseUsageDescription: driverLocationStrings.locationAlwaysAndWhenInUsePermission,
      NSLocationAlwaysUsageDescription: driverLocationStrings.locationAlwaysPermission,
      NSLocationWhenInUseUsageDescription: driverLocationStrings.locationWhenInUsePermission,
      UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#080A0D',
    },
    package: 'com.yokhlaa.driver',
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_KEY,
      },
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
    ],
  },
  web: {
    bundler: 'metro',
  },
  extra: {
    appRole: 'driver',
  },
};

module.exports = ({ config }) => ({
  ...config,
  ...(role === 'driver' ? driverConfig : passengerConfig),
});
