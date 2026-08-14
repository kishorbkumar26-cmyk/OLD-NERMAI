import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@nermai/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: boolean;
}

export const ScreenContainer = ({ children, scrollable = true, padding = true }: ScreenContainerProps) => {
  const content = (
    <View style={[styles.inner, padding && styles.padded]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {scrollable ? (
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
  },
  padded: {
    padding: spacing.screenPaddingMobile,
  },
});
