import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Alert
} from 'react-native';
import { CourseApi, AccessRequestApi, getApiClient } from '@nermai/api';
import { LiveConsoleFactory } from '../streaming/LiveConsoleFactory';
import { Ionicons } from '@expo/vector-icons';
import { CommentList } from '../LiveClass/LCES/CommentList';
import { CommentInput } from '../LiveClass/LCES/CommentInput';
import { useAuth } from '../../core/auth/AuthProvider';
import { AttendanceStatusBadge } from './components/AttendanceStatusBadge';

// ─── Types ───────────────────────────────────────────────────────────────────

type DenialReason =
  | 'NOT_ENROLLED' | 'FREE_PLAN'
  | 'ONLINE_RECORDED' | 'OFFLINE_RECORDED' | 'OFFLINE_LIVE'
  | 'NO_CAPABILITY' | 'LIMIT_EXCEEDED';

interface RequestScope {
  type: 'CLASS' | 'TOPIC' | 'SUBJECT' | 'COURSE';
  contentId: string;
  count: number;
  units: number;
  allowed: boolean;
  reason?: string;
  isPending?: boolean;
}

interface DeniedPayload {
  status: 'DENIED';
  reason: DenialReason;
  context?: {
    batchType?: 'online' | 'offline' | 'recorded' | 'free' | null;
    classType?: string;
    batchName?: string;
  };
  allowedRequestScopes: RequestScope[];
  remainingRecordedUnits: number;
  monthlyLimit: number;
}

// ─── Denial Content Map ───────────────────────────────────────────────────────

const DENIAL_CONFIG: Record<string, {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  showRequest: boolean;
}> = {
  NOT_ENROLLED: {
    icon: 'person-remove-outline',
    iconColor: '#FF6B6B',
    title: 'Not Enrolled',
    subtitle: 'You are not registered as a student. Please contact the institute to enroll.',
    showRequest: false
  },
  FREE_PLAN: {
    icon: 'star-outline',
    iconColor: '#D4AF37',
    title: 'Premium Content',
    subtitle: 'This class is available only for enrolled students. View our plans to get access.',
    showRequest: false
  },
  ONLINE_RECORDED: {
    icon: 'videocam-outline',
    iconColor: '#F39C12',
    title: 'Recorded Video',
    subtitle: 'Your Online Batch does not include recorded class access by default. Request temporary access from the administrator.',
    showRequest: true
  },
  OFFLINE_RECORDED: {
    icon: 'film-outline',
    iconColor: '#D4AF37',
    title: 'Recorded Video',
    subtitle: 'Offline batch students can request temporary recorded access from the administrator.',
    showRequest: true
  },
  OFFLINE_LIVE: {
    icon: 'radio-outline',
    iconColor: '#E74C3C',
    title: 'Live Class',
    subtitle: 'Live classes are not available for Offline Batch students.',
    showRequest: false
  },
  NO_CAPABILITY: {
    icon: 'lock-closed-outline',
    iconColor: '#D4AF37',
    title: 'Access Required',
    subtitle: 'Your current batch does not include access to this content. You can request temporary access.',
    showRequest: true
  },
  LIMIT_EXCEEDED: {
    icon: 'alert-circle-outline',
    iconColor: '#E74C3C',
    title: 'Monthly Limit Reached',
    subtitle: 'You have used all your recorded access units for this month.',
    showRequest: false
  }
};

const SCOPE_ICONS: Record<string, string> = {
  CLASS: 'play-circle-outline',
  TOPIC: 'book-outline',
  SUBJECT: 'library-outline',
  COURSE: 'school-outline'
};

const SCOPE_LABELS: Record<string, string> = {
  CLASS: 'This Class',
  TOPIC: 'Entire Topic',
  SUBJECT: 'Entire Subject',
  COURSE: 'Complete Course'
};

// ─── Smart Denial Screen ──────────────────────────────────────────────────────

const SmartDenialScreen = ({
  denied, classId, classTitle, batchId, navigation
}: {
  denied: DeniedPayload;
  classId: string;
  classTitle: string;
  batchId?: string;
  navigation: any;
}) => {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const config = DENIAL_CONFIG[denied.reason] ?? DENIAL_CONFIG['NO_CAPABILITY'];

  const handleRequest = useCallback(async (scope: RequestScope) => {
    if (!scope.allowed || submitting) return;

    setSubmitting(scope.type);
    try {
      await AccessRequestApi.createRequest({
        requestType: scope.type,
        contentId: scope.contentId,
        contentName: classTitle,
        reason: `Student requested ${scope.type.toLowerCase()} access`,
        batchId: batchId || null
      });
      setSubmitted(scope.type);
      Alert.alert(
        'Request Submitted ✓',
        'Your request has been sent to the administrator. You will be notified when it is approved.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit request.';
      Alert.alert('Request Failed', msg);
    } finally {
      setSubmitting(null);
    }
  }, [submitting, classTitle, batchId]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Icon + Title */}
      <View style={styles.denialHeader}>
        <View style={[styles.iconCircle, { borderColor: config.iconColor + '44', backgroundColor: config.iconColor + '18' }]}>
          <Ionicons name={config.icon as any} size={40} color={config.iconColor} />
        </View>
        <Text style={[styles.denialTitle, { color: config.iconColor }]}>{config.title}</Text>
        <Text style={styles.denialSubtitle}>{config.subtitle}</Text>

        {/* Batch context pill */}
        {denied.context?.batchName && (
          <View style={styles.batchPill}>
            <Ionicons name="people-outline" size={12} color="#AAA" />
            <Text style={styles.batchPillText}>{denied.context.batchName}</Text>
          </View>
        )}
      </View>

      {/* Units Info */}
      {config.showRequest && denied.allowedRequestScopes.length > 0 && (
        <>
          <View style={styles.unitsBar}>
            <View style={styles.unitsBarLeft}>
              <Text style={styles.unitsLabel}>Monthly Units</Text>
              <Text style={styles.unitsValue}>
                {denied.remainingRecordedUnits} / {denied.monthlyLimit} remaining
              </Text>
            </View>
            <View style={styles.unitsProgress}>
              <View
                style={[
                  styles.unitsProgressFill,
                  {
                    width: `${Math.max(4, (denied.remainingRecordedUnits / (denied.monthlyLimit || 1)) * 100)}%` as any,
                    backgroundColor: denied.remainingRecordedUnits > 0 ? '#D4AF37' : '#E74C3C'
                  }
                ]}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Request Access</Text>

          {denied.allowedRequestScopes.map((scope) => (
            <View
              key={scope.type}
              style={[styles.scopeCard, !scope.allowed && styles.scopeCardDisabled]}
            >
              <View style={styles.scopeCardLeft}>
                <Ionicons
                  name={SCOPE_ICONS[scope.type] as any}
                  size={22}
                  color={scope.allowed ? '#D4AF37' : '#555'}
                />
                <View style={styles.scopeTextBlock}>
                  <Text style={[styles.scopeTypeLabel, !scope.allowed && styles.scopeTypeLabelDisabled]}>
                    {SCOPE_LABELS[scope.type]}
                  </Text>
                  <Text style={styles.scopeMeta}>
                    {scope.count > 0 ? `${scope.count} video${scope.count !== 1 ? 's' : ''}` : '1 video'}
                    {' • '}
                    <Text style={{ color: scope.units <= denied.remainingRecordedUnits ? '#D4AF37' : '#E74C3C' }}>
                      {scope.units} unit{scope.units !== 1 ? 's' : ''}
                    </Text>
                  </Text>
                  {!scope.allowed && scope.reason && (
                    <Text style={styles.scopeReasonText}>{scope.reason}</Text>
                  )}
                </View>
              </View>

              {scope.isPending || submitted === scope.type ? (
                <View style={styles.submittedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
                  <Text style={styles.submittedText}>Sent</Text>
                </View>
              ) : scope.allowed ? (
                <TouchableOpacity
                  style={[styles.requestBtn, submitting === scope.type && styles.requestBtnLoading]}
                  onPress={() => handleRequest(scope)}
                  disabled={!!submitting}
                >
                  {submitting === scope.type ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.requestBtnText}>Request</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </>
      )}

      {/* View my requests link */}
      {config.showRequest && (
        <TouchableOpacity
          style={styles.myRequestsLink}
          onPress={() => navigation.navigate('MyRequests')}
        >
          <Ionicons name="time-outline" size={16} color="#D4AF37" />
          <Text style={styles.myRequestsText}>View My Request History</Text>
        </TouchableOpacity>
      )}

      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('StudentRoot')}>
        <Text style={styles.backText}>← Return to Syllabus</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Main PlayerAccess Component ──────────────────────────────────────────────

export const PlayerAccess = ({ route, navigation }: { route: any; navigation: any }) => {
  const { classId, classTitle, courseId, batchId, livePayload } = route.params;
  const { role } = useAuth();
  const [accessData, setAccessData] = useState<any>(livePayload || null);
  const [deniedPayload, setDeniedPayload] = useState<DeniedPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(!livePayload);

  const isAdminOrTeacher = role === 'admin' || role === 'teacher' || role === 'staff';

  useEffect(() => {
    // If livePayload was passed, we don't need to fetch playback access 
    // because it's a live session and the payload already contains provider/token.
    if (livePayload) {
      return;
    }

    let intervalId: NodeJS.Timeout;

    const fetchAccess = async () => {
      try {
        console.log("classId =", classId);
        console.log("sessionId =", route.params.sessionId);
        console.log(`Calling URL: /classes/${classId}/access`);

        const response = await CourseApi.getClassPlaybackAccess(classId);
        const data = response.data?.data ?? response.data;

        if (data?.status === 'DENIED') {
          setDeniedPayload(data as DeniedPayload);
        } else {
          setAccessData(data);
          
          if (data?.waiting) {
            if (!intervalId) {
              intervalId = setInterval(fetchAccess, 5000);
            }
          } else if (intervalId) {
            clearInterval(intervalId);
          }
        }
      } catch (err: any) {
        console.log("Status:", err.response?.status);
        console.log("Response:", err.response?.data);
        console.log("URL:", err.config?.url);
        console.error('[PlayerAccess] fetch error', err);
        setErrorMessage(err.response?.data?.message || 'Failed to load class. Please try again.');
        if (intervalId) clearInterval(intervalId);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAccess();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [classId, livePayload]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EF4444" style={{ transform: [{ scale: 1.5 }], marginBottom: 20 }} />
        <Text style={styles.loadingText}>Securing Connection...</Text>
        <Text style={{ color: '#888', marginTop: 10, fontSize: 12 }}>Joining live class environment</Text>
      </View>
    );
  }

  // ── Generic error (e.g. auth failure) ────────────────────────────────────────
  if (errorMessage) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={48} color="#FF6B6B" />
        <Text style={styles.genericErrorText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('StudentRoot')}>
          <Text style={styles.backText}>← Return to Syllabus</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Smart Denial ─────────────────────────────────────────────────────────────
  if (deniedPayload) {
    return (
      <SmartDenialScreen
        denied={deniedPayload}
        classId={classId}
        classTitle={classTitle}
        batchId={batchId}
        navigation={navigation}
      />
    );
  }

  // ── No data (shouldn't happen, but safety net) ────────────────────────────────
  if (!accessData) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning-outline" size={48} color="#FF6B6B" />
        <Text style={styles.genericErrorText}>Unable to load class. Please try again.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('StudentRoot')}>
          <Text style={styles.backText}>← Return to Syllabus</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Recording Not Yet Uploaded ────────────────────────────────────────────────
  if (accessData.notUploaded) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-upload-outline" size={48} color="#D4AF37" />
        <Text style={styles.genericErrorText}>Recording Not Yet Uploaded</Text>
        <Text style={styles.genericSubText}>The recording for this class will be available once uploaded by the teacher.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('StudentRoot')}>
          <Text style={styles.backText}>← Return to Syllabus</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Player ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('StudentRoot')} style={styles.backButtonTop}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{classTitle}</Text>
        </View>
        <AttendanceStatusBadge classId={classId} />
      </View>

      {accessData.waiting ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={64} color="#D4AF37" style={{ marginBottom: 16 }} />
          <Text style={styles.genericErrorText}>Waiting for Teacher...</Text>
          <Text style={styles.genericSubText}>The session has not started yet. Please wait here.</Text>
          <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 24 }} />
        </View>
      ) : accessData.provider ? (
        <View style={{ flex: 1 }}>
          <LiveConsoleFactory role={role} provider={accessData.provider} payload={accessData} />
          {accessData.provider?.includes('youtube') && (
            <View style={{ flex: 1 }}>
              <CommentList liveSessionId={classId} isAdmin={isAdminOrTeacher} />
              <CommentInput liveSessionId={classId} isAdmin={isAdminOrTeacher} />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.center}><Text style={styles.genericErrorText}>Unknown Provider</Text></View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#000', padding: 24
  },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    paddingTop: 40, backgroundColor: '#121212'
  },
  backButtonTop: { marginRight: 16 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1 },
  loadingText: { color: '#D4AF37', marginTop: 16, fontSize: 16, letterSpacing: 1 },

  // Denial header
  denialHeader: { alignItems: 'center', marginBottom: 28 },
  iconCircle: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16
  },
  denialTitle: { fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  denialSubtitle: {
    color: '#AAA', fontSize: 15, textAlign: 'center', lineHeight: 22, marginHorizontal: 8
  },
  batchPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1E1E1E', borderRadius: 20, paddingHorizontal: 12,
    paddingVertical: 5, marginTop: 14
  },
  batchPillText: { color: '#AAA', fontSize: 13 },

  // Units bar
  unitsBar: {
    backgroundColor: '#111', borderRadius: 12, padding: 14,
    marginBottom: 22, borderWidth: 1, borderColor: '#222'
  },
  unitsBarLeft: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8
  },
  unitsLabel: { color: '#777', fontSize: 13 },
  unitsValue: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  unitsProgress: {
    height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden'
  },
  unitsProgressFill: { height: '100%', borderRadius: 2 },

  // Section title
  sectionTitle: {
    color: '#777', fontSize: 12, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 10
  },

  // Scope cards
  scopeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#111', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#222'
  },
  scopeCardDisabled: { opacity: 0.45 },
  scopeCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  scopeTextBlock: { flex: 1 },
  scopeTypeLabel: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  scopeTypeLabelDisabled: { color: '#666' },
  scopeMeta: { color: '#777', fontSize: 13, marginTop: 2 },
  scopeReasonText: { color: '#E74C3C', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  requestBtn: {
    backgroundColor: '#D4AF37', paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 8, minWidth: 80, alignItems: 'center'
  },
  requestBtnLoading: { backgroundColor: '#A0862A' },
  requestBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  submittedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  submittedText: { color: '#2ECC71', fontWeight: '600' },

  // My requests link
  myRequestsLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center', marginTop: 20, marginBottom: 10
  },
  myRequestsText: { color: '#D4AF37', fontSize: 14 },

  // Generic error
  genericErrorText: {
    color: '#FF6B6B', fontSize: 16, textAlign: 'center', marginTop: 16, marginBottom: 8
  },
  genericSubText: { color: '#777', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  // Back button
  backButton: {
    marginTop: 24, paddingVertical: 12, paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignSelf: 'center'
  },
  backText: { color: '#FFF', fontSize: 15 }
});
