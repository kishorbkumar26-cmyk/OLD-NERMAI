import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Animated, Keyboard,
  KeyboardAvoidingView, Platform, SafeAreaView
} from 'react-native';
import { Bot, Send, Plus, History, ChevronLeft, Trash2, MessageSquare, Shield } from 'lucide-react-native';
import { AssistantApi } from '@nermai/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius, spacing, typography } from '@nermai/theme';

// Reuse the same conversation engine but with admin-specific storage key
const ADMIN_CONV_KEY = 'admin_chatbot_conversations';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

const ADMIN_SUGGESTIONS = [
  'How many students enrolled today?',
  'Show pending access requests',
  'Summarize recent announcements',
  'List upcoming live sessions',
  'What resources were uploaded this week?',
];

const TypingIndicator = () => {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 150),
        Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 4, padding: 8 }}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={[styles.typingDot, { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]} />
      ))}
    </View>
  );
};

export const AdminAssistant = ({ navigation }: { navigation?: any }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem(ADMIN_CONV_KEY).then(raw => {
      if (raw) setMessages(JSON.parse(raw));
    });
  }, []);

  const persist = async (msgs: ChatMessage[]) => {
    try {
      await AsyncStorage.setItem(ADMIN_CONV_KEY, JSON.stringify(msgs.slice(-100)));
    } catch (e) {}
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    Keyboard.dismiss();

    const userMsg: ChatMessage = { id: `${Date.now()}_u`, sender: 'user', text, timestamp: Date.now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    persist(updated);
    setLoading(true);

    try {
      const res = await AssistantApi.chat(text);
      const responseData = res.data?.data;
      const responseText =
        typeof responseData === 'string' ? responseData :
        responseData?.text || responseData?.message || 'I processed your request.';
      const assistantMsg: ChatMessage = { id: `${Date.now()}_a`, sender: 'assistant', text: responseText, timestamp: Date.now() };
      const final = [...updated, assistantMsg];
      setMessages(final);
      persist(final);
    } catch {
      const errMsg: ChatMessage = { id: `${Date.now()}_e`, sender: 'assistant', text: "Sorry, I couldn't reach the server.", timestamp: Date.now() };
      const final = [...updated, errMsg];
      setMessages(final);
      persist(final);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearHistory = async () => {
    setMessages([]);
    await AsyncStorage.removeItem(ADMIN_CONV_KEY);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Bot size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Admin Assistant</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={clearHistory} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Trash2 size={16} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Chat Area */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.welcome}>
              <View style={styles.welcomeIcon}>
                <Shield size={32} color={colors.primary} />
              </View>
              <Text style={styles.welcomeTitle}>Admin AI Assistant</Text>
              <Text style={styles.welcomeSubtitle}>Ask about students, sessions, analytics, or announcements.</Text>
              <View style={styles.suggestions}>
                {ADMIN_SUGGESTIONS.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.chip} onPress={() => handleSend(s)} activeOpacity={0.7}>
                    <Text style={styles.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              {messages.map(msg => (
                <View key={msg.id} style={[styles.msgRow, msg.sender === 'user' && styles.msgRowUser]}>
                  {msg.sender !== 'user' && <View style={styles.msgAvatar}><Bot size={13} color="#fff" /></View>}
                  <View style={[styles.bubble, msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                    <Text style={[styles.bubbleText, msg.sender === 'user' && styles.bubbleTextUser]}>{msg.text}</Text>
                    <Text style={styles.timestamp}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
              ))}
              {loading && (
                <View style={styles.msgRow}>
                  <View style={styles.msgAvatar}><Bot size={13} color="#fff" /></View>
                  <View style={styles.bubbleAssistant}><TypingIndicator /></View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask the admin assistant..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => handleSend(input)}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <Send size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', backgroundColor: colors.surface },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4CAF50' },
  onlineText: { fontSize: 10, color: '#4CAF50' },
  clearBtn: { padding: 6 },
  chatArea: { flex: 1 },
  chatContent: { padding: spacing.md, paddingBottom: spacing.xl },
  welcome: { alignItems: 'center', paddingTop: 40 },
  welcomeIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: `${colors.primary}18`, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: `${colors.primary}30`, marginBottom: spacing.md },
  welcomeTitle: { fontSize: typography.sizes.h2, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.xs },
  welcomeSubtitle: { fontSize: typography.sizes.body2, color: colors.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  suggestions: { marginTop: spacing.xl, width: '100%', gap: spacing.sm },
  chip: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  chipText: { color: colors.textPrimary, fontSize: typography.sizes.body2 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.md, gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: 16 },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  bubbleText: { color: colors.textPrimary, fontSize: typography.sizes.body2, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  timestamp: { fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 4, textAlign: 'right' },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.textPrimary, fontSize: typography.sizes.body2, maxHeight: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
});
