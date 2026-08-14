import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccessRequestApi } from '@nermai/api';

const STATUS_CONFIG = {
  PENDING: { color: '#F39C12', bg: '#F39C1218', icon: 'time-outline', label: 'Pending' },
  APPROVED: { color: '#2ECC71', bg: '#2ECC7118', icon: 'checkmark-circle-outline', label: 'Approved' },
  REJECTED: { color: '#E74C3C', bg: '#E74C3C18', icon: 'close-circle-outline', label: 'Rejected' },
  NEEDS_INFO: { color: '#3498DB', bg: '#3498DB18', icon: 'information-circle-outline', label: 'Info Needed' }
};

const TYPE_ICONS: Record<string, string> = {
  CLASS: 'play-circle-outline',
  TOPIC: 'book-outline',
  SUBJECT: 'library-outline',
  COURSE: 'school-outline'
};

function formatTimeLeft(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

const RequestCard = ({ item }: { item: any }) => {
  const statusConf = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
  const timeLeft = item.expiresAt ? formatTimeLeft(item.expiresAt) : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.typeIconWrap}>
          <Ionicons name={TYPE_ICONS[item.requestType] as any || 'document-outline'} size={20} color="#D4AF37" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.contentName} numberOfLines={2}>
            {item.contentName || item.contentId}
          </Text>
          <Text style={styles.requestTypeMeta}>{item.requestType}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
          <Ionicons name={statusConf.icon as any} size={13} color={statusConf.color} />
          <Text style={[styles.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {new Date(item.requestedAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
          })}
        </Text>

        {item.status === 'APPROVED' && timeLeft && (
          <View style={styles.expiryBadge}>
            <Ionicons
              name={timeLeft === 'Expired' ? 'alert-circle-outline' : 'timer-outline'}
              size={13}
              color={timeLeft === 'Expired' ? '#E74C3C' : '#2ECC71'}
            />
            <Text style={[
              styles.expiryText,
              { color: timeLeft === 'Expired' ? '#E74C3C' : '#2ECC71' }
            ]}>
              {timeLeft}
            </Text>
          </View>
        )}

        {item.status === 'REJECTED' && item.rejectionReason && (
          <Text style={styles.rejectionReason} numberOfLines={1}>
            "{item.rejectionReason}"
          </Text>
        )}
      </View>
    </View>
  );
};

export const MyRequests = ({ navigation }: { navigation: any }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await AccessRequestApi.getMyRequests();
      const data = response.data?.data ?? response.data ?? [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[MyRequests] fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  // Group by status
  const pending = requests.filter(r => r.status === 'PENDING');
  const approved = requests.filter(r => r.status === 'APPROVED');
  const rejected = requests.filter(r => r.status === 'REJECTED');

  const sections = [
    { key: 'pending', label: 'Pending', data: pending, color: '#F39C12' },
    { key: 'approved', label: 'Approved', data: approved, color: '#2ECC71' },
    { key: 'rejected', label: 'Rejected', data: rejected, color: '#E74C3C' }
  ].filter(s => s.data.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('StudentRoot')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Access Requests</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{requests.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="file-tray-outline" size={64} color="#333" />
          <Text style={styles.emptyTitle}>No Requests Yet</Text>
          <Text style={styles.emptySubtitle}>
            When you request access to a class or topic, it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={s => s.key}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item: section }) => (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
                <Text style={styles.sectionLabel}>{section.label}</Text>
                <View style={[styles.sectionCount, { backgroundColor: section.color + '22' }]}>
                  <Text style={[styles.sectionCountText, { color: section.color }]}>
                    {section.data.length}
                  </Text>
                </View>
              </View>
              {section.data.map(item => (
                <RequestCard key={item.id} item={item} />
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    paddingTop: 44, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#1E1E1E'
  },
  backBtn: { marginRight: 14 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', flex: 1 },
  countBadge: {
    backgroundColor: '#D4AF3722', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2
  },
  countText: { color: '#D4AF37', fontWeight: '700', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  listContainer: { padding: 16, paddingBottom: 40 },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: { color: '#AAA', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, flex: 1 },
  sectionCount: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  sectionCountText: { fontSize: 12, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: '#111', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#1E1E1E'
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  typeIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#D4AF3715', alignItems: 'center', justifyContent: 'center'
  },
  cardContent: { flex: 1 },
  contentName: { color: '#FFF', fontSize: 15, fontWeight: '600', lineHeight: 20 },
  requestTypeMeta: { color: '#666', fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1E1E1E'
  },
  dateText: { color: '#555', fontSize: 12 },
  expiryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expiryText: { fontSize: 12, fontWeight: '600' },
  rejectionReason: { color: '#E74C3C', fontSize: 12, fontStyle: 'italic', maxWidth: '60%' },

  // Empty
  emptyTitle: { color: '#555', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: '#444', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 }
});
