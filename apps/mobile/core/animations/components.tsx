import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ViewStyle, StyleProp } from 'react-native';
import { useFadeIn, useStagger, useScalePress, useSlideUp } from './hooks';
import { Durations } from './durations';
import { Easings } from './easings';
import { Springs } from './springs';

interface AnimatedFadeInProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
}

export const AnimatedFadeIn: React.FC<AnimatedFadeInProps> = ({ children, style, delay = 0, duration = Durations.normal }) => {
  const opacity = useFadeIn(duration, delay);
  return (
    <Animated.View style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
};

export const AnimatedScaleIn: React.FC<AnimatedFadeInProps> = ({ children, style, delay = 0, duration = Durations.normal }) => {
  const opacity = useFadeIn(duration, delay);
  const scale = opacity.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
};

interface AnimatedStaggerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  index?: number;
  delay?: number;
}

export const AnimatedStagger: React.FC<AnimatedStaggerProps> = ({ children, style, index = 0, delay }) => {
  const { opacity, translateY } = useStagger(index, Durations.normal, Durations.stagger, delay);
  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

interface AnimatedGlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  scaleTo?: number;
}

export const AnimatedGlassCard: React.FC<AnimatedGlassCardProps> = ({ children, style, onPress, scaleTo = 0.97 }) => {
  const { scale, onPressIn, onPressOut } = useScalePress(scaleTo);
  
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} style={{ width: '100%' }}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

interface AnimatedSkeletonProps {
  style?: StyleProp<ViewStyle>;
}

export const AnimatedSkeleton: React.FC<AnimatedSkeletonProps> = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easings.standard,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          easing: Easings.standard,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return <Animated.View style={[style, { opacity, backgroundColor: '#333' }]} />;
};

interface AnimatedBottomSheetProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  visible: boolean;
}

export const AnimatedBottomSheet: React.FC<AnimatedBottomSheetProps> = ({ children, style, visible }) => {
  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 300,
      ...Springs.expand,
    }).start();
  }, [translateY, visible]);

  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
};

interface AnimatedProgressBarProps {
  progress: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({ progress, delay = 0, style }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 1000,
      delay,
      easing: Easings.standard,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, progress, delay]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return <Animated.View style={[style, { width }]} />;
};

interface AnimatedSlideUpProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

export const AnimatedSlideUp: React.FC<AnimatedSlideUpProps> = ({ children, style, delay = 0 }) => {
  const { opacity, translateY } = useSlideUp(100, Durations.normal, delay);
  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
};

interface AnimatedTabIconProps {
  children: React.ReactNode;
  isActive: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ children, isActive, style }) => {
  const scale = useRef(new Animated.Value(isActive ? 1.2 : 1)).current;
  const translateY = useRef(new Animated.Value(isActive ? -5 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isActive ? 1.2 : 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: isActive ? -5 : 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, scale, translateY]);

  return <Animated.View style={[style, { transform: [{ scale }, { translateY }] }]}>{children}</Animated.View>;
};
