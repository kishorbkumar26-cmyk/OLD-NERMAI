/**
 * NERMAI SACS — Mobile Neumorphic Student Navigator
 *
 * Architecture:
 *   - Root Stack Navigator wraps everything so all deep screens are reachable
 *   - Bottom Tab Bar (Neumorphic) is the initial screen of the root stack
 *   - All screens previously unreachable (CourseOverview, CourseSyllabus, PlayerAccess,
 *     ResourceViewer, MyRequests, Chatbot, GlobalSearch, etc.) are now registered here
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@nermai/theme';
import {
  Home,
  BookOpen,
  Radio,
  User,
  FolderOpen,
} from 'lucide-react-native';

// ── Tab screens
import { StudentDashboard }       from './Student_Dashboard/StudentDashboard';
import { CoursesPage }            from './LMS/CoursesPage';
import { MobileStudentProfile }   from './Student_Dashboard/MobileStudentProfile';
import { StudentResourcesPage }   from './LMS/StudentResourcesPage';
import { MobileLiveClasses }      from './LMS/MobileLiveClasses';

// ── Stack-only screens (not in tab bar, but navigated to from tab screens)
import { CourseOverview }         from './LMS/CourseOverview';
import { CourseSyllabus }         from './LMS/CourseSyllabus';
import { PlayerAccess }           from './LMS/PlayerAccess';
import { ResourceViewer }         from './LMS/ResourceViewer';
import { MyRequests }             from './LMS/MyRequests';
import { ChatbotScreen }          from './chatbot/ChatbotScreen';
import { GlobalSearchScreen }     from './GlobalSearch/GlobalSearchScreen';
import { AssistantScreen }        from './Assistant/AssistantScreen';
import { ClassResources }         from './LMS/ClassResources';
import { ZoomSdkTestScreen }      from './streaming/zoom-test/ZoomSdkTestScreen';
import { ZoomWebViewTestScreen }  from './streaming/zoom-test/ZoomWebViewTestScreen';

// Adapter screen: ClassResources requires a classId prop but Navigator only passes route/navigation.
const ClassResourcesScreen = ({ route, navigation }: any) => (
  <ClassResources classId={route.params?.classId ?? ''} navigation={navigation} />
);

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* ─── Design Tokens ─────────────────────────────────────────────────────────── */
const BG       = colors.background;
const SURFACE  = colors.surface;
const SURF_H   = '#252525';
const GOLD     = colors.primary;
const MUTED    = colors.textSecondary;

/* ─── Tab definitions ─────────────────────────────────────────────────────────── */
interface TabDef {
  name: string;
  label: string;
  Icon: React.ElementType;
  component: React.ComponentType<any>;
}

const TABS: TabDef[] = [
  { name: 'Home',      label: 'Home',      Icon: Home,       component: StudentDashboard      },
  { name: 'Courses',   label: 'Courses',   Icon: BookOpen,   component: CoursesPage           },
  { name: 'Live',      label: 'Live',      Icon: Radio,      component: MobileLiveClasses     },
  { name: 'Resources', label: 'Resources', Icon: FolderOpen, component: StudentResourcesPage  },
  { name: 'Profile',   label: 'Profile',   Icon: User,       component: MobileStudentProfile  },
];

/* ─── Custom Neumorphic Tab Bar ──────────────────────────────────────────────── */
const NeuTabBar: React.FC<{ state: any; descriptors: any; navigation: any }> = ({ state, navigation }) => {
  const onPress = useCallback((routeName: string, isFocused: boolean) => {
    if (!isFocused) navigation.navigate(routeName);
  }, [navigation]);

  return (
    <View style={styles.tabBarWrapper}>
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
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Icon
                  size={isFocused ? 22 : 20}
                  color={isFocused ? GOLD : MUTED}
                  strokeWidth={isFocused ? 2.5 : 1.8}
                />
                {isFocused && <View style={styles.activeDot} />}
              </View>
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

/* ─── Tab Navigator (used as one screen in Root Stack) ───────────────────────── */
const StudentTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={props => <NeuTabBar {...props} />}
  >
    {TABS.map(tab => (
      <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
    ))}
  </Tab.Navigator>
);

/* ─── Rectangular Top Header ─────────────────────────────────────────────────── */
export const StudentHeader: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle = 'Student Portal · NERMAI Academy',
}) => (
  <View style={styles.header}>
    <View style={styles.headerGoldLine} />
    <View style={styles.headerInner}>
      <View style={styles.logoMark}>
        <Text style={styles.logoLetter}>N</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSub}>{subtitle}</Text>
      </View>
      <View style={styles.headerAvatar} />
    </View>
  </View>
);

/* ─── Root Stack + Tab Navigator ─────────────────────────────────────────────── */
export const StudentNavigator: React.FC = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StudentHeader title="NERMAI" subtitle="Student Portal" />
        <Stack.Navigator initialRouteName="StudentTabs" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          {/* ── Tab bar root ── */}
          <Stack.Screen name="StudentTabs" component={StudentTabs} />

          {/* ── LMS deep screens ── */}
          <Stack.Screen name="CourseOverview"  component={CourseOverview} />
          <Stack.Screen name="CourseSyllabus"  component={CourseSyllabus} />
          <Stack.Screen name="PlayerAccess"    component={PlayerAccess} />
          <Stack.Screen name="ResourceViewer"  component={ResourceViewer} />
          <Stack.Screen name="MyRequests"      component={MyRequests} />
        <Stack.Screen name="ClassResources"  component={ClassResourcesScreen} />

          {/* ── AI / Search ── */}
          <Stack.Screen name="Chatbot"         component={ChatbotScreen} />
          <Stack.Screen name="GlobalSearch"    component={GlobalSearchScreen} />
          <Stack.Screen name="Assistant"       component={AssistantScreen} />
          
          {/* ── SDK Experiments ── */}
          <Stack.Screen name="ZoomSdkTest"     component={ZoomSdkTestScreen} />
          <Stack.Screen name="ZoomWebViewTest" component={ZoomWebViewTestScreen} />
        </Stack.Navigator>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },

  /* ── Top Header ── */
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
  headerGoldLine: { height: 2, backgroundColor: GOLD },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // paddingTop is handled by SafeAreaView edges={['top']} now — no magic numbers needed
  },
  logoMark: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GOLD, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 6,
  },
  logoLetter: { fontSize: 18, fontWeight: '900', color: BG },
  headerTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.3 },
  headerSub: { fontSize: 10, color: GOLD, marginTop: 1, letterSpacing: 0.5 },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: SURF_H,
    borderWidth: 1, borderColor: `${GOLD}40`,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.6, shadowRadius: 4, elevation: 4,
  },

  /* ── Tab Bar ── */
  tabBarWrapper: {
    backgroundColor: BG,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: `${GOLD}25`,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, borderRadius: 12, position: 'relative',
  },
  tabItemActive: {
    backgroundColor: '#212121',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8, shadowRadius: 6, elevation: 0,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2, position: 'relative',
  },
  iconWrapActive: {
    backgroundColor: `${GOLD}15`,
    borderWidth: 1, borderColor: `${GOLD}30`,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  activeDot: {
    position: 'absolute', bottom: 2,
    width: 4, height: 4, borderRadius: 2, backgroundColor: GOLD,
  },
  tabLabel: { fontSize: 9, color: MUTED, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
  tabLabelActive: { color: GOLD, fontWeight: '800' },
});
