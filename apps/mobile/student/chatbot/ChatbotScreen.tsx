import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Animated, Keyboard,
  KeyboardAvoidingView, Platform, StatusBar, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bot, X, Send, Plus, History, ChevronLeft, Trash2, MessageSquare } from 'lucide-react-native';
import { useConversation, ChatMessage, Conversation } from './useConversation';
import { colors, radius, spacing, typography } from '@nermai/theme';

// ─── Constants ────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'What topics are covered this week?',
  'Show me my upcoming live classes',
  'Summarize my recent course progress',
  'Find notes on Indian Polity',
  'When is the next live session?',
  'What assignments are due?',
];

// ─── Typing animation dots ────────────────────────────────────────────────────
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
    <View style={styles.typingWrapper}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.typingDot, { opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }]}
        />
      ))}
    </View>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg }: { msg: ChatMessage }) => {
  const isUser = msg.sender === 'user';

  // Render structured payload cards if available
  const renderContent = () => {
    if (isUser || !msg.payload || typeof msg.payload !== 'object') {
      return <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{msg.text}</Text>;
    }
    const p = msg.payload;
    if (p.items && Array.isArray(p.items) && p.items.length > 0) {
      return (
        <View>
          {p.title && <Text style={styles.cardTitle}>{p.title}</Text>}
          <Text style={styles.bubbleText}>{p.text || msg.text}</Text>
          <View style={styles.itemList}>
            {p.items.slice(0, 5).map((item: any, i: number) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemDot} />
                <Text style={styles.itemText}>{item.title || item.name || item}</Text>
              </View>
            ))}
          </View>
          {p.actions && p.actions.length > 0 && (
            <View style={styles.actionChips}>
              {p.actions.map((a: any, i: number) => (
                <View key={i} style={styles.actionChip}>
                  <Text style={styles.actionChipText}>{a.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }
    return <Text style={styles.bubbleText}>{p.text || msg.text}</Text>;
  };

  return (
    <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Bot size={14} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {renderContent()}
        <Text style={styles.timestamp}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

// ─── History Sidebar ──────────────────────────────────────────────────────────
const HistorySidebar = ({
  visible, onClose, groupedConversations, activeConvId, onSelect, onDelete, onNewChat
}: {
  visible: boolean;
  onClose: () => void;
  groupedConversations: () => { title: string; data: Conversation[] }[];
  activeConvId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}) => {
  const translateX = useRef(new Animated.Value(-300)).current;
  useEffect(() => {
    Animated.spring(translateX, {
      toValue: visible ? 0 : -300,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [visible]);

  const groups = groupedConversations();

  return (
    <>
      {visible && (
        <TouchableOpacity style={styles.sidebarOverlay} onPress={onClose} activeOpacity={1} />
      )}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Chat History</Text>
            <TouchableOpacity onPress={onClose} style={styles.sidebarClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.newChatBtn} onPress={onNewChat} activeOpacity={0.8}>
            <Plus size={16} color={colors.background} />
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {groups.length === 0 ? (
              <View style={styles.sidebarEmpty}>
                <MessageSquare size={32} color={colors.textSecondary} strokeWidth={1} />
                <Text style={styles.sidebarEmptyText}>No conversations yet</Text>
              </View>
            ) : (
              groups.map(group => (
                <View key={group.title}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  {group.data.map(conv => (
                    <TouchableOpacity
                      key={conv.id}
                      style={[styles.convItem, activeConvId === conv.id && styles.convItemActive]}
                      onPress={() => { onSelect(conv.id); onClose(); }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.convTitle} numberOfLines={1}>{conv.title}</Text>
                        <Text style={styles.convMeta}>{conv.messages.length} messages</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => onDelete(conv.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.deleteConvBtn}
                      >
                        <Trash2 size={14} color={colors.accent} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </>
  );
};

// ─── Main ChatbotScreen ───────────────────────────────────────────────────────
export const ChatbotScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  const courseContext = route?.params?.courseContext;
  const {
    activeConversation, activeConvId, loading,
    sendMessage, createConversation, deleteConversation,
    setActiveConvId, groupedConversations,
  } = useConversation();

  const [input, setInput] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [activeConversation?.messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    Keyboard.dismiss();
    sendMessage(text, courseContext);
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text, courseContext);
  };

  const handleNewChat = () => {
    createConversation();
    setSidebarVisible(false);
  };

  const messages = activeConversation?.messages || [];
  const showWelcome = messages.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* History Sidebar */}
      <HistorySidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        groupedConversations={groupedConversations}
        activeConvId={activeConvId}
        onSelect={setActiveConvId}
        onDelete={deleteConversation}
        onNewChat={handleNewChat}
      />

      {/* Top Bar */}
      <SafeAreaView>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.topBarBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <View style={styles.topBarAvatar}>
              <Bot size={18} color="#fff" />
            </View>
            <View>
              <Text style={styles.topBarTitle}>NERMAI AI</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.topBarBtn}>
            <History size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Chat Area */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showWelcome ? (
            <View style={styles.welcome}>
              <View style={styles.welcomeIcon}>
                <Bot size={36} color={colors.primary} />
              </View>
              <Text style={styles.welcomeTitle}>How can I help you?</Text>
              <Text style={styles.welcomeSubtitle}>
                Ask me about your courses, live classes, notes, or anything else.
              </Text>

              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => handleSuggestion(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {loading && (
                <View style={[styles.msgRow]}>
                  <View style={styles.avatar}><Bot size={14} color="#fff" /></View>
                  <View style={styles.bubbleAssistant}>
                    <TypingIndicator />
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Input Row */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.newConvBtn} onPress={handleNewChat} activeOpacity={0.7}>
            <Plus size={20} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask a question..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Top Bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', backgroundColor: colors.surface },
  topBarBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topBarCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topBarAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  onlineText: { fontSize: 10, color: '#4CAF50' },

  // Chat
  chatArea: { flex: 1 },
  chatContent: { padding: spacing.md, paddingBottom: spacing.xl },

  // Welcome
  welcome: { alignItems: 'center', paddingTop: 40 },
  welcomeIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: `${colors.primary}18`, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: `${colors.primary}30`, marginBottom: spacing.lg },
  welcomeTitle: { fontSize: typography.sizes.h2, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.sm },
  welcomeSubtitle: { fontSize: typography.sizes.body2, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  suggestions: { marginTop: spacing.xl, width: '100%', gap: spacing.sm },
  suggestionChip: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  suggestionText: { color: colors.textPrimary, fontSize: typography.sizes.body2 },

  // Messages
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.md, gap: spacing.sm },
  msgRowUser: { flexDirection: 'row-reverse' },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: 18 },
  bubbleUser: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  bubbleText: { color: colors.textPrimary, fontSize: typography.sizes.body2, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  timestamp: { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'right' },
  cardTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 6 },
  itemList: { marginTop: 6, gap: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  itemText: { color: colors.textPrimary, fontSize: 13 },
  actionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  actionChip: { backgroundColor: `${colors.primary}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: `${colors.primary}40` },
  actionChipText: { color: colors.primary, fontSize: 12 },

  // Typing
  typingWrapper: { flexDirection: 'row', gap: 4, paddingVertical: 4, paddingHorizontal: 2 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.primary },

  // Input
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', backgroundColor: colors.surface },
  newConvBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: `${colors.primary}20`, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: `${colors.primary}30` },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.textPrimary, fontSize: typography.sizes.body2, maxHeight: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },

  // Sidebar
  sidebarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 },
  sidebar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 280, backgroundColor: colors.surface, zIndex: 11, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)' },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  sidebarTitle: { fontSize: typography.sizes.h3, fontWeight: '700', color: colors.textPrimary },
  sidebarClose: { padding: 4 },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, margin: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md },
  newChatText: { color: colors.background, fontWeight: '700', fontSize: 14 },
  sidebarEmpty: { alignItems: 'center', padding: spacing.xxl },
  sidebarEmptyText: { color: colors.textSecondary, marginTop: spacing.md },
  groupTitle: { fontSize: 10, color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  convItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  convItemActive: { backgroundColor: `${colors.primary}15`, borderLeftWidth: 2, borderLeftColor: colors.primary },
  convTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  convMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  deleteConvBtn: { padding: 6 },
});
