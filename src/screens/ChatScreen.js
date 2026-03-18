import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { tapLight } from '../lib/haptics';
import { notifyDriverNewMessage, notifyPassengerNewMessage } from '../lib/notifications';

const QUICK_MESSAGES = [
  'Je suis en route',
  'Je suis arrive',
  "J'arrive dans 2 min",
  'Ou etes-vous ?',
  'OK merci',
];

export default function ChatScreen({ route, navigation }) {
  const { rideId, otherName, otherRole } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    loadMessages();
    markAsRead();

    // Realtime subscription
    const ch = supabase.channel(`chat-${rideId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `ride_id=eq.${rideId}`,
      }, ({ new: msg }) => {
        setMessages(prev => [...prev, msg]);
        // Mark incoming as read
        if (msg.sender_id !== user?.id) {
          supabase.from('messages').update({ read: true }).eq('id', msg.id).then(() => {});
        }
      })
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [rideId]);

  const loadMessages = async () => {
    const { data } = await supabase.from('messages')
      .select('*')
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const markAsRead = async () => {
    if (!user?.id) return;
    await supabase.from('messages')
      .update({ read: true })
      .eq('ride_id', rideId)
      .neq('sender_id', user.id)
      .eq('read', false);
  };

  const sendMessage = async (content) => {
    const msg = content || text.trim();
    if (!msg || sending) return;
    setSending(true);
    tapLight();
    setText('');

    try {
      await supabase.from('messages').insert({
        ride_id: rideId,
        sender_id: user.id,
        content: msg,
      });
      // Push notification to the other participant
      if (rideId) {
        const { data: rideData } = await supabase.from('rides')
          .select('passenger_id, driver_id').eq('id', rideId).single();
        if (rideData) {
          const { data: senderProfile } = await supabase.from('profiles')
            .select('nom').eq('id', user.id).single();
          const senderName = senderProfile?.nom || otherRole === 'passager' ? 'Chauffeur' : 'Passager';
          if (otherRole === 'passager' && rideData.passenger_id) {
            notifyPassengerNewMessage(rideData.passenger_id, senderName, msg);
          } else if (rideData.driver_id) {
            notifyDriverNewMessage(rideData.driver_id, senderName, msg);
          }
        }
      }
    } catch (e) {
      console.warn('Send message error:', e);
      setText(msg); // Restore text on error
    }
    setSending(false);
  };

  const formatTime = (d) => {
    const date = new Date(d);
    return `${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const renderMessage = useCallback(({ item }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[msgStyles.row, isMe && msgStyles.rowMe]}>
        <View style={[msgStyles.bubble, isMe ? msgStyles.bubbleMe : msgStyles.bubbleOther]}>
          <Text style={[msgStyles.text, isMe && msgStyles.textMe]}>{item.content}</Text>
          <View style={msgStyles.meta}>
            <Text style={[msgStyles.time, isMe && msgStyles.timeMe]}>{formatTime(item.created_at)}</Text>
            {isMe && (
              <Ionicons
                name={item.read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.read ? COLORS.green : 'rgba(255,255,255,0.4)'}
              />
            )}
          </View>
        </View>
      </View>
    );
  }, [user?.id]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { tapLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerInit}>{(otherName || 'U')[0]}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{otherName || 'Chat'}</Text>
            <Text style={styles.headerRole}>{otherRole === 'chauffeur' ? 'Chauffeur' : 'Passager'}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={40} color={COLORS.dim2} />
              <Text style={styles.emptyText}>Envoyez un message</Text>
            </View>
          }
        />

        {/* Quick messages */}
        <FlatList
          horizontal
          data={QUICK_MESSAGES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() => sendMessage(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickTxt}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={COLORS.dim2}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!text.trim() || sending}
          >
            <Ionicons name="send" size={20} color={text.trim() ? '#fff' : COLORS.dim2} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const msgStyles = StyleSheet.create({
  row: { marginBottom: 6, paddingHorizontal: 16 },
  rowMe: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMe: {
    backgroundColor: COLORS.green,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 14, color: COLORS.white, lineHeight: 20 },
  textMe: { color: '#fff' },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  time: { fontSize: 10, color: COLORS.dim },
  timeMe: { color: 'rgba(255,255,255,0.7)' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: Platform.OS === 'ios' ? 54 : 38,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1, borderColor: COLORS.greenBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  headerInit: { fontSize: 14, fontWeight: '800', color: COLORS.green },
  headerName: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  headerRole: { fontSize: 11, color: COLORS.dim },
  list: { paddingVertical: 16, flexGrow: 1 },
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: 12,
  },
  emptyText: { fontSize: 14, color: COLORS.dim },
  quickList: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  quickBtn: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 20, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.line,
  },
  quickTxt: { fontSize: 12, color: COLORS.dim, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1, borderTopColor: COLORS.line,
  },
  input: {
    flex: 1, backgroundColor: COLORS.card,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.line,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: COLORS.white,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.card },
});
