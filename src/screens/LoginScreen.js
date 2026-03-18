import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, Animated,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES } from '../constants/theme';
import GreenButton from '../components/GreenButton';
import { useAuth } from '../lib/AuthContext';
import { notifySuccess, notifyError, tapLight } from '../lib/haptics';

const RESEND_DELAY = 60;

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('+221 ');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const timerRef = useRef(null);
  const otpRef = useRef(null);
  const { sendOTP, verifyOTP } = useAuth();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const formFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = () => {
    setCountdown(RESEND_DELAY);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); timerRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Formater le numéro automatiquement : +221 77 123 45 67
  const formatPhone = (text) => {
    // Garder seulement les chiffres et le +
    let digits = text.replace(/[^\d+]/g, '');
    if (!digits.startsWith('+221')) digits = '+221';
    const local = digits.slice(4); // après +221
    if (local.length === 0) return '+221 ';
    if (local.length <= 2) return `+221 ${local}`;
    if (local.length <= 5) return `+221 ${local.slice(0, 2)} ${local.slice(2)}`;
    if (local.length <= 7) return `+221 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    return `+221 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
  };

  const handlePhoneChange = (text) => {
    setError('');
    setPhone(formatPhone(text));
  };

  const handleOtpChange = (text) => {
    setError('');
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
  };

  const getCleanPhone = () => phone.replace(/\s/g, '');

  const shakeError = () => {
    notifyError();
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleSendOTP = async () => {
    const cleaned = getCleanPhone();
    if (!cleaned.match(/^\+221[0-9]{9}$/)) {
      setError('Entrez un numéro valide à 9 chiffres');
      shakeError();
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendOTP(cleaned);
      tapLight();
      // Animate transition to OTP step
      Animated.timing(formFade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setStep('otp');
        startCountdown();
        Animated.timing(formFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
        setTimeout(() => otpRef.current?.focus(), 300);
      });
    } catch (e) {
      setError(e.message);
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError('');
    try {
      await sendOTP(getCleanPhone());
      startCountdown();
      setOtp('');
      Alert.alert('Code renvoyé', 'Un nouveau code a été envoyé par SMS.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      setError('Entrez les 6 chiffres du code');
      shakeError();
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOTP(getCleanPhone(), otp);
      notifySuccess();
      // La navigation est gérée automatiquement par le changement d'état auth dans App.js
    } catch (e) {
      setError(e.message);
      shakeError();
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>Yokh<Text style={{ color: COLORS.green }}>Laa</Text></Text>
          <Text style={styles.subtitle}>Transport Dakar sans commission</Text>
        </View>

        {step === 'phone' ? (
          <Animated.View style={[styles.formWrap, { opacity: formFade, transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.desc}>
              Entrez votre numéro de téléphone. Vous recevrez un code par SMS.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>NUMÉRO DE TÉLÉPHONE</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="+221 77 000 00 00"
                placeholderTextColor={COLORS.dim2}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <GreenButton
              title="Recevoir le code SMS"
              onPress={handleSendOTP}
              loading={loading}
              style={{ marginTop: 12 }}
            />

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => { tapLight(); navigation.goBack(); }}
            >
              <Text style={styles.backText}>Retour</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.formWrap, { opacity: formFade, transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.title}>Vérification</Text>
            <Text style={styles.desc}>
              Entrez le code à 6 chiffres envoyé au{'\n'}
              <Text style={{ color: COLORS.white, fontWeight: '600' }}>{phone}</Text>
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>CODE SMS</Text>
              <TextInput
                ref={otpRef}
                style={[styles.input, styles.otpInput, error ? styles.inputError : null]}
                value={otp}
                onChangeText={handleOtpChange}
                placeholder="000000"
                placeholderTextColor={COLORS.dim2}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <GreenButton
              title="Vérifier le code"
              onPress={handleVerifyOTP}
              loading={loading}
              style={{ marginTop: 12 }}
            />

            <View style={styles.otpActions}>
              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleResendOTP}
                disabled={countdown > 0}
              >
                <Text style={[styles.resendText, countdown > 0 && { color: COLORS.dim2 }]}>
                  {countdown > 0 ? `Renvoyer le code (${countdown}s)` : 'Renvoyer le code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.changeBtn} onPress={() => {
                tapLight();
                Animated.timing(formFade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
                  setStep('phone'); setOtp(''); setError('');
                  Animated.timing(formFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
                });
              }}>
                <Text style={styles.changeText}>Changer de numéro</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  inner: { flex: 1, justifyContent: 'center', padding: SIZES.padding },
  logoWrap: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 36, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 14, color: COLORS.dim, marginTop: 6 },
  formWrap: {},
  title: { fontSize: 28, fontWeight: '800', color: COLORS.white, marginBottom: 8 },
  desc: { fontSize: 14, color: COLORS.dim, lineHeight: 22, marginBottom: 24 },
  formGroup: { marginBottom: 8 },
  label: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.5,
    color: COLORS.dim, textTransform: 'uppercase', marginBottom: 7,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: COLORS.line, borderRadius: 10,
    padding: 16, fontSize: 18, color: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.red,
  },
  otpInput: {
    fontSize: 28, fontWeight: '700', textAlign: 'center', letterSpacing: 8,
  },
  errorText: {
    color: COLORS.red, fontSize: 13, marginTop: 6, marginBottom: 4,
  },
  backBtn: { alignItems: 'center', marginTop: 20 },
  backText: { fontSize: 14, color: COLORS.dim, textDecorationLine: 'underline' },
  otpActions: { alignItems: 'center', marginTop: 20, gap: 12 },
  resendBtn: {},
  resendText: { fontSize: 14, color: COLORS.green },
  changeBtn: {},
  changeText: { fontSize: 14, color: COLORS.dim },
});
