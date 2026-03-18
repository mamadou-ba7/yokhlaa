import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { tapLight, notifySuccess, selectionChanged } from '../lib/haptics';

const RATING_LABELS = {
  5: 'Excellent !',
  4: 'Tres bien',
  3: 'Correct',
  2: 'Pas top',
  1: 'Mauvais',
};

const QUICK_TAGS = [
  { id: 'clean', label: 'Propre', icon: 'sparkles-outline' },
  { id: 'polite', label: 'Poli', icon: 'happy-outline' },
  { id: 'fast', label: 'Rapide', icon: 'flash-outline' },
  { id: 'safe', label: 'Prudent', icon: 'shield-checkmark-outline' },
  { id: 'music', label: 'Bonne musique', icon: 'musical-notes-outline' },
];

export default function RatingModal({ visible, onClose, onSubmit, driverName, ridePrice }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const slideAnim = useRef(new Animated.Value(300)).current;
  const starScales = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSubmitted(false);
      setRating(5);
      setComment('');
      setSelectedTags([]);
      slideAnim.setValue(300);
      successScale.setValue(0);
      successOpacity.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    }
  }, [visible]);

  const animateStar = (index) => {
    Animated.sequence([
      Animated.timing(starScales[index], { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.spring(starScales[index], { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  };

  const handleStarPress = (i) => {
    selectionChanged();
    setRating(i);
    animateStar(i - 1);
  };

  const toggleTag = (id) => {
    tapLight();
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const submit = () => {
    tapLight();
    // Build comment with tags
    const tags = selectedTags.map(id => QUICK_TAGS.find(t => t.id === id)?.label).filter(Boolean);
    const fullComment = [
      tags.length > 0 ? tags.join(', ') : '',
      comment,
    ].filter(Boolean).join(' — ');

    // Show success animation
    setSubmitted(true);
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      notifySuccess();
      setTimeout(() => {
        onSubmit({ rating, comment: fullComment });
      }, 800);
    });
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={s.overlay}>
        <Animated.View style={[s.modal, { transform: [{ translateY: slideAnim }] }]}>
          <View style={s.handle} />

          {submitted ? (
            /* Success state */
            <Animated.View style={[s.successWrap, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
              <View style={s.successCircle}>
                <Ionicons name="checkmark" size={40} color="#fff" />
              </View>
              <Text style={s.successTitle}>Merci !</Text>
              <Text style={s.successSub}>Votre avis aide a ameliorer Yokh Laa</Text>
            </Animated.View>
          ) : (
            /* Rating form */
            <>
              <Text style={s.title}>Comment etait votre course ?</Text>
              <Text style={s.subtitle}>Evaluez {driverName || 'votre chauffeur'}</Text>

              {ridePrice && (
                <View style={s.priceBadge}>
                  <Text style={s.priceText}>{ridePrice.toLocaleString()} FCFA</Text>
                </View>
              )}

              {/* Stars */}
              <View style={s.stars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <TouchableOpacity key={i} onPress={() => handleStarPress(i)} activeOpacity={0.7}>
                    <Animated.View style={{ transform: [{ scale: starScales[i - 1] }] }}>
                      <Ionicons
                        name={i <= rating ? 'star' : 'star-outline'}
                        size={42}
                        color={i <= rating ? '#FFB800' : COLORS.dim2}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={s.ratingLabel}>{RATING_LABELS[rating]}</Text>

              {/* Quick tags */}
              <View style={s.tags}>
                {QUICK_TAGS.map(tag => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[s.tag, active && s.tagActive]}
                      onPress={() => toggleTag(tag.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={tag.icon} size={14} color={active ? COLORS.green : COLORS.dim} />
                      <Text style={[s.tagTxt, active && s.tagTxtActive]}>{tag.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Comment */}
              <TextInput
                style={s.input}
                placeholder="Un commentaire ? (optionnel)"
                placeholderTextColor={COLORS.dim2}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={200}
              />

              {/* Submit */}
              <TouchableOpacity style={s.btn} onPress={submit} activeOpacity={0.85}>
                <Text style={s.btnTxt}>Envoyer</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.skip} onPress={handleClose}>
                <Text style={s.skipTxt}>Passer</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.black,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: COLORS.line,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    alignItems: 'center',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.dim2, marginTop: 10, marginBottom: 20,
  },
  title: {
    fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 4,
  },
  subtitle: {
    fontSize: 14, color: COLORS.dim, marginBottom: 12,
  },
  priceBadge: {
    backgroundColor: COLORS.greenLight,
    borderWidth: 1, borderColor: COLORS.greenBorder,
    borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14,
    marginBottom: 16,
  },
  priceText: { fontSize: 15, fontWeight: '700', color: COLORS.green },
  stars: {
    flexDirection: 'row', gap: 14, marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 14, fontWeight: '600', color: COLORS.green, marginBottom: 16,
  },
  tags: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 8, marginBottom: 16, width: '100%',
  },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: 20, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.line,
  },
  tagActive: {
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.greenBorder,
  },
  tagTxt: { fontSize: 12, fontWeight: '600', color: COLORS.dim },
  tagTxtActive: { color: COLORS.green },
  input: {
    width: '100%', backgroundColor: COLORS.card,
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.line,
    padding: 16, fontSize: 14, color: COLORS.white,
    minHeight: 70, textAlignVertical: 'top', marginBottom: 16,
  },
  btn: {
    width: '100%', backgroundColor: COLORS.green,
    borderRadius: 14, paddingVertical: 17, alignItems: 'center',
    marginBottom: 10,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  btnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  skip: { paddingVertical: 8 },
  skipTxt: { fontSize: 14, color: COLORS.dim },

  // Success
  successWrap: { alignItems: 'center', paddingVertical: 40 },
  successCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginBottom: 6 },
  successSub: { fontSize: 14, color: COLORS.dim },
});
