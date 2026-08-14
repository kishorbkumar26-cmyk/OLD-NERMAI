import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, radius } from '@nermai/theme';

interface AvatarProps {
  name?: string;
  email?: string;
  size?: number;
}

export const Avatar = ({ name, email, size = 80 }: AvatarProps) => {
  const getInitials = () => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{getInitials()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
    color: colors.textInverse,
  }
});
