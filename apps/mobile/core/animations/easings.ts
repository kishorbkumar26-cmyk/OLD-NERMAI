import { Easing } from 'react-native';

export const Easings = {
  // Premium subtle easing
  standard: Easing.bezier(0.4, 0.0, 0.2, 1.0),
  // Snappy entrance
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  // Smooth exit
  accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  // Bouncy spring-like easing if not using Animated.spring
  bounce: Easing.bounce,
  // Linear for loops
  linear: Easing.linear,
};
