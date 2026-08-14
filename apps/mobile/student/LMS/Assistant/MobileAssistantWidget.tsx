import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Bot, X, Send, Settings, FileText } from 'lucide-react-native';
import { AssistantApi } from '@nermai/api';

type ResponseCardType = 'text' | 'faq' | 'resource_list' | 'live_classes' | 'attendance' | 'clarification';

interface IAssistantResponse {
  type: ResponseCardType;
  title?: string;
  subtitle?: string;
  text?: string;
  items?: any[];
  actions?: Array<{ label: string; intent: string }>;
}

export const MobileAssistantWidget: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  courseContext?: { courseId: string, topicId?: string, videoId?: string };
}> = ({ isOpen, onClose, courseContext }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant', payload: IAssistantResponse | string }>>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isOpen && courseContext) {
      AssistantApi.setContext({
        activeCourseId: courseContext.courseId,
        activeTopicId: courseContext.topicId,
        activeVideoId: courseContext.videoId
      }).catch(err => console.log('Mobile context sync failed', err));
    }
  }, [isOpen, courseContext]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { sender: 'user', payload: text }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await AssistantApi.chat(text);
      if (res.data?.data) {
        setMessages(prev => [...prev, { sender: 'assistant', payload: res.data.data }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'assistant', payload: { type: 'text', text: "Sorry, I couldn't reach the servers right now." } }]);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (payload: IAssistantResponse | string) => {
    if (typeof payload === 'string') {
      return <Text style={styles.messageText}>{payload}</Text>;
    }

    switch (payload.type) {
      case 'text':
        return (
          <View>
            <Text style={styles.messageText}>{payload.text}</Text>
            {payload.actions && payload.actions.length > 0 && (
              <View style={styles.actionRow}>
                {payload.actions.map((act, i) => (
                  <TouchableOpacity key={i} onPress={() => handleSend(act.intent)} style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>{act.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );

      case 'faq':
        return (
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>{payload.title}</Text>
            <Text style={styles.cardText}>{payload.text}</Text>
            {payload.items && payload.items.length > 0 && (
              <View style={styles.faqList}>
                {payload.items.map((item, i) => (
                  <View key={i} style={styles.faqItem}>
                    <Text style={styles.faqItemTitle}>{item.title}</Text>
                    <Text style={styles.faqItemText}>{item.answer}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'resource_list':
        return (
          <View style={styles.cardContainer}>
            {payload.title && <Text style={styles.cardTitle}>{payload.title}</Text>}
            {payload.subtitle && <Text style={styles.cardSubtitle}>{payload.subtitle}</Text>}
            <View style={{ marginTop: 10 }}>
              {payload.items?.map((item: any, i: number) => (
                <View key={i} style={styles.resourceItem}>
                  <FileText color="#A855F7" size={20} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.resourceTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.resourceType}>{item.type || 'Document'}</Text>
                  </View>
                  <TouchableOpacity style={styles.openBtn}>
                    <Text style={styles.openBtnText}>Open</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        );

      case 'clarification':
        return (
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>{payload.title}</Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              {payload.actions?.map((act, i) => (
                <TouchableOpacity key={i} onPress={() => handleSend(act.intent)} style={styles.clarificationBtn}>
                  <Text style={styles.clarificationBtnText}>{act.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return <Text style={styles.messageText}>Unsupported response format</Text>;
    }
  };

  const initialQuickActions = courseContext 
    ? [
        { label: 'Summarize Notes', intent: '/notes' },
        { label: 'View Live Classes', intent: '/live' },
        { label: 'Ask a Doubt', intent: '/help' }
      ]
    : [
        { label: 'My Courses', intent: '/courses' },
        { label: 'Today\'s Notes', intent: '/notes' },
        { label: 'Attendance', intent: '/attendance' },
        { label: 'Announcements', intent: '/announcements' },
      ];

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Bot color="#fff" size={20} />
              </View>
              <View>
                <Text style={styles.headerTitle}>NERMAI Assistant</Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Online</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94A3B8" size={24} />
            </TouchableOpacity>
          </View>

          {/* Chat Area */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatArea} 
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <View style={styles.welcomeIconWrapper}>
                  <Bot color="#A855F7" size={32} />
                </View>
                <Text style={styles.welcomeTitle}>👋 Hello!</Text>
                <Text style={styles.welcomeSubtitle}>How can I help you {courseContext ? 'with this class' : 'today'}?</Text>
                
                <View style={styles.quickActionsContainer}>
                  {initialQuickActions.map((action, i) => (
                    <TouchableOpacity key={i} onPress={() => handleSend(action.intent)} style={styles.qaButton}>
                      <View style={styles.qaIconWrapper}>
                        <Settings color="#94A3B8" size={16} />
                      </View>
                      <Text style={styles.qaText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                {messages.map((msg, i) => (
                  <View key={i} style={msg.sender === 'user' ? styles.msgWrapperUser : styles.msgWrapperAssistant}>
                    <View style={msg.sender === 'user' ? styles.msgBubbleUser : styles.msgBubbleAssistant}>
                      {renderCard(msg.payload)}
                    </View>
                  </View>
                ))}
                {loading && (
                  <View style={styles.msgWrapperAssistant}>
                    <View style={styles.msgBubbleAssistant}>
                      <ActivityIndicator size="small" color="#A855F7" />
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Ask a question or type /help..."
                placeholderTextColor="#64748B"
                onSubmitEditing={() => handleSend(query)}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !query.trim() && styles.sendBtnDisabled]} 
                onPress={() => handleSend(query)}
                disabled={!query.trim() || loading}
              >
                <Send color="#fff" size={16} />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0F172A', height: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  statusText: { color: '#94A3B8', fontSize: 12 },
  closeBtn: { padding: 8 },
  chatArea: { flex: 1 },
  chatContent: { padding: 16 },
  welcomeContainer: { alignItems: 'center', marginTop: 40 },
  welcomeIconWrapper: { width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(168,85,247,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)' },
  welcomeTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 16 },
  welcomeSubtitle: { color: '#94A3B8', fontSize: 14, marginTop: 8 },
  quickActionsContainer: { width: '100%', marginTop: 32, gap: 12 },
  qaButton: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#1E293B', borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  qaIconWrapper: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  qaText: { color: '#E2E8F0', fontSize: 14, fontWeight: '500' },
  msgWrapperUser: { alignItems: 'flex-end', marginBottom: 12 },
  msgWrapperAssistant: { alignItems: 'flex-start', marginBottom: 12 },
  msgBubbleUser: { backgroundColor: '#2563EB', padding: 12, borderRadius: 16, borderBottomRightRadius: 4, maxWidth: '85%' },
  msgBubbleAssistant: { backgroundColor: '#1E293B', padding: 12, borderRadius: 16, borderBottomLeftRadius: 4, maxWidth: '85%', borderWidth: 1, borderColor: '#334155' },
  messageText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(59,130,246,0.2)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  actionButtonText: { color: '#93C5FD', fontSize: 12 },
  cardContainer: { gap: 8 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cardSubtitle: { color: '#94A3B8', fontSize: 12 },
  cardText: { color: '#CBD5E1', fontSize: 14 },
  faqList: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12, gap: 12 },
  faqItem: { gap: 4 },
  faqItemTitle: { color: '#93C5FD', fontSize: 14, fontWeight: '500' },
  faqItemText: { color: '#94A3B8', fontSize: 12 },
  resourceItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#0F172A', borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  resourceTitle: { color: '#fff', fontSize: 14 },
  resourceType: { color: '#94A3B8', fontSize: 12 },
  openBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6 },
  openBtnText: { color: '#fff', fontSize: 12 },
  clarificationBtn: { padding: 12, backgroundColor: '#0F172A', borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  clarificationBtnText: { color: '#fff', fontSize: 14 },
  inputArea: { padding: 16, borderTopWidth: 1, borderTopColor: '#1E293B', backgroundColor: '#0F172A' },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: 48, backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 16, color: '#fff', borderWidth: 1, borderColor: '#334155' },
  sendBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  sendBtnDisabled: { backgroundColor: '#334155' },
});
