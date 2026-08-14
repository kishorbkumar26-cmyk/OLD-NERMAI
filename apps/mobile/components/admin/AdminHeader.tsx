import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '@nermai/theme';

const BG       = colors.background;
const SURFACE  = colors.surface;
const SURF_H   = '#252525';
const GOLD     = colors.primary;
const TEXT     = colors.textPrimary;

export const AdminHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.header}>
    <View style={styles.headerGoldLine} />
    <View style={styles.headerInner}>
      <View style={styles.logoMark}>
        <Text style={styles.logoLetter}>N</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSub}>Admin Hub · NERMAI Academy</Text>
      </View>
      <View style={styles.headerAvatar} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  headerGoldLine: {
    height: 2,
    backgroundColor: GOLD,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 44 : 12,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  logoLetter: {
    fontSize: 18,
    fontWeight: '900',
    color: BG,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 10,
    color: GOLD,
    marginTop: 1,
    letterSpacing: 0.5,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: SURF_H,
    borderWidth: 1,
    borderColor: `${GOLD}40`,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
});
