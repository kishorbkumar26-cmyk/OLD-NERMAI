import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssistantApi } from '@nermai/api';

const STORAGE_KEY = 'chatbot_conversations';
const MAX_STORED_CONVERSATIONS = 50;

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  payload?: any;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export const useConversation = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeConversation = conversations.find(c => c.id === activeConvId) || null;

  // Load conversations from AsyncStorage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: Conversation[] = JSON.parse(raw);
          setConversations(stored);
          // Auto-open last conversation
          if (stored.length > 0) {
            setActiveConvId(stored[0].id);
          }
        }
      } catch (e) {
        console.warn('Failed to load chat history', e);
      }
    };
    load();
  }, []);

  // Persist to AsyncStorage whenever conversations change
  const persist = useCallback(async (updated: Conversation[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, MAX_STORED_CONVERSATIONS)));
    } catch (e) {
      console.warn('Failed to save chat history', e);
    }
  }, []);

  const createConversation = useCallback(() => {
    const id = `conv_${Date.now()}`;
    const newConv: Conversation = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations(prev => {
      const updated = [newConv, ...prev];
      persist(updated);
      return updated;
    });
    setActiveConvId(id);
    return id;
  }, [persist]);

  const sendMessage = useCallback(async (text: string, courseContext?: { courseId?: string; topicId?: string }) => {
    if (!text.trim()) return;

    let convId = activeConvId;
    if (!convId) {
      convId = createConversation();
    }

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    // Optimistically add user message
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== convId) return c;
        const newMsgs = [...c.messages, userMsg];
        // Auto-title from first message
        const title = c.messages.length === 0 ? text.substring(0, 40) : c.title;
        return { ...c, messages: newMsgs, title, updatedAt: Date.now() };
      });
      persist(updated);
      return updated;
    });

    setLoading(true);

    try {
      // Set course context if available
      if (courseContext?.courseId) {
        await AssistantApi.setContext({
          activeCourseId: courseContext.courseId,
          activeTopicId: courseContext.topicId,
        }).catch(() => {});
      }

      const res = await AssistantApi.chat(text);
      const responseData = res.data?.data;
      const responseText =
        typeof responseData === 'string'
          ? responseData
          : responseData?.text || responseData?.message || JSON.stringify(responseData);

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        sender: 'assistant',
        text: responseText || 'I received your message.',
        payload: typeof responseData === 'object' ? responseData : null,
        timestamp: Date.now(),
      };

      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id !== convId) return c;
          return { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() };
        });
        persist(updated);
        return updated;
      });
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `msg_${Date.now()}_e`,
        sender: 'assistant',
        text: "Sorry, I couldn't reach the server right now. Please try again.",
        timestamp: Date.now(),
      };
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id !== convId) return c;
          return { ...c, messages: [...c.messages, errMsg], updatedAt: Date.now() };
        });
        persist(updated);
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [activeConvId, createConversation, persist]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      persist(updated);
      return updated;
    });
    if (activeConvId === id) {
      setActiveConvId(null);
    }
  }, [activeConvId, persist]);

  const clearAll = useCallback(async () => {
    setConversations([]);
    setActiveConvId(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  // Group conversations by date
  const groupedConversations = useCallback(() => {
    const now = Date.now();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);

    const groups: { title: string; data: Conversation[] }[] = [];
    const todayConvs = conversations.filter(c => c.updatedAt >= today.getTime());
    const yesterdayConvs = conversations.filter(c => c.updatedAt >= yesterday.getTime() && c.updatedAt < today.getTime());
    const lastWeekConvs = conversations.filter(c => c.updatedAt >= lastWeek.getTime() && c.updatedAt < yesterday.getTime());
    const olderConvs = conversations.filter(c => c.updatedAt < lastWeek.getTime());

    if (todayConvs.length) groups.push({ title: 'Today', data: todayConvs });
    if (yesterdayConvs.length) groups.push({ title: 'Yesterday', data: yesterdayConvs });
    if (lastWeekConvs.length) groups.push({ title: 'Last 7 Days', data: lastWeekConvs });
    if (olderConvs.length) groups.push({ title: 'Older', data: olderConvs });
    return groups;
  }, [conversations]);

  return {
    conversations,
    activeConversation,
    activeConvId,
    loading,
    sendMessage,
    createConversation,
    deleteConversation,
    clearAll,
    setActiveConvId,
    groupedConversations,
  };
};
