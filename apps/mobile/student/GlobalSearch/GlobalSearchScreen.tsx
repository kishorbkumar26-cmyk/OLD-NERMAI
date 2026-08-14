import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResourceApi, CourseApi } from '@nermai/api';
import { colors, radius, spacing, typography } from '@nermai/theme';
import {
  Search, X, BookOpen, FileText, Radio, Bell,
  ChevronRight, Clock, Trash2
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimatedFadeIn, AnimatedStagger } from '../../core/animations';

// ─── Types ────────────────────────────────────────────────────────────────────
type ResultType = 'resource' | 'course' | 'live' | 'announcement';
interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: ResultType;
  raw: any;
}
interface ResultGroup {
  label: string;
  icon: any;
  color: string;
  results: SearchResult[];
}

const RECENT_KEY = 'global_search_recent';
const MAX_RECENT = 8;

// ─── Debounce util ────────────────────────────────────────────────────────────
function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ─── Result Row ───────────────────────────────────────────────────────────────
const ResultRow = ({ item, onPress }: { item: SearchResult; onPress: () => void }) => {
  const iconMap: Record<ResultType, { icon: any; color: string }> = {
    resource: { icon: FileText, color: '#4CAF50' },
    course: { icon: BookOpen, color: colors.primary },
    live: { icon: Radio, color: colors.accent },
    announcement: { icon: Bell, color: '#FF9800' },
  };
  const { icon: Icon, color } = iconMap[item.type];
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.resultIcon, { backgroundColor: `${color}15` }]}>
        <Icon size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        {item.subtitle && <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>}
      </View>
      <ChevronRight size={14} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const GlobalSearchScreen = ({ navigation }: { navigation: any }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Load recent searches on mount
  React.useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then(raw => {
      if (raw) setRecentSearches(JSON.parse(raw));
    });
    // Auto-focus
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const saveRecent = async (q: string) => {
    const updated = [q, ...recentSearches.filter(r => r !== q)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const clearRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  };

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    saveRecent(q.trim());

    try {
      // Run all searches in parallel; failures are non-fatal
      const [resourcesRes, coursesRes] = await Promise.allSettled([
        ResourceApi.list({ search: q }),
        CourseApi.listCourses(),
      ]);

      const groups: ResultGroup[] = [];

      // Resources
      if (resourcesRes.status === 'fulfilled') {
        const all: any[] = resourcesRes.value.data?.data || resourcesRes.value.data || [];
        const matched = all.filter((r: any) =>
          r.title?.toLowerCase().includes(q.toLowerCase()) ||
          r.description?.toLowerCase().includes(q.toLowerCase()) ||
          r.type?.toLowerCase().includes(q.toLowerCase())
        ).slice(0, 6);
        if (matched.length > 0) {
          groups.push({
            label: 'Resources',
            icon: FileText,
            color: '#4CAF50',
            results: matched.map((r: any) => ({
              id: r.id,
              title: r.title,
              subtitle: r.type ? `${r.type.toUpperCase()} • ${r.subjectName || ''}` : '',
              type: 'resource',
              raw: r,
            })),
          });
        }
      }

      // Courses (search client-side)
      if (coursesRes.status === 'fulfilled') {
        const all: any[] = coursesRes.value.data?.data || coursesRes.value.data || [];
        const matched = all.filter((c: any) =>
          c.title?.toLowerCase().includes(q.toLowerCase()) ||
          c.description?.toLowerCase().includes(q.toLowerCase())
        ).slice(0, 4);
        if (matched.length > 0) {
          groups.push({
            label: 'Courses',
            icon: BookOpen,
            color: colors.primary,
            results: matched.map((c: any) => ({
              id: c.id,
              title: c.title,
              subtitle: `${c.subjectCount ?? 0} Subjects`,
              type: 'course',
              raw: c,
            })),
          });
        }
      }


      setResults(groups);
    } catch (err) {
      console.warn('GlobalSearch: Failed', err);
    } finally {
      setLoading(false);
    }
  }, [recentSearches]);

  const debouncedSearch = useDebounce(performSearch, 400);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  const handleResultPress = (item: SearchResult) => {
    Keyboard.dismiss();
    switch (item.type) {
      case 'resource':
        navigation.navigate('ResourceViewer', { resourceId: item.id, resourceTitle: item.title });
        break;
      case 'course':
        navigation.navigate('CourseOverview', { courseId: item.id });
        break;
      case 'announcement':
        navigation.navigate('StudentTabs', { screen: 'Courses' }); // fallback; ideally open announcement detail
        break;
      case 'live':
        navigation.navigate('PlayerAccess', { classId: item.id, classTitle: item.title });
        break;
    }
  };

  const totalResults = results.reduce((acc, g) => acc + g.results.length, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search courses, resources, live classes..."
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(query)}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.centerText}>Searching...</Text>
          </View>
        )}

        {/* Empty state after search */}
        {!loading && searched && totalResults === 0 && (
          <AnimatedFadeIn style={styles.center}>
            <Search size={48} color={colors.textSecondary} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtext}>Try different keywords or check your spelling.</Text>
          </AnimatedFadeIn>
        )}

        {/* Search Results */}
        {!loading && results.length > 0 && (
          <AnimatedFadeIn>
            <Text style={styles.resultsMeta}>{totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"</Text>
            {results.map((group, gi) => (
              <AnimatedStagger key={group.label} index={gi} style={{ marginBottom: spacing.xl }}>
                {/* Group Header */}
                <View style={styles.groupHeader}>
                  <View style={[styles.groupIcon, { backgroundColor: `${group.color}20` }]}>
                    <group.icon size={14} color={group.color} />
                  </View>
                  <Text style={[styles.groupLabel, { color: group.color }]}>{group.label}</Text>
                  <View style={styles.groupDivider} />
                </View>
                {/* Results */}
                {group.results.map(item => (
                  <ResultRow key={item.id} item={item} onPress={() => handleResultPress(item)} />
                ))}
              </AnimatedStagger>
            ))}
          </AnimatedFadeIn>
        )}

        {/* Recent Searches */}
        {!loading && !searched && recentSearches.length > 0 && (
          <AnimatedFadeIn style={{ paddingHorizontal: spacing.md }}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearRecent}>
                <Trash2 size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {recentSearches.map((term, i) => (
              <TouchableOpacity
                key={i}
                style={styles.recentRow}
                onPress={() => { setQuery(term); performSearch(term); }}
                activeOpacity={0.7}
              >
                <Clock size={14} color={colors.textSecondary} />
                <Text style={styles.recentText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </AnimatedFadeIn>
        )}

        {/* Empty initial state */}
        {!loading && !searched && recentSearches.length === 0 && (
          <AnimatedFadeIn style={styles.center}>
            <Search size={56} color={`${colors.primary}40`} strokeWidth={1} />
            <Text style={styles.emptyTitle}>Start Searching</Text>
            <Text style={styles.emptySubtext}>Find courses, resources, live sessions, and announcements.</Text>
          </AnimatedFadeIn>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', gap: spacing.sm },
  backBtn: { padding: 4 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 44, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  input: { flex: 1, color: colors.textPrimary, fontSize: typography.sizes.body1 },
  scrollArea: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  center: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  centerText: { color: colors.textSecondary, marginTop: spacing.sm },
  emptyTitle: { fontSize: typography.sizes.h3, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  emptySubtext: { fontSize: typography.sizes.body2, color: colors.textSecondary, textAlign: 'center', maxWidth: 260, lineHeight: 20 },
  resultsMeta: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.lg },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  groupIcon: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  groupLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  groupDivider: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  resultIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  resultTitle: { fontSize: typography.sizes.body1, fontWeight: '500', color: colors.textPrimary },
  resultSubtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  recentTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  recentText: { fontSize: typography.sizes.body1, color: colors.textPrimary },
});
