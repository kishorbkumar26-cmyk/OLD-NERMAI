import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { AnimatedSlideUp, AnimatedTabIcon, AnimatedScaleIn } from '../../core/animations';
import { Home, BookOpen, Radio, FileText, User, Bell, Bot } from 'lucide-react-native';
import { colors, radius, spacing } from '@nermai/theme';

interface ToolbarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

const TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'courses', icon: BookOpen, label: 'Courses' },
  { id: 'resources', icon: FileText, label: 'Resources' },
  { id: 'assistant', icon: Bot, label: 'Assistant' },
  { id: 'live', icon: Radio, label: 'Live' },
  { id: 'announcements', icon: Bell, label: 'Alerts' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export const StudentFloatingToolbar: React.FC<ToolbarProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      <AnimatedSlideUp delay={300} style={styles.toolbar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <TouchableOpacity 
              key={tab.id} 
              onPress={() => onTabPress(tab.id)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <AnimatedTabIcon isActive={isActive} style={isActive ? styles.activeIconContainer : undefined}>
                <Icon 
                  size={24} 
                  color={isActive ? colors.textPrimary : colors.textSecondary} 
                  opacity={isActive ? 1 : 0.5} 
                />
              </AnimatedTabIcon>
              {isActive && (
                <AnimatedScaleIn duration={200} style={styles.activeGlow} />
              )}
            </TouchableOpacity>
          );
        })}
      </AnimatedSlideUp>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 25,
    width: '100%',
    alignItems: 'center',
    zIndex: 999
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(27, 27, 27, 0.85)', // surface with opacity
    width: '90%',
    height: 70,
    borderRadius: 35,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)', // primary gold accent border
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative'
  },
  activeIconContainer: {
    backgroundColor: colors.accent,
    padding: 10,
    borderRadius: radius.lg,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5
  },
  activeGlow: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 1,
    shadowRadius: 5
  }
});
