import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Platform, ScrollView, Alert, KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function EditProfileScreen({ navigation }) {
  const { user, profile, fetchProfile } = useAuth();
  const [nom, setNom] = useState(profile?.nom || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!nom.trim()) { Alert.alert('Erreur', 'Le nom est requis'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        nom: nom.trim(),
        email: email.trim() || null,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      if (error) throw error;
      await fetchProfile(user.id);
      Alert.alert('Succes', 'Profil mis a jour');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de sauvegarder');
    }
    setSaving(false);
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Informations</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content}>
          {/* Avatar */}
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{nom?.[0]?.toUpperCase() || 'Y'}</Text>
            </View>
          </View>

          {/* Fields */}
          <View style={s.field}>
            <Text style={s.label}>Nom complet</Text>
            <TextInput style={s.input} value={nom} onChangeText={setNom} placeholder="Votre nom" placeholderTextColor={COLORS.dim2} />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Telephone</Text>
            <View style={[s.input, s.inputDisabled]}>
              <Text style={s.disabledTxt}>{user?.phone || 'Non defini'}</Text>
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Email (optionnel)</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="votre@email.com" placeholderTextColor={COLORS.dim2} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <TouchableOpacity style={s.btn} onPress={save} disabled={saving} activeOpacity={0.85}>
            <Text style={s.btnTxt}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  back: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  content: { padding: 20 },
  avatarWrap: { alignItems: 'center', marginBottom: 30 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 32, fontWeight: '800', color: '#fff' },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.dim, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line,
    paddingVertical: 15, paddingHorizontal: 16,
    fontSize: 15, color: COLORS.white,
  },
  inputDisabled: { backgroundColor: COLORS.surface },
  disabledTxt: { fontSize: 15, color: COLORS.dim },
  btn: {
    backgroundColor: COLORS.green, borderRadius: 14,
    paddingVertical: 17, alignItems: 'center', marginTop: 10,
  },
  btnTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
