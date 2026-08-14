import { useEffect, useRef, useCallback } from 'react';
import { AppState, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AttendanceApi } from '@nermai/api';
import { OfflineSyncQueue } from '../services/sync/OfflineSyncQueue';

interface UseAttendanceProps {
  classId: string;
  provider: 'youtube_recorded' | 'youtube_live' | 'zoom_live' | 'recorded';
  playerJwt: string;
  playerRef?: any;
}

export const useAttendanceHeartbeat = ({ classId, provider, playerJwt, playerRef }: UseAttendanceProps) => {
  const isLive = provider.includes('live');
  const heartbeatInterval = isLive ? 300000 : 90000;
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isBackgroundRef = useRef(false);

  const sendEvent = useCallback(async (event: string, position?: number) => {
    const payload = {
      classId,
      event: event as any,
      position,
      provider,
      timestamp: new Date().toISOString()
    };

    try {
      await AttendanceApi.sendAttendanceEvent(payload, playerJwt);
    } catch (error) {
      console.error(`[Offline] Failed to send attendance event ${event}, queuing to SQLite:`, error);
      // SQLite Offline Queue integration:
      OfflineSyncQueue.enqueue('attendance', '/attendance/event', { payload, playerJwt });
    }
  }, [classId, provider, playerJwt]);

  const startHeartbeat = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!isBackgroundRef.current) {
        sendEvent('HEARTBEAT');
      }
    }, heartbeatInterval);
  }, [sendEvent, heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  // 1. Initial Join
  useEffect(() => {
    sendEvent('JOIN');
    startHeartbeat();
    return () => {
      stopHeartbeat();
    };
  }, [sendEvent, startHeartbeat, stopHeartbeat]);

  // 2. AppState (Background / Foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/) && !isBackgroundRef.current) {
        isBackgroundRef.current = true;
        sendEvent('BACKGROUND');
        stopHeartbeat();
      } else if (nextAppState === 'active' && isBackgroundRef.current) {
        isBackgroundRef.current = false;
        sendEvent('FOREGROUND');
        startHeartbeat();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [sendEvent, startHeartbeat, stopHeartbeat]);

  // 3. Navigation Focus / Blur & Hardware Back
  useFocusEffect(
    useCallback(() => {
      // Screen Focused
      if (isBackgroundRef.current) {
        isBackgroundRef.current = false;
        sendEvent('FOREGROUND');
        startHeartbeat();
      }

      const onBackPress = () => {
        sendEvent('LEAVE');
        return false; // let default navigation happen
      };
      const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        // Screen Blurred (Navigated away)
        sendEvent('LEAVE');
        backSubscription.remove();
      };
    }, [sendEvent, startHeartbeat])
  );

  return {
    sendEvent
  };
};
