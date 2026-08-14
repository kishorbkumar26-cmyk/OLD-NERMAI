/**
 * NERMAI SACS — Mobile Neumorphic Bottom Tab Navigator
 *
 * Design:
 *   - Custom neumorphic bottom tab bar (not the default RN tab bar)
 *   - Rectangular top header bar with gold top border line
 *   - NERMAI Gold + Red dark palette from @nermai/theme
 *   - Shared design tokens with web layout (same visual language)
 *   - All 5 tabs: Dashboard | LMS | Access | Students | More
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '@nermai/theme';
import {
  LayoutDashboard,
  BookOpen,
  ShieldCheck,
  Users,
  Menu,
} from 'lucide-react-native';

import { AdminDashboard }      from './Dashboard/AdminDashboard';
import { AdminLMSNavigator }   from './LMS/AdminLMSNavigator';
import { AdminStudents }       from './Students/AdminStudents';
import { AdminAssistant }      from './Assistant/AdminAssistant';
import { AdminMoreNavigator }  from './More/AdminMoreNavigator';

// Access Control placeholder (will be replaced by SACS screens)
import { AccessControlScreen } from './AccessRules/AccessControlScreen';

const Tab = createBottomTabNavigator();
const { width: SW } = Dimensions.get('window');

/* ─── Design Tokens ─────────────────────────────────────────────────────────── */
const BG       = colors.background;   // #0E0E0E
const SURFACE  = colors.surface;      // #1B1B1B
const SURF_H   = '#252525';
const GOLD     = colors.primary;      // #D4AF37
const RED      = colors.accent;       // #FF3B30
const TEXT     = colors.textPrimary;  // #F8F8F8
const MUTED    = colors.textSecondary; // #A0A0A0

/* ─── Tab definitions ─────────────────────────────────────────────────────────── */
interface TabDef {
  name: string;
  label: string;
  Icon: React.ElementType;
  component: React.ComponentType<any>;
  badge?: string;
}

const TABS: TabDef[] = [
  { name: 'Dashboard',  label: 'Home',    Icon: LayoutDashboard, component: AdminDashboard      },
  { name: 'LMS',        label: 'LMS',     Icon: BookOpen,        component: AdminLMSNavigator   },
  { name: 'Access',     label: 'Access',  Icon: ShieldCheck,     component: AccessControlScreen, badge: 'NEW' },
  { name: 'Students',   label: 'Students',Icon: Users,           component: AdminStudents       },
  { name: 'More',       label: 'More',    Icon: Menu,            component: AdminMoreNavigator  },
];

/* ─── Custom Neumorphic Tab Bar ──────────────────────────────────────────────── */
interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const NeuTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation }) => {
  const onPress = useCallback((routeName: string, isFocused: boolean) => {
    // Define the root screens for nested navigators to force a stack reset
    const rootScreens: Record<string, string> = {
      'LMS': 'AdminCourses',
      'More': 'AdminMoreMenu'
    };

    if (rootScreens[routeName]) {
      navigation.navigate(routeName, { screen: rootScreens[routeName] });
    } else {
      navigation.navigate(routeName);
    }
  }, [navigation]);

  return (
    <View style={styles.tabBarWrapper}>
      {/* Neumorphic container — raised panel */}
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const tab = TABS[index];
          if (!tab) return null;
          const { Icon } = tab;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => onPress(route.name, isFocused)}
              activeOpacity={0.75}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
            >
              {/* Icon wrapper — inset when active, raised when not */}
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Icon
                  size={isFocused ? 22 : 20}
                  color={isFocused ? GOLD : MUTED}
                  strokeWidth={isFocused ? 2.5 : 1.8}
                />
                {/* Gold glow dot on active */}
                {isFocused && <View style={styles.activeDot} />}
              </View>

              {/* Badge */}
              {tab.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}

              {/* Label */}
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};



/* ─── Main Navigator ─────────────────────────────────────────────────────────── */
export const AdminNavigator: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Tab.Navigator
        screenOptions={{ headerShown: false, unmountOnBlur: true }}
        tabBar={props => <NeuTabBar {...props} />}
      >
        {TABS.map(tab => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
          />
        ))}
      </Tab.Navigator>
    </SafeAreaView>
  );
};

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const TAB_H = Platform.OS === 'ios' ? 84 : 68;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },



  /* ── Tab Bar ── */
  tabBarWrapper: {
    backgroundColor: BG,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 12,
    // Top gold separator line
    borderTopWidth: 1,
    borderTopColor: `${GOLD}25`,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 8,
    // Neumorphic raised effect
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
    // Light highlight on top-left (simulate neumorphism)
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: '#212121',
    // Inset shadow on active tab
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 0,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  iconWrapActive: {
    backgroundColor: `${GOLD}15`,
    // Gold ring
    borderWidth: 1,
    borderColor: `${GOLD}30`,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  tabLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: GOLD,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 4,
    backgroundColor: RED,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 7,
    color: TEXT,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
