import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { supabase } from './supabase';

// ── Document types and their validation rules ──
const DOC_RULES = {
  cni_recto: {
    label: 'CNI (recto)',
    minSize: 50 * 1024,       // 50 KB min
    maxSize: 10 * 1024 * 1024, // 10 MB max
    minWidth: 400,
    minHeight: 250,
    aspectMin: 1.2,  // landscape card
    aspectMax: 2.0,
    icon: 'card',
  },
  cni_verso: {
    label: 'CNI (verso)',
    minSize: 50 * 1024,
    maxSize: 10 * 1024 * 1024,
    minWidth: 400,
    minHeight: 250,
    aspectMin: 1.2,
    aspectMax: 2.0,
    icon: 'card-outline',
  },
  permis: {
    label: 'Permis de conduire',
    minSize: 50 * 1024,
    maxSize: 10 * 1024 * 1024,
    minWidth: 400,
    minHeight: 250,
    aspectMin: 1.2,
    aspectMax: 2.0,
    icon: 'car',
  },
  carte_grise: {
    label: 'Carte grise',
    minSize: 50 * 1024,
    maxSize: 10 * 1024 * 1024,
    minWidth: 400,
    minHeight: 250,
    aspectMin: 0.5,
    aspectMax: 2.0,
    icon: 'document-text',
  },
  assurance: {
    label: 'Attestation d\'assurance',
    minSize: 40 * 1024,
    maxSize: 10 * 1024 * 1024,
    minWidth: 300,
    minHeight: 300,
    aspectMin: 0.5,
    aspectMax: 2.0,
    icon: 'shield-checkmark',
  },
  vehicule_avant: {
    label: 'Vehicule (avant)',
    minSize: 80 * 1024,
    maxSize: 15 * 1024 * 1024,
    minWidth: 600,
    minHeight: 400,
    aspectMin: 1.0,
    aspectMax: 2.0,
    icon: 'car',
  },
  vehicule_arriere: {
    label: 'Vehicule (arriere)',
    minSize: 80 * 1024,
    maxSize: 15 * 1024 * 1024,
    minWidth: 600,
    minHeight: 400,
    aspectMin: 1.0,
    aspectMax: 2.0,
    icon: 'car',
  },
  vehicule_lateral: {
    label: 'Vehicule (cote)',
    minSize: 80 * 1024,
    maxSize: 15 * 1024 * 1024,
    minWidth: 600,
    minHeight: 400,
    aspectMin: 1.0,
    aspectMax: 2.5,
    icon: 'car',
  },
  vehicule_interieur: {
    label: 'Vehicule (interieur)',
    minSize: 60 * 1024,
    maxSize: 15 * 1024 * 1024,
    minWidth: 500,
    minHeight: 300,
    aspectMin: 0.8,
    aspectMax: 2.0,
    icon: 'car',
  },
  casier_judiciaire: {
    label: 'Casier judiciaire (bulletin n°3)',
    minSize: 40 * 1024,
    maxSize: 10 * 1024 * 1024,
    minWidth: 300,
    minHeight: 400,
    aspectMin: 0.5,
    aspectMax: 1.2,  // portrait document
    icon: 'document',
  },
};

// Required documents for driver approval
export const REQUIRED_DOCS = [
  'cni_recto', 'cni_verso', 'permis', 'carte_grise', 'assurance',
  'vehicule_avant', 'vehicule_arriere', 'vehicule_lateral', 'vehicule_interieur',
];

// Optional document that gives a "Verifie+" badge
export const OPTIONAL_DOCS = ['casier_judiciaire'];

// Document categories for grouped display
export const DOC_CATEGORIES = [
  {
    title: 'Identite',
    icon: 'person',
    docs: ['cni_recto', 'cni_verso'],
  },
  {
    title: 'Permis & documents',
    icon: 'document-text',
    docs: ['permis', 'carte_grise', 'assurance'],
  },
  {
    title: 'Photos du vehicule',
    icon: 'car',
    docs: ['vehicule_avant', 'vehicule_arriere', 'vehicule_lateral', 'vehicule_interieur'],
  },
  {
    title: 'Badge Verifie+ (optionnel)',
    icon: 'shield-checkmark',
    docs: ['casier_judiciaire'],
    optional: true,
  },
];

export function getDocLabel(docType) {
  return DOC_RULES[docType]?.label || docType;
}

export function getDocIcon(docType) {
  return DOC_RULES[docType]?.icon || 'document';
}

// ── Auto-verification ──────────────────────────
function verifyDocument(docType, fileSize, width, height) {
  const rules = DOC_RULES[docType];
  if (!rules) return { valid: false, reason: 'Type de document inconnu.' };

  // File size checks
  if (fileSize < rules.minSize) {
    const minKB = Math.round(rules.minSize / 1024);
    return {
      valid: false,
      reason: `Photo trop petite (${Math.round(fileSize / 1024)} KB). Minimum ${minKB} KB. Prenez une photo plus nette.`,
    };
  }
  if (fileSize > rules.maxSize) {
    const maxMB = Math.round(rules.maxSize / (1024 * 1024));
    return {
      valid: false,
      reason: `Photo trop lourde (${Math.round(fileSize / (1024 * 1024))} MB). Maximum ${maxMB} MB.`,
    };
  }

  // Resolution checks
  if (width < rules.minWidth || height < rules.minHeight) {
    return {
      valid: false,
      reason: `Resolution trop basse (${width}x${height}). Minimum ${rules.minWidth}x${rules.minHeight}. La photo est probablement floue.`,
    };
  }

  // Aspect ratio check (detect wrong orientation or wrong document)
  const aspect = width / height;
  if (aspect < rules.aspectMin || aspect > rules.aspectMax) {
    const isCard = docType.startsWith('cni') || docType === 'permis';
    const isPortrait = docType === 'casier_judiciaire';
    let hint = '';
    if (isCard && aspect < 1) {
      hint = 'La carte d\'identite doit etre photographiee en mode paysage (horizontal).';
    } else if (isPortrait && aspect > 1) {
      hint = 'Ce document doit etre photographie en mode portrait (vertical).';
    } else {
      hint = 'Le format de l\'image ne correspond pas au document attendu. Verifiez que vous prenez le bon document.';
    }
    return { valid: false, reason: hint };
  }

  // Basic blur detection via file size relative to resolution
  // A clear photo has more data per pixel than a blurry one
  const pixels = width * height;
  const bytesPerPixel = fileSize / pixels;
  if (bytesPerPixel < 0.15) {
    return {
      valid: false,
      reason: 'La photo semble floue ou de mauvaise qualite. Prenez la photo dans un endroit bien eclaire, sans bouger.',
    };
  }

  return { valid: true, reason: null };
}

// ── Pick image from camera or gallery ──────────
export async function pickDocumentImage(docType, useCamera = true) {
  // Request permissions
  if (useCamera) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'acces a la camera pour prendre des photos de vos documents.');
      return null;
    }
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Autorisez l\'acces a la galerie pour selectionner vos documents.');
      return null;
    }
  }

  const options = {
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: false,
    exif: false,
  };

  let result;
  if (useCamera) {
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const { uri, width, height, fileSize } = asset;

  // Estimate file size if not provided (web)
  let size = fileSize;
  if (!size) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      size = blob.size;
    } catch {
      size = 100 * 1024; // fallback estimate
    }
  }

  // ── Auto-verify ──
  const verification = verifyDocument(docType, size, width, height);
  if (!verification.valid) {
    return { rejected: true, reason: verification.reason };
  }

  return { uri, width, height, fileSize: size, rejected: false };
}

// ── Upload to Supabase Storage ─────────────────
export async function uploadDocument(driverId, docType, imageData) {
  const { uri, fileSize, width, height } = imageData;
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${driverId}/${docType}.${ext}`;

  try {
    // Fetch image as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('driver-docs')
      .upload(path, blob, {
        contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get file URL
    const { data: urlData } = supabase.storage
      .from('driver-docs')
      .getPublicUrl(path);

    const fileUrl = urlData?.publicUrl || path;

    // Upsert document record
    const { data, error } = await supabase
      .from('driver_documents')
      .upsert({
        driver_id: driverId,
        doc_type: docType,
        file_url: fileUrl,
        file_size: fileSize,
        file_width: width,
        file_height: height,
        status: 'pending',
        reject_reason: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'driver_id,doc_type' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Upload error:', e);
    throw e;
  }
}

// ── Load driver documents status ───────────────
export async function loadDriverDocuments(driverId) {
  try {
    const { data, error } = await supabase
      .from('driver_documents')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at');

    if (error) throw error;

    // Map by doc_type
    const docs = {};
    (data || []).forEach(d => { docs[d.doc_type] = d; });
    return docs;
  } catch (e) {
    console.warn('Load docs error:', e);
    return {};
  }
}

// ── Check if all required docs are uploaded and approved ──
export function getDocumentProgress(docs) {
  let uploaded = 0;
  let approved = 0;
  let rejected = 0;

  REQUIRED_DOCS.forEach(type => {
    const doc = docs[type];
    if (doc) {
      uploaded++;
      if (doc.status === 'approved') approved++;
      if (doc.status === 'rejected') rejected++;
    }
  });

  return {
    total: REQUIRED_DOCS.length,
    uploaded,
    approved,
    rejected,
    pending: uploaded - approved - rejected,
    complete: uploaded === REQUIRED_DOCS.length,
    allApproved: approved === REQUIRED_DOCS.length,
    progress: uploaded / REQUIRED_DOCS.length,
  };
}
