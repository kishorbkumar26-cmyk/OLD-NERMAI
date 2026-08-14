import { interactionQueue } from './InteractionQueue';
import NetInfo from '@react-native-community/netinfo';
import api from '../../core/api';
import { v4 as uuidv4 } from 'uuid';
import EventSource from 'react-native-sse';

type InteractionContextType = 'live_class' | 'recorded_class' | 'resource' | 'assignment' | 'announcement' | 'course' | 'topic';
type InteractionEventType = 'CHAT' | 'QUESTION' | 'VOICE' | 'REACTION' | 'HAND' | 'POLL';

interface SendInteractionParams {
  contextType: InteractionContextType;
  contextId: string;
  type: InteractionEventType;
  message?: string;
  voiceUrl?: string;
  reaction?: string;
  pollOptionId?: string;
  playbackTimeMs?: number;
  parentId?: string;
}

export class InteractionEngineClient {
  private eventSource: EventSource | null = null;
  private isOnline: boolean = true;
  private currentContextKey: string | null = null;

  constructor() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.flushQueue();
      }
    });
  }

  /**
   * Connect to the Server-Sent Events stream for a specific context
   */
  public connectStream(contextType: InteractionContextType, contextId: string, onMessage: (data: any) => void) {
    this.disconnectStream();
    this.currentContextKey = `${contextType}:${contextId}`;

    const url = `http://10.0.2.2:3000/api/v1/interaction/stream/${contextType}/${contextId}`;
    
    this.eventSource = new EventSource(url, {
      headers: {
        // Need to pass auth token. Assuming API handles it via headers or query
        'Authorization': `Bearer ${api.defaults.headers.common['Authorization'] || ''}` 
      }
    });

    this.eventSource.addEventListener('message', (event: any) => {
      if (event.data) {
        try {
          const parsed = JSON.parse(event.data);
          onMessage(parsed);
        } catch (e) {
          console.error("SSE parse error", e);
        }
      }
    });

    this.eventSource.addEventListener('error', (err: any) => {
      console.warn("SSE stream error", err);
      // EventSource usually auto-reconnects, but we can manage state here
    });
  }

  public disconnectStream() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.currentContextKey = null;
  }

  /**
   * Send an interaction. If offline, it queues it.
   */
  public async sendInteraction(params: SendInteractionParams) {
    if (!this.isOnline) {
      // Queue offline
      interactionQueue.enqueue({
        id: uuidv4(),
        contextType: params.contextType,
        contextId: params.contextId,
        type: params.type,
        payload: JSON.stringify({
          message: params.message,
          voiceUrl: params.voiceUrl,
          reaction: params.reaction,
          pollOptionId: params.pollOptionId,
          playbackTimeMs: params.playbackTimeMs,
          parentId: params.parentId,
        }),
        timestamp: Date.now()
      });
      return;
    }

    // Send online
    await this.transmitInteraction(params);
  }

  private async transmitInteraction(params: SendInteractionParams) {
    try {
      await api.post('/interaction', {
        context: { type: params.contextType, id: params.contextId },
        type: params.type,
        message: params.message,
        voiceUrl: params.voiceUrl,
        reaction: params.reaction,
        pollOptionId: params.pollOptionId,
        playbackTimeMs: params.playbackTimeMs,
        parentId: params.parentId,
      });
    } catch (err) {
      console.error('Failed to transmit interaction', err);
      throw err;
    }
  }

  private async flushQueue() {
    const items = interactionQueue.dequeueAll();
    for (const item of items) {
      try {
        const payload = JSON.parse(item.payload);
        await this.transmitInteraction({
          contextType: item.contextType as InteractionContextType,
          contextId: item.contextId,
          type: item.type as InteractionEventType,
          ...payload
        });
        interactionQueue.remove(item.id);
      } catch (err) {
        console.error('Failed to flush interaction', err);
        // Break out to avoid spamming failed requests
        break;
      }
    }
  }
}

export const interactionEngine = new InteractionEngineClient();
