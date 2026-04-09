import Constants from 'expo-constants';
import PassengerApp from './App.passenger';
import DriverApp from './App.driver';

/**
 * Point d'entree unique qui charge la bonne app selon la variable APP_ROLE
 * definie via app.config.js (lue depuis process.env.APP_ROLE au build).
 *
 * - APP_ROLE=passenger → App Yokh Laa (bundle com.yokhlaa.passenger)
 * - APP_ROLE=driver    → App Yokh Laa Chauffeur (bundle com.yokhlaa.driver)
 *
 * Par defaut (dev sans env var) → passenger.
 */
const role = Constants.expoConfig?.extra?.appRole || 'passenger';

export default role === 'driver' ? DriverApp : PassengerApp;
