import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocalAssistantEngine } from '../../services/assistant/LocalAssistantEngine';
import { useAuth } from '../../core/auth/AuthProvider';
import { useNavigation } from '@react-navigation/native';


interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  type?: 'faq' | 'resource_list' | 'quick_actions';
  items?: any[];
  title?: string;
}

export const AssistantScreen = () => {
  const { tenantId } = useAuth();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickActions, setQuickActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // We instantiate the local engine for offline queries
  const engineRef = useRef(new LocalAssistantEngine());

  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    if (!tenantId) return;
    const actions = await engineRef.current.getQuickActions(tenantId);
    setQuickActions(actions);

    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: 'Hi there! I am the NERMAI Assistant. How can I help you today?',
        type: 'quick_actions'
      }
    ]);
  };

  const handleAction = async (action: any) => {
    if (action.type === 'NAVIGATE' || action.intent?.startsWith('/view_')) {
       // example: /view_courses
       const routeMap: any = {
         '/view_courses': 'MyCourses',
         '/view_live_schedule': 'LiveClasses',
         '/view_announcements': 'Announcements'
       };
       const route = routeMap[action.intent];
       if (route) navigation.navigate(route);
       return;
    }

    if (action.type === 'OPEN_RESOURCE' || action.id?.startsWith('res_')) {
       navigation.navigate('ResourceViewer', { resourceId: action.id });
       return;
    }

    // Default: process as chat query
    await processQuery(action.intent || action.title);
  };

  const processQuery = async (text: string) => {
    if (!text.trim() || !tenantId) return;
    
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const engine = engineRef.current;
      
      // 1. Ordinal Parsing First
      const resolved = engine.resolveOrdinal(text);
      if (resolved) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'assistant',
          text: `Opening: ${resolved.title || resolved.name}`
        }]);
        handleAction(resolved);
        return;
      }

      // 2. Intent matching
      const intent = await engine.matchIntent(text, tenantId);
      if (intent) {
         // Fake response for now. If it's a known intent, we can map to UI.
         setMessages(prev => [...prev, {
           id: Date.now().toString(),
           sender: 'assistant',
           text: `You asked for ${intent.name}. I'm opening that context for you.`
         }]);
         // if intent triggers navigation: handleAction({ intent: intent.name })
         return;
      }

      // 3. Deterministic Knowledge Search
      const results = await engine.search(text, tenantId, null);
      
      if (results.length > 0) {
        engine.setLastResults(results); // Save to local memory for ordinals
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'assistant',
          type: 'faq',
          title: 'Top Answers',
          items: results.slice(0, 3)
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'assistant',
          text: "I couldn't find a direct answer in my offline knowledge base."
        }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'assistant',
        text: 'Sorry, I encountered an error while searching.'
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = (msg: Message) => {
    const isUser = msg.sender === 'user';
    return (
      <View key={msg.id} style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {msg.text && (
          <View style={isUser ? undefined : styles.markdownContainer}>
             <Text style={[styles.messageText, isUser && styles.userText]}>{msg.text}</Text>
          </View>
        )}
        
        {msg.type === 'quick_actions' && quickActions.length > 0 && (
          <View style={styles.chipsContainer}>
            {quickActions.map((qa, i) => (
              <TouchableOpacity key={i} style={styles.chip} onPress={() => processQuery(qa.label)}>
                <Text style={styles.chipText}>{qa.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {msg.type === 'faq' && msg.items && (
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>{msg.title}</Text>
            {msg.items.map((item, idx) => {
              const tr = JSON.parse(item.translations || '{}');
              return (
                <View key={idx} style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>{tr.en?.title || item.category}</Text>
                  <Text style={styles.faqAnswer}>{tr.en?.content || 'Content available'}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NERMAI Assistant</Text>
        <View style={styles.offlineBadge}>
          <Ionicons name="cloud-offline" size={14} color="#10b981" />
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea} 
        contentContainerStyle={styles.chatContent}
      >
        {messages.map(renderMessage)}
        {loading && <ActivityIndicator size="small" color="#10b981" style={styles.loader} />}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => processQuery(query)}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => processQuery(query)}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  offlineBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  offlineText: { color: '#10b981', fontSize: 12, marginLeft: 4, fontWeight: '600' },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 32 },
  messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 16 },
  userBubble: { backgroundColor: '#3b82f6', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#1e293b', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { color: '#f8fafc', fontSize: 15, lineHeight: 22 },
  userText: { color: '#ffffff' },
  markdownContainer: { flex: 1 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  chip: { 
    backgroundColor: '#334155', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#475569'
  },
  chipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  cardContainer: { 
    marginTop: 12, 
    backgroundColor: '#0f172a', 
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardTitle: { color: '#38bdf8', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  faqItem: { marginBottom: 12 },
  faqQuestion: { color: '#f1f5f9', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  faqAnswer: { color: '#cbd5e1', fontSize: 13, lineHeight: 20 },
  inputArea: { 
    flexDirection: 'row', 
    padding: 12, 
    backgroundColor: '#1e293b', 
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loader: { marginVertical: 16 }
});
