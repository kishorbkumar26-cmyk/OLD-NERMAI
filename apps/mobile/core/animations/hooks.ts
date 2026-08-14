import { useRef, useEffect, useCallback } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { Durations } from './durations';
import { Easings } from './easings';
import { Springs } from './springs';

export const useFadeIn = (duration = Durations.normal, delay = 0) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: Easings.standard,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [opacity, duration, delay]);

  return opacity;
};

export const useSlideUp = (distance = 20, duration = Durations.normal, delay = 0) => {
  const translateY = useRef(new Animated.Value(distance)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: Easings.standard,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easings.standard,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [translateY, opacity, duration, delay]);

  return { translateY, opacity };
};

export const useScalePress = (scaleTo = 0.97) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: Platform.OS !== 'web',
      ...Springs.press,
    }).start();
  }, [scale, scaleTo]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      ...Springs.press,
    }).start();
  }, [scale]);

  return { scale, onPressIn, onPressOut };
};

export const useStagger = (index: number, duration = Durations.normal, staggerDelay = Durations.stagger, absoluteDelay?: number) => {
  const delay = absoluteDelay !== undefined ? absoluteDelay : index * staggerDelay;
  return useSlideUp(20, duration, delay);
};

export const useCounter = (targetValue: number, duration = Durations.slow) => {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(value, {
      toValue: targetValue,
      duration,
      easing: Easings.standard,
      useNativeDriver: false, // Cannot use native driver for text values easily without reanimated
    }).start();
  }, [value, targetValue, duration]);

  return value;
};
