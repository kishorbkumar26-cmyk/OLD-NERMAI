import { LayoutAnimation } from 'react-native';

export const LayoutAnimations = {
  // Use for expanding/collapsing lists or accordions
  smooth: {
    duration: 250,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  },
  // Snappy layout transitions
  snappy: {
    duration: 150,
    create: {
      type: LayoutAnimation.Types.easeOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeIn,
      property: LayoutAnimation.Properties.opacity,
    },
  },
};

export const configureLayoutAnimation = () => {
  LayoutAnimation.configureNext(LayoutAnimations.smooth);
};
