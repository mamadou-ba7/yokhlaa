import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../lib/AuthContext';
import AnimatedScreen, { AnimatedListItem } from '../components/AnimatedScreen';
import { tapLight } from '../lib/haptics';

export default function ProfileScreen({ navigation }) {
  const { user, profile, signOut, switchRole } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    const parent = navigation.getParent();
    if (parent) {
      parent.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    }
  };

  const isDriver = profile?.role === 'chauffeur';

  const handleSwitchRole = async () => {
    tapLight();
    const newRole = isDriver ? 'passager' : 'chauffeur';
    const label = isDriver ? 'passager' : 'chauffeur';
    try {
      await switchRole(newRole);
    } catch (e) {
      // If no driver info yet, prompt
      if (!isDriver && !profile?.vehicule) {
        navigation.getParent()?.navigate('RoleSelect');
      }
    }
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Informations personnelles', screen: 'EditProfile' },
    ...(isDriver ? [{ icon: 'document-text-outline', label: 'Mes documents', screen: 'DriverDocuments' }] : []),
    { icon: 'help-circle-outline', label: 'Aide', screen: 'Help' },
    { icon: 'information-circle-outline', label: 'A propos', screen: 'About' },
  ];

  const navigateTo = (screen) => {
    tapLight();
    if (screen) navigation.getParent()?.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView>
        <AnimatedScreen>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        {/* Avatar + Name */}
        <TouchableOpacity style={styles.profileCard} onPress={() => navigateTo('EditProfile')} activeOpacity={0.7}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.nom?.[0]?.toUpperCase() || user?.phone?.[4] || 'Y'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.nom || 'Utilisateur Yokh Laa'}
            </Text>
            <Text style={styles.profilePhone}>
              {user?.phone || 'Non connecte'}
            </Text>
          </View>
          <View style={styles.editBtn}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.dim} />
          </View>
        </TouchableOpacity>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <AnimatedListItem key={i} index={i}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => navigateTo(item.screen)}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={COLORS.white} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.dim2} />
            </TouchableOpacity>
            </AnimatedListItem>
          ))}
        </View>

        {/* Switch role — only for registered drivers */}
        {user && profile?.vehicule && profile?.plaque && (
          <TouchableOpacity style={styles.switchBtn} onPress={handleSwitchRole} activeOpacity={0.7}>
            <Ionicons name={isDriver ? 'person' : 'car'} size={20} color={COLORS.green} />
            <View style={{ flex: 1 }}>
              <Text style={styles.switchText}>Passer en mode {isDriver ? 'passager' : 'chauffeur'}</Text>
              <Text style={styles.switchSub}>{isDriver ? 'Commander une course' : 'Recevoir des courses'}</Text>
            </View>
            <Ionicons name="swap-horizontal" size={20} color={COLORS.green} />
          </TouchableOpacity>
        )}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
          <Text style={styles.signOutText}>Se deconnecter</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Yokh Laa v1.0.0</Text>
        </AnimatedScreen>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24, fontWeight: '800', color: COLORS.white,
  },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginBottom: 24,
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 18,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
  profilePhone: { fontSize: 13, color: COLORS.dim },
  editBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  menu: {
    marginHorizontal: 20, backgroundColor: COLORS.card,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.line,
    overflow: 'hidden', marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.white },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, paddingVertical: 16, paddingHorizontal: 18,
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)', backgroundColor: 'rgba(34,197,94,0.05)',
    marginBottom: 12,
  },
  switchText: { fontSize: 15, fontWeight: '600', color: COLORS.green },
  switchSub: { fontSize: 12, color: COLORS.dim, marginTop: 2 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, paddingVertical: 16,
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)',
    marginBottom: 16,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: COLORS.red },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.dim2, marginBottom: 32 },
});
