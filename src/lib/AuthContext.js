import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Récupérer la session persistée
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setIsGuest(false);
        fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setIsGuest(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found (profil pas encore créé)
        console.warn('Erreur chargement profil:', error.message);
      }
      if (data) setProfile(data);
    } catch (e) {
      console.warn('Erreur profil:', e);
    }
  }, []);

  // Envoyer le code OTP par SMS
  const sendOTP = async (phone) => {
    const cleaned = phone.replace(/\s/g, '');
    if (!cleaned.match(/^\+221[0-9]{9}$/)) {
      throw new Error('Numéro invalide. Format: +221 XX XXX XX XX');
    }
    const { error } = await supabase.auth.signInWithOtp({ phone: cleaned });
    if (error) {
      if (error.message.includes('rate')) {
        throw new Error('Trop de tentatives. Attendez avant de réessayer.');
      }
      throw new Error(error.message || "Impossible d'envoyer le code SMS");
    }
  };

  // Vérifier le code OTP
  const verifyOTP = async (phone, token) => {
    const cleaned = phone.replace(/\s/g, '');
    if (!token || token.length !== 6) {
      throw new Error('Entrez le code à 6 chiffres');
    }
    const { data, error } = await supabase.auth.verifyOtp({
      phone: cleaned,
      token,
      type: 'sms',
    });
    if (error) {
      if (error.message.includes('expired')) {
        throw new Error('Code expiré. Demandez un nouveau code.');
      }
      if (error.message.includes('invalid')) {
        throw new Error('Code invalide. Vérifiez et réessayez.');
      }
      throw new Error(error.message || 'Vérification échouée');
    }
    return data;
  };

  // Créer ou mettre à jour le profil
  const createProfile = async (profileData) => {
    if (!user) throw new Error('Utilisateur non connecté');
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        phone: user.phone,
        updated_at: new Date().toISOString(),
        ...profileData,
      })
      .select()
      .single();
    if (error) throw new Error(error.message || 'Impossible de sauvegarder le profil');
    setProfile(data);
    return data;
  };

  // Mettre à jour la position GPS
  const updateLocation = async (latitude, longitude) => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ latitude, longitude, updated_at: new Date().toISOString() })
      .eq('id', user.id);
  };

  // Mode invité (sans compte)
  const enterGuestMode = () => {
    setIsGuest(true);
  };

  const exitGuestMode = () => {
    setIsGuest(false);
  };

  // Déconnexion
  const signOut = async () => {
    if (isGuest) {
      setIsGuest(false);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) console.warn('Erreur déconnexion:', error.message);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isGuest,
      isAuthenticated: !!user,
      sendOTP,
      verifyOTP,
      createProfile,
      updateLocation,
      enterGuestMode,
      exitGuestMode,
      signOut,
      fetchProfile: () => user && fetchProfile(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
