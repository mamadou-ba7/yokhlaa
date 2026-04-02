import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { supabase } from './supabase';

// ── Selfie verification before going online ────
export async function takeSelfieVerification(driverId) {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Camera requise', 'Autorisez la camera pour verifier votre identite.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: false,
    cameraType: 'front',
    exif: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];

  // Basic checks: must be a face-sized photo (front camera, not a screenshot)
  if (asset.width < 200 || asset.height < 200) {
    return { valid: false, reason: 'Photo trop petite. Prenez un selfie net avec la camera frontale.' };
  }

  // Portrait orientation expected for selfie
  const aspect = asset.width / asset.height;
  if (aspect > 1.5) {
    return { valid: false, reason: 'Prenez un selfie en mode portrait (vertical) avec votre visage bien visible.' };
  }

  // Upload selfie
  try {
    const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const path = `${driverId}/selfie_${timestamp}.${ext}`;

    const response = await fetch(asset.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('driver-docs')
      .upload(path, blob, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Log the verification
    await supabase.from('driver_verifications').insert({
      driver_id: driverId,
      type: 'selfie_online',
      file_path: path,
      status: 'pending',
    });

    return { valid: true };
  } catch (e) {
    console.warn('Selfie upload error:', e);
    return { valid: true }; // Don't block if upload fails, but log it
  }
}

// ── Random selfie check during shift ────────────
export async function takeRandomSelfieCheck(driverId) {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: false,
    cameraType: 'front',
    exif: false,
  });

  if (result.canceled || !result.assets?.length) {
    return { valid: false, reason: 'cancelled' };
  }

  const asset = result.assets[0];

  try {
    const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const path = `${driverId}/selfie_check_${timestamp}.${ext}`;

    const response = await fetch(asset.uri);
    const blob = await response.blob();

    await supabase.storage
      .from('driver-docs')
      .upload(path, blob, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: false,
      });

    await supabase.from('driver_verifications').insert({
      driver_id: driverId,
      type: 'selfie_random',
      file_path: path,
      status: 'pending',
    });

    return { valid: true };
  } catch (e) {
    console.warn('Random selfie error:', e);
    return { valid: true };
  }
}

// ── Vehicle confirmation before going online ────
export function getVehicleConfirmData(profile) {
  return {
    vehicule: profile?.vehicule || '',
    plaque: profile?.plaque || '',
    couleur: profile?.vehicule_couleur || '',
    marque: profile?.vehicule_marque || '',
    modele: profile?.vehicule_modele || '',
  };
}

// ── Report wrong driver/vehicle (passenger side) ──
export async function reportDriverMismatch(rideId, passengerId, reportType, description) {
  try {
    const { error } = await supabase.from('driver_reports').insert({
      ride_id: rideId,
      reporter_id: passengerId,
      report_type: reportType, // 'wrong_driver', 'wrong_vehicle', 'unsafe'
      description: description || '',
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Report error:', e);
    return false;
  }
}

// ── Check if random selfie is due ───────────────
// Triggers after ~45-90 min of being online
export function shouldTriggerRandomCheck(onlineSince) {
  if (!onlineSince) return false;
  const elapsed = Date.now() - onlineSince;
  const minDelay = 45 * 60 * 1000;  // 45 min
  const maxDelay = 90 * 60 * 1000;  // 90 min
  // Random window
  const threshold = minDelay + Math.random() * (maxDelay - minDelay);
  return elapsed > threshold;
}
