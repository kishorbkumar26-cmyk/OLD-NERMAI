import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { interactionEngine } from '../../../services/interactions/InteractionEngine';
import { Play, Mic, Send, HelpCircle, Hand, ThumbsUp, Heart } from 'lucide-react-native';

interface InteractionOverlayProps {
  contextType: 'live_class' | 'recorded_class' | 'resource' | 'assignment' | 'announcement';
  contextId: string;
}

export const InteractionOverlay: React.FC<InteractionOverlayProps> = ({ contextType, contextId }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'CHAT' | 'QUESTION'>('CHAT');
  const [isRecording, setIsRecording] = useState(false); // Used for Voice Ask

  useEffect(() => {
    // 1. Connect to SSE stream
    interactionEngine.connectStream(contextType, contextId, (data) => {
      // Handles CHAT, QUESTION, VOICE, REACTION updates
      if (data.type === 'CONNECTED') return;
      if (data.type === 'REACTION') {
         // show floating animation
         return;
      }
      setMessages(prev => [...prev, data]);
    });

    return () => {
      interactionEngine.disconnectStream();
    };
  }, [contextType, contextId]);

  const sendInteraction = async () => {
    if (!inputText.trim()) return;
    
    await interactionEngine.sendInteraction({
      contextType,
      contextId,
      type: mode,
      message: inputText
    });
    
    setInputText('');
  };

  const sendReaction = async (emoji: string) => {
    await interactionEngine.sendInteraction({
      contextType,
      contextId,
      type: 'REACTION',
      reaction: emoji
    });
  };

  const toggleRaiseHand = async () => {
    await interactionEngine.sendInteraction({
      contextType,
      contextId,
      type: 'HAND'
    });
  };

  const handleVoiceHold = () => {
    setIsRecording(true);
    // Start expo-av recording
  };

  const handleVoiceRelease = () => {
    setIsRecording(false);
    // Stop expo-av, upload blob, then:
    /*
    interactionEngine.sendInteraction({
      contextType, contextId, type: 'VOICE', voiceUrl: uploadedUrl
    });
    */
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageBox}>
            <Text style={styles.author}>{item.userName || 'Student'}</Text>
            {item.type === 'VOICE' ? (
               <View style={styles.voiceNote}><Play size={16} color="white" /><Text style={{color:'white'}}> Voice Note</Text></View>
            ) : (
               <Text style={styles.text}>{item.message}</Text>
            )}
            {item.type === 'QUESTION' && <View style={styles.qBadge}><Text style={styles.qText}>Question</Text></View>}
          </View>
        )}
      />

      {/* Floating Reactions */}
      <View style={styles.reactionBar}>
         <TouchableOpacity onPress={() => sendReaction('❤️')}><Heart color="red" /></TouchableOpacity>
         <TouchableOpacity onPress={() => sendReaction('👍')}><ThumbsUp color="yellow" /></TouchableOpacity>
         <TouchableOpacity onPress={toggleRaiseHand}><Hand color="blue" /></TouchableOpacity>
      </View>

      <View style={styles.inputArea}>
        <TouchableOpacity onPress={() => setMode(mode === 'CHAT' ? 'QUESTION' : 'CHAT')}>
           <HelpCircle color={mode === 'QUESTION' ? 'blue' : 'gray'} />
        </TouchableOpacity>
        <TextInput 
          style={styles.input}
          placeholder={mode === 'CHAT' ? "Type a message..." : "Ask a question..."}
          value={inputText}
          onChangeText={setInputText}
        />
        {inputText ? (
          <TouchableOpacity onPress={sendInteraction}><Send color="black" /></TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPressIn={handleVoiceHold} 
            onPressOut={handleVoiceRelease}
          >
            <Mic color={isRecording ? "red" : "black"} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10 },
  messageBox: { marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 8 },
  author: { color: '#ccc', fontSize: 12 },
  text: { color: 'white', marginTop: 5 },
  voiceNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', padding: 8, borderRadius: 20, marginTop: 5, width: 120 },
  qBadge: { backgroundColor: '#FFD700', paddingHorizontal: 5, borderRadius: 4, alignSelf: 'flex-start', marginTop: 5 },
  qText: { fontSize: 10, color: 'black', fontWeight: 'bold' },
  reactionBar: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  inputArea: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 10, borderRadius: 20 },
  input: { flex: 1, marginHorizontal: 10, color: 'black' }
});
