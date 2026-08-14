/**
 * NERMAI SACS — Mobile Access Control Screen (Admin)
 *
 * Entry point for all SACS features on mobile:
 *   - Neumorphic tab strip at top (Permissions | Requests | Matrix | Templates)
 *   - Each sub-tab renders a SACS feature
 *   - Same API calls as web (backend is single source of truth)
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, SafeAreaView, Modal, Alert
} from 'react-native';
import { AnimatedSlideUp } from '../../core/animations';
import {
  ShieldCheck, Clock, Grid3X3, BookTemplate,
  ChevronRight, CheckCircle2, XCircle, AlertCircle,
  History, Lock,
} from 'lucide-react-native';
import { colors } from '@nermai/theme';
import { StudentApi, AccessRulesApi, BatchApi } from '@nermai/api';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../core/firebaseConfig';

const BG      = colors.background;
const SURFACE = colors.surface;
const SURF_H  = '#252525';
const GOLD    = colors.primary;
const RED     = colors.accent;
const TEXT    = colors.textPrimary;
const MUTED   = colors.textSecondary;

/* ─── Sub-tabs ─────────────────────────────────────────────────────────────── */
const SUB_TABS = [
  { key: 'permissions', label: 'Permissions', Icon: ShieldCheck },
  { key: 'requests',    label: 'Requests',    Icon: Clock       },
  { key: 'history',    label: 'History',     Icon: History     },
  { key: 'permanent',  label: 'Permanent',   Icon: Lock        },
  { key: 'analytics',  label: 'Analytics',   Icon: Grid3X3     },
  { key: 'templates',  label: 'Templates',   Icon: BookTemplate },
];

/* ─── Main Screen ────────────────────────────────────────────────────────────── */
export const AccessControlScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('permissions');

  return (
    <SafeAreaView style={styles.safe}>
      <AdminHeader title="Access Control" />

      {/* Neumorphic horizontal sub-tab strip */}
      <View style={styles.subTabWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabRow}
        >
          {SUB_TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.subTab, active && styles.subTabActive]}
                activeOpacity={0.75}
              >
                <tab.Icon
                  size={13}
                  color={active ? BG : MUTED}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <Text style={[styles.subTabLabel, active && styles.subTabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {activeTab === 'permissions' && <PermissionsTab />}
        {activeTab === 'requests'    && <RequestsTab />}
        {activeTab === 'history'     && <HistoryTab />}
        {activeTab === 'permanent'   && <PermanentGrantsTab />}
        {activeTab === 'analytics'   && <AnalyticsTab />}
        {activeTab === 'templates'   && <TemplatesTab />}
      </ScrollView>
    </SafeAreaView>
  );
};

/* ─── Permissions Tab ─────────────────────────────────────────────────────────── */
const PermissionsTab: React.FC = () => {
  const VISIBILITY_OPTIONS = [
    { key: 'public',  label: 'Public',  desc: 'All enrolled students', color: colors.success },
    { key: 'batch',   label: 'Batch',   desc: 'Selected batches only', color: GOLD           },
    { key: 'student', label: 'Student', desc: 'Specific students',     color: colors.primary },
    { key: 'mixed',   label: 'Mixed',   desc: 'Batch + Students',      color: colors.warning },
    { key: 'hidden',  label: 'Hidden',  desc: 'Admin only',            color: RED            },
  ];
  const [selected, setSelected] = useState('public');
  const [inherit, setInherit]   = useState(true);

  // Data fetching — loaded lazily only when Override mode is active
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [dbBatches, setDbBatches] = useState<any[]>([]);
  const [requestedStudentIds, setRequestedStudentIds] = useState<Set<string>>(new Set());
  const [studentFilterMode, setStudentFilterMode] = useState<'all' | 'requested'>('requested');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Only fetch student/batch data when admin switches to Override mode.
  // This avoids making API calls that could trigger spurious 401 logouts
  // when the Access tab first loads.
  React.useEffect(() => {
    if (inherit || dataLoaded) return; // Don't fetch in inherit mode, or if already loaded

    const fetchData = async () => {
      setDataLoading(true);
      setDataError(null);
      try {
        const [studentsRes, batchesRes] = await Promise.all([
          StudentApi.listStudents(),
          BatchApi.listBatches(),
        ]);

        setDbStudents(studentsRes.data?.data || studentsRes.data || []);
        setDbBatches(batchesRes.data?.data || batchesRes.data || []);

        // Separately fetch pending requests — errors here should not block the UI
        try {
          const requestsRes = await AccessRulesApi.listAccessRequests();
          const reqIds = (requestsRes.data?.data || [])
            .filter((req: any) => req.status === 'pending' || req.status === 'PENDING')
            .map((req: any) => req.studentId);
          setRequestedStudentIds(new Set(reqIds));
          if (reqIds.length === 0) setStudentFilterMode('all');
        } catch (reqErr: any) {
          // Non-fatal — just show all students
          setStudentFilterMode('all');
          console.warn('Could not load pending requests for filter:', reqErr?.message);
        }

        setDataLoaded(true);
      } catch (err: any) {
        // 401/403 here means the admin token itself is invalid — show an inline
        // error rather than triggering a global logout.
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          setDataError('Session may have expired. Please log out and back in.');
        } else {
          setDataError('Failed to load data. Please try again.');
        }
        console.warn('PermissionsTab: Failed to fetch SACS panel data', err?.message);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [inherit, dataLoaded]);

  const toggleBatch = (id: string) => {
    setSelectedBatches(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };
  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  return (
    <AnimatedSlideUp>
      {/* Inherit / Override toggle */}
      <NeuCard style={{ marginBottom: 16 }}>
        <Text style={styles.cardTitle}>Permission Mode</Text>
        <View style={styles.modeRow}>
          <ModeToggle
            label="Inherit Parent"
            active={inherit}
            onPress={() => setInherit(true)}
          />
          <ModeToggle
            label="Override"
            active={!inherit}
            onPress={() => setInherit(false)}
          />
        </View>
        {inherit && (
          <View style={styles.inheritBadge}>
            <Text style={styles.inheritText}>
              ↑ Inheriting: IAS 2027 Course (Online + Recorded)
            </Text>
          </View>
        )}
      </NeuCard>

      {/* Visibility selector (shown only when override) */}
      {!inherit && (
        <NeuCard style={{ marginBottom: 16 }}>
          <Text style={styles.cardTitle}>Visibility</Text>
          <View style={{ gap: 8 }}>
            {VISIBILITY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setSelected(opt.key)}
                style={[
                  styles.visibilityRow,
                  selected === opt.key && { ...styles.visibilityRowActive, borderColor: opt.color + '50' }
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.radioOuter, { borderColor: opt.color }]}>
                  {selected === opt.key && (
                    <View style={[styles.radioInner, { backgroundColor: opt.color }]} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.visLabel, selected === opt.key && { color: opt.color }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.visDesc}>{opt.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Batch selector when batch/mixed */}
          {(selected === 'batch' || selected === 'mixed') && (
            <View style={[styles.subSection, { marginTop: 16 }]}>
              <Text style={styles.subTitle}>Select Batches</Text>
              {dataLoading && <Text style={{ color: MUTED, fontSize: 12 }}>Loading batches...</Text>}
              {dataError && <Text style={{ color: RED, fontSize: 12 }}>{dataError}</Text>}
              {!dataLoading && dbBatches.map((b) => (
                <BatchChip 
                  key={b.id} 
                  label={b.name} 
                  checked={selectedBatches.includes(b.id)} 
                  onPress={() => toggleBatch(b.id)}
                />
              ))}
              {!dataLoading && !dataError && dbBatches.length === 0 && <Text style={{ color: MUTED, fontSize: 12 }}>No batches found.</Text>}
            </View>
          )}

          {/* Student selector when student/mixed */}
          {(selected === 'student' || selected === 'mixed') && (
            <View style={[styles.subSection, { marginTop: 16 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.subTitle, { marginBottom: 0 }]}>Select Students</Text>
                
                {/* Filter toggle */}
                <View style={styles.filterToggleWrap}>
                  <TouchableOpacity 
                    style={[styles.filterToggleBtn, studentFilterMode === 'requested' && styles.filterToggleBtnActive]}
                    onPress={() => setStudentFilterMode('requested')}
                  >
                    <Text style={[styles.filterToggleText, studentFilterMode === 'requested' && styles.filterToggleTextActive]}>
                      Requested ({requestedStudentIds.size})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.filterToggleBtn, studentFilterMode === 'all' && styles.filterToggleBtnActive]}
                    onPress={() => setStudentFilterMode('all')}
                  >
                    <Text style={[styles.filterToggleText, studentFilterMode === 'all' && styles.filterToggleTextActive]}>
                      All
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {!dataLoading && dbStudents
                .filter(s => studentFilterMode === 'all' || requestedStudentIds.has(s.id))
                .map((s) => (
                  <BatchChip 
                    key={s.id} 
                    label={s.name || s.displayName || 'Unnamed Student'} 
                    checked={selectedStudents.includes(s.id)} 
                    onPress={() => toggleStudent(s.id)}
                  />
              ))}
              {dataLoading && <Text style={{ color: MUTED, fontSize: 12 }}>Loading students...</Text>}
              {dataError && <Text style={{ color: RED, fontSize: 12 }}>{dataError}</Text>}
              {!dataLoading && dbStudents.length === 0 && !dataError && <Text style={{ color: MUTED, fontSize: 12 }}>No students found.</Text>}
              {!dataLoading && dbStudents.length > 0 && studentFilterMode === 'requested' && requestedStudentIds.size === 0 && (
                <Text style={{ color: MUTED, fontSize: 12, textAlign: 'center', padding: 10 }}>No pending requests.</Text>
              )}
            </View>
          )}
        </NeuCard>
      )}

      {/* Cascade action */}
      {!inherit && (
        <NeuCard style={{ marginBottom: 16 }}>
          <Text style={styles.cardTitle}>Apply To</Text>
          {[
            'This item only',
            'This + inheriting children',
            'Force all children',
          ].map((opt, i) => (
            <TouchableOpacity key={i} style={styles.cascadeRow} activeOpacity={0.75}>
              <View style={[styles.cascadeRadio, i === 0 && { backgroundColor: `${GOLD}30`, borderColor: GOLD }]}>
                {i === 0 && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD }} />}
              </View>
              <Text style={[styles.cascadeLabel, i === 0 && { color: GOLD }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </NeuCard>
      )}

      {/* Save button */}
      <NeuButton label="Save Permissions" onPress={() => {}} />
    </AnimatedSlideUp>
  );
};

/* ─── Requests Tab ─────────────────────────────────────────────────────────────── */
const RequestsTab: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Bulk Dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [grantType, setGrantType] = useState<'TEMPORARY' | 'PERMANENT'>('TEMPORARY');
  const [durationHours, setDurationHours] = useState<number>(48);
  const [consumeUnits, setConsumeUnits] = useState(true);
  const [respectLimit, setRespectLimit] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Undo Snackbar
  const [showUndo, setShowUndo] = useState(false);
  const [undoMessage, setUndoMessage] = useState('');

  React.useEffect(() => {
    let mounted = true;
    AccessRulesApi.listAccessRequests()
      .then((res) => {
        if (mounted) {
          setRequests(res.data?.data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) {
          setError('Failed to sync requests');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === requests.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(requests.map(r => r.id)));
  };

  const handleInvertSelection = () => {
    const next = new Set<string>();
    requests.forEach(r => {
      if (!selectedIds.has(r.id)) next.add(r.id);
    });
    setSelectedIds(next);
  };

  const handleSelectByType = (type: string) => {
    const next = new Set(selectedIds);
    requests.forEach(r => {
      if ((r.requestType || r.entityType || '').toLowerCase() === type.toLowerCase()) {
        next.add(r.id);
      }
    });
    setSelectedIds(next);
  };

  const handleBulkApproveSubmit = async () => {
    setIsSubmitting(true);
    try {
      await AccessRulesApi.bulkApprove({
        requestIds: Array.from(selectedIds),
        grantType,
        durationHours: grantType === 'TEMPORARY' ? durationHours : null,
        consumeMonthlyUnits: consumeUnits,
        respectMonthlyLimit: respectLimit,
        presetId: null,
        overrideLimit: !respectLimit
      });
      // Remove approved items from local state so UI updates instantly
      setRequests(prev => prev.filter(req => !selectedIds.has(req.id)));
      
      setUndoMessage(`${selectedIds.size} Requests Approved`);
      setShowUndo(true);
      setTimeout(() => setShowUndo(false), 10000);
      
      setSelectedIds(new Set());
      setDialogVisible(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Approval failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Text style={{color: MUTED, padding: 20}}>Loading...</Text>;
  if (error) return <Text style={{color: RED, padding: 20}}>{error}</Text>;

  return (
    <AnimatedSlideUp>
      {/* Smart Selection Bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={[styles.cardTitle, { marginBottom: 0, marginLeft: 4 }]}>
          Pending ({requests.length})
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => handleSelectByType('topic')} style={[styles.applyBtn, { backgroundColor: 'transparent', borderColor: MUTED }]}>
            <Text style={[styles.applyBtnText, { color: MUTED }]}>+ Topics</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleInvertSelection} style={[styles.applyBtn, { backgroundColor: 'transparent', borderColor: MUTED }]}>
            <Text style={[styles.applyBtnText, { color: MUTED }]}>Invert</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSelectAll} style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>
              {selectedIds.size === requests.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {requests.length === 0 && <Text style={{color: MUTED, padding: 10}}>No requests found.</Text>}

      {requests.map((req, i) => {
        const isSelected = selectedIds.has(req.id);
        return (
          <TouchableOpacity 
            key={req.id || i} 
            activeOpacity={0.8}
            onPress={() => toggleSelect(req.id)}
          >
            <NeuCard style={[{ marginBottom: 12 }, isSelected && { borderColor: GOLD, borderWidth: 1 }]}>
              <View style={styles.reqRow}>
                {/* Checkbox */}
                <View style={[styles.checkbox, isSelected && styles.checkboxChecked, { marginRight: 12, marginTop: 4 }]}>
                  {isSelected && <Text style={{ fontSize: 9, color: BG, fontWeight: '900' }}>✓</Text>}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.reqStudent}>{req.studentName || req.studentId || 'Unknown Student'}</Text>
                  <Text style={styles.reqEntity} numberOfLines={1}>
                    {req.contentName || req.entityName || req.contentId || 'Unknown Content'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <Chip label={(req.requestType || req.entityType || 'Resource').toUpperCase()} color={GOLD} />
                    <Chip label={req.reason || 'General'} color={MUTED} />
                  </View>
                </View>
              </View>
            </NeuCard>
          </TouchableOpacity>
        );
      })}

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <View style={styles.bulkToolbar}>
          <Text style={{ color: BG, fontWeight: 'bold', fontSize: 13, marginRight: 'auto' }}>
            {selectedIds.size} Selected
          </Text>
          <TouchableOpacity onPress={() => setDialogVisible(true)} style={[styles.applyBtn, { backgroundColor: BG, borderColor: 'transparent' }]}>
            <Text style={{ color: GOLD, fontWeight: 'bold' }}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bulk Approval Dialog */}
      <Modal visible={dialogVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.cardTitle}>Bulk Approval Preview</Text>
            <Text style={{ color: MUTED, marginBottom: 16 }}>
              Approving {selectedIds.size} selected requests.
            </Text>
            
            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.subTitle}>Grant Type</Text>
                <View style={styles.modeRow}>
                  <ModeToggle label="Temporary" active={grantType === 'TEMPORARY'} onPress={() => setGrantType('TEMPORARY')} />
                  <ModeToggle label="Permanent" active={grantType === 'PERMANENT'} onPress={() => setGrantType('PERMANENT')} />
                </View>
              </View>

              {grantType === 'TEMPORARY' && (
                <View>
                  <Text style={styles.subTitle}>Duration</Text>
                  <View style={styles.modeRow}>
                    <ModeToggle label="24h" active={durationHours === 24} onPress={() => setDurationHours(24)} />
                    <ModeToggle label="48h" active={durationHours === 48} onPress={() => setDurationHours(48)} />
                    <ModeToggle label="7d" active={durationHours === 168} onPress={() => setDurationHours(168)} />
                  </View>
                </View>
              )}
              
              <View>
                <Text style={styles.subTitle}>Consume Monthly Units</Text>
                <View style={styles.modeRow}>
                  <ModeToggle label="Yes" active={consumeUnits === true} onPress={() => setConsumeUnits(true)} />
                  <ModeToggle label="No" active={consumeUnits === false} onPress={() => setConsumeUnits(false)} />
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <View style={{ flex: 1 }}>
                <NeuButton label="Cancel" variant="secondary" onPress={() => setDialogVisible(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <NeuButton label={isSubmitting ? "Wait..." : "Confirm"} onPress={handleBulkApproveSubmit} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Undo Snackbar */}
      {showUndo && (
        <View style={styles.snackbar}>
          <Text style={{ color: BG, fontWeight: 'bold' }}>{undoMessage}</Text>
          <TouchableOpacity onPress={() => setShowUndo(false)}>
            <Text style={{ color: GOLD, fontWeight: 'bold' }}>UNDO</Text>
          </TouchableOpacity>
        </View>
      )}
    </AnimatedSlideUp>
  );
};


/* ─── History Tab (Approved + Rejected) ──────────────────────────────────────── */
const HistoryTab: React.FC = () => {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<'ALL' | 'APPROVED' | 'REJECTED'>('ALL');
  const [convertModal, setConvertModal] = React.useState<{ grant: any; visible: boolean } | null>(null);
  const [convertHours, setConvertHours] = React.useState(48);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = filter === 'ALL' ? undefined : filter as 'APPROVED' | 'REJECTED';
      const res = await AccessRulesApi.listAccessHistory(statusParam);
      setHistory(res.data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => { load(); }, [load]);

  const handleRevoke = async (grantId: string) => {
    const msg = 'Revoke this access grant? The student will lose access immediately.';
    const execute = async () => {
      try {
        await AccessRulesApi.revokeGrant(grantId, 'Revoked by admin from History tab');
        load();
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.message || 'Revoke failed');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) execute();
    } else {
      Alert.alert('Revoke Grant?', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke', style: 'destructive', onPress: execute },
      ]);
    }
  };

  const handleConvertSubmit = async () => {
    if (!convertModal?.grant) return;
    setIsSubmitting(true);
    try {
      await AccessRulesApi.convertGrant(convertModal.grant.id, { newType: 'TEMPORARY', durationHours: convertHours });
      setConvertModal(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Conversion failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedSlideUp>
      {/* Filter strip */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {(['ALL', 'APPROVED', 'REJECTED'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.applyBtn, filter === f && { backgroundColor: GOLD, borderColor: GOLD }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.applyBtnText, filter === f && { color: BG }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <Text style={{ color: MUTED, padding: 12 }}>Loading history...</Text>}
      {error && <Text style={{ color: RED, padding: 12 }}>{error}</Text>}
      {!loading && history.length === 0 && <Text style={{ color: MUTED, padding: 12 }}>No records found.</Text>}

      {history.map((item, i) => {
        const isApproved = item.status === 'APPROVED';
        const statusColor = isApproved ? colors.success : RED;
        const grant = item.grant;

        return (
          <NeuCard key={item.id || i} style={{ marginBottom: 12, borderLeftWidth: 3, borderLeftColor: statusColor + '80' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ marginTop: 2 }}>
                {isApproved
                  ? <CheckCircle2 size={18} color={colors.success} />
                  : <XCircle size={18} color={RED} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reqStudent}>{item.studentName || item.studentId}</Text>
                <Text style={styles.reqEntity} numberOfLines={1}>
                  {item.contentName || item.entityName || item.contentId || 'Unknown Content'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <Chip label={item.status} color={statusColor} />
                  <Chip label={(item.requestType || 'Resource').toUpperCase()} color={GOLD} />
                  {grant && <Chip label={grant.accessType || 'UNKNOWN'} color={grant.accessType === 'PERMANENT' ? colors.success : colors.warning} />}
                  {item.hoursLeft != null && <Chip label={`${item.hoursLeft}h left`} color={MUTED} />}
                </View>
                {!isApproved && item.rejectionReason && (
                  <Text style={{ color: MUTED, fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>
                    Reason: {item.rejectionReason}
                  </Text>
                )}
                <Text style={{ color: MUTED, fontSize: 10, marginTop: 4 }}>
                  {new Date(item.updatedAt || item.requestedAt).toLocaleString()}
                </Text>
              </View>
              {/* Actions for approved with active grant */}
              {isApproved && grant && (
                <View style={{ gap: 8, alignItems: 'flex-end' }}>
                  <ActionBtn label="Revoke" color={RED} onPress={() => handleRevoke(grant.id)} />
                  {grant.accessType === 'PERMANENT' && (
                    <ActionBtn label="→ Temp" color={GOLD} onPress={() => setConvertModal({ grant, visible: true })} />
                  )}
                </View>
              )}
            </View>
          </NeuCard>
        );
      })}

      {/* Convert to Temp Modal */}
      <Modal visible={!!convertModal?.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.cardTitle}>Convert to Temporary</Text>
            <Text style={{ color: MUTED, marginBottom: 16 }}>Select a duration for the temporary grant.</Text>
            <View style={styles.modeRow}>
              {[24, 48, 168].map(h => (
                <ModeToggle key={h} label={h === 168 ? '7d' : `${h}h`} active={convertHours === h} onPress={() => setConvertHours(h)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <View style={{ flex: 1 }}><NeuButton label="Cancel" variant="secondary" onPress={() => setConvertModal(null)} /></View>
              <View style={{ flex: 1 }}><NeuButton label={isSubmitting ? 'Wait...' : 'Convert'} onPress={handleConvertSubmit} /></View>
            </View>
          </View>
        </View>
      </Modal>
    </AnimatedSlideUp>
  );
};

/* ─── Permanent Grants Tab ────────────────────────────────────────────────────── */
const PermanentGrantsTab: React.FC = () => {
  const [grants, setGrants] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [convertModal, setConvertModal] = React.useState<{ grant: any; visible: boolean } | null>(null);
  const [convertHours, setConvertHours] = React.useState(48);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AccessRulesApi.listPermanentGrants();
      setGrants(res.data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load permanent grants');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const handleRevoke = (grantId: string) => {
    const msg = 'Permanently revoke this grant? The student will lose access immediately.';
    const execute = async () => {
      try {
        await AccessRulesApi.revokeGrant(grantId, 'Revoked by admin');
        setGrants(prev => prev.filter(g => g.id !== grantId));
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.message || 'Revoke failed');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) execute();
    } else {
      Alert.alert('Revoke Permanent Grant?', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke', style: 'destructive', onPress: execute },
      ]);
    }
  };

  const handleConvertSubmit = async () => {
    if (!convertModal?.grant) return;
    setIsSubmitting(true);
    try {
      await AccessRulesApi.convertGrant(convertModal.grant.id, { newType: 'TEMPORARY', durationHours: convertHours });
      setConvertModal(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Conversion failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatedSlideUp>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={[styles.cardTitle, { marginBottom: 0, marginLeft: 4 }]}>
          Permanent Grants ({grants.length})
        </Text>
        <Chip label="∞ No Expiry" color={colors.success} />
      </View>

      {loading && <Text style={{ color: MUTED, padding: 12 }}>Loading permanent grants...</Text>}
      {error && <Text style={{ color: RED, padding: 12 }}>{error}</Text>}
      {!loading && grants.length === 0 && (
        <NeuCard>
          <Text style={{ color: MUTED, textAlign: 'center', padding: 16 }}>No permanent grants found.</Text>
        </NeuCard>
      )}

      {grants.map((grant, i) => (
        <NeuCard key={grant.id || i} style={{ marginBottom: 12, borderLeftWidth: 3, borderLeftColor: colors.success + '60' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.reqStudent}>{grant.studentName || 'Unknown Student'}</Text>
              <Text style={styles.reqEntity}>{grant.studentEmail || ''}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <Chip label={(grant.entityType || 'Resource').toUpperCase()} color={GOLD} />
                <Chip label="PERMANENT" color={colors.success} />
              </View>
              <Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>
                Granted: {new Date(grant.grantedAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={{ gap: 8, alignItems: 'flex-end' }}>
              <ActionBtn label="Revoke" color={RED} onPress={() => handleRevoke(grant.id)} />
              <ActionBtn label="→ Temp" color={GOLD} onPress={() => setConvertModal({ grant, visible: true })} />
            </View>
          </View>
        </NeuCard>
      ))}

      {/* Convert to Temp Modal */}
      <Modal visible={!!convertModal?.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.cardTitle}>Convert to Temporary</Text>
            <Text style={{ color: MUTED, marginBottom: 16 }}>The grant will expire after the selected duration.</Text>
            <View style={styles.modeRow}>
              {[24, 48, 168].map(h => (
                <ModeToggle key={h} label={h === 168 ? '7d' : `${h}h`} active={convertHours === h} onPress={() => setConvertHours(h)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <View style={{ flex: 1 }}><NeuButton label="Cancel" variant="secondary" onPress={() => setConvertModal(null)} /></View>
              <View style={{ flex: 1 }}><NeuButton label={isSubmitting ? 'Wait...' : 'Convert'} onPress={handleConvertSubmit} /></View>
            </View>
          </View>
        </View>
      </Modal>
    </AnimatedSlideUp>
  );
};
const AnalyticsTab: React.FC = () => {
  const [data, setData] = React.useState<any>(null);
  const [grants, setGrants] = React.useState<any[]>([]);
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    Promise.all([
      AccessRulesApi.getAnalytics(),
      AccessRulesApi.listTemporaryGrants(),
      AccessRulesApi.listAccessHistory(),
    ]).then(([analyticsRes, grantsRes, historyRes]) => {
      setData(analyticsRes.data?.data);
      setGrants(grantsRes.data?.data || []);
      setHistory(historyRes.data?.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    try {
      const res = await AccessRulesApi.exportAnalytics();
      alert(`Export Successful: ${res.data?.data}`);
    } catch (e) {
      alert('Export failed');
    }
  };

  const handleRevoke = async (grantId: string) => {
    try {
      await AccessRulesApi.revokeGrant(grantId, 'Admin Revoked');
      setGrants(prev => prev.filter(g => g.id !== grantId));
    } catch (e) {
      alert('Revoke failed');
    }
  };

  if (loading || !data) return <Text style={{color: MUTED, padding: 20}}>Loading Analytics...</Text>;

  const approvedCount = history.filter(h => h.status === 'APPROVED').length;
  const rejectedCount = history.filter(h => h.status === 'REJECTED').length;
  const totalHistory = approvedCount + rejectedCount || 1;
  const approvedPct = Math.round((approvedCount / totalHistory) * 100);

  const tempCount = data.overview?.activeTemporaryGrants || 0;
  const permCount = data.overview?.activePermanentGrants || 0;
  const totalGrants = tempCount + permCount || 1;
  const permPct = Math.round((permCount / totalGrants) * 100);

  return (
    <AnimatedSlideUp>
      <NeuCard style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={styles.cardTitle}>Enterprise Analytics</Text>
          <NeuButton label="Export CSV" variant="secondary" onPress={handleExport} />
        </View>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{data.overview?.pendingRequests}</Text>
            <Text style={styles.statLbl}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{data.overview?.activeTemporaryGrants}</Text>
            <Text style={styles.statLbl}>Temp Grants</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: colors.success }]}>{data.overview?.activePermanentGrants}</Text>
            <Text style={styles.statLbl}>Permanent</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: RED }]}>{data.expiry?.expiringToday}</Text>
            <Text style={styles.statLbl}>Expiring Today</Text>
          </View>
        </View>
      </NeuCard>

      {/* Approval Rate */}
      <Text style={[styles.cardTitle, { marginBottom: 8, marginLeft: 4 }]}>Approval Rate (All Time)</Text>
      <NeuCard style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: colors.success, fontWeight: '700', fontSize: 13 }}>✓ {approvedCount} Approved</Text>
          <Text style={{ color: RED, fontWeight: '700', fontSize: 13 }}>✗ {rejectedCount} Rejected</Text>
        </View>
        <View style={{ height: 10, backgroundColor: `${SURFACE}`, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' }}>
          <View style={{ width: `${approvedPct}%`, height: '100%', backgroundColor: colors.success }} />
          <View style={{ flex: 1, height: '100%', backgroundColor: RED + '60' }} />
        </View>
        <Text style={{ color: MUTED, fontSize: 11, marginTop: 6 }}>{approvedPct}% approval rate</Text>
      </NeuCard>

      {/* Permanent vs Temp */}
      <Text style={[styles.cardTitle, { marginBottom: 8, marginLeft: 4 }]}>Grant Type Distribution</Text>
      <NeuCard style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: colors.success, fontWeight: '700', fontSize: 13 }}>∞ {permCount} Permanent</Text>
          <Text style={{ color: GOLD, fontWeight: '700', fontSize: 13 }}>⏱ {tempCount} Temporary</Text>
        </View>
        <View style={{ height: 10, backgroundColor: `${SURFACE}`, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' }}>
          <View style={{ width: `${permPct}%`, height: '100%', backgroundColor: colors.success }} />
          <View style={{ flex: 1, height: '100%', backgroundColor: GOLD + '60' }} />
        </View>
        <Text style={{ color: MUTED, fontSize: 11, marginTop: 6 }}>{permCount} permanent of {permCount + tempCount} total active grants</Text>
      </NeuCard>

      {/* Usage */}
      <Text style={[styles.cardTitle, { marginBottom: 8, marginLeft: 4 }]}>Monthly Unit Usage</Text>
      <NeuCard style={{ marginBottom: 16 }}>
        <Text style={{ color: MUTED, fontSize: 11 }}>{data.usage?.recordedUnitsGrantedMonth || 0} units granted this month</Text>
      </NeuCard>

      <Text style={[styles.cardTitle, { marginBottom: 12, marginLeft: 4 }]}>Active Temporary Grants ({grants.length})</Text>
      {grants.length === 0 && <Text style={{color: MUTED, padding: 10}}>No active grants.</Text>}
      {grants.map((grant, i) => (
        <NeuCard key={grant.id || i} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.reqStudent}>{grant.studentName || 'Unknown Student'}</Text>
              <Text style={styles.reqEntity} numberOfLines={1}>
                Content ID: {grant.entityId}
              </Text>
              <Text style={{ color: MUTED, fontSize: 11, marginTop: 4 }}>
                Expires in: {grant.hoursLeft ?? 'N/A'} hrs
              </Text>
            </View>
            <View style={{ justifyContent: 'center' }}>
              <ActionBtn label="Revoke" color={RED} onPress={() => handleRevoke(grant.id)} />
            </View>
          </View>
        </NeuCard>
      ))}
    </AnimatedSlideUp>
  );
};

/* ─── Templates Tab ─────────────────────────────────────────────────────────────── */
const TemplatesTab: React.FC = () => {
  const TEMPLATES = [
    { name: 'Online Only',        vis: 'batch',  batches: ['Online A'] },
    { name: 'Revision Week',      vis: 'batch',  batches: ['Online A', 'Offline B'] },
    { name: 'Recorded Students',  vis: 'batch',  batches: ['Recorded C'] },
    { name: 'All Access',         vis: 'public', batches: [] },
  ];

  return (
    <AnimatedSlideUp>
      <Text style={[styles.cardTitle, { marginBottom: 12, marginLeft: 4 }]}>Permission Templates</Text>
      {TEMPLATES.map((t, i) => (
        <NeuCard key={i} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.reqStudent}>{t.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <Chip label={t.vis} color={GOLD} />
                {t.batches.map((b, j) => <Chip key={j} label={b} color={MUTED} />)}
              </View>
            </View>
            <TouchableOpacity style={styles.applyBtn} activeOpacity={0.75}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </NeuCard>
      ))}
      <NeuButton label="+ Save Current as Template" onPress={() => {}} variant="secondary" />
    </AnimatedSlideUp>
  );
};

/* ─── Reusable Neumorphic Components ─────────────────────────────────────────── */

const NeuCard: React.FC<{ children: React.ReactNode; style?: object }> = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const NeuButton: React.FC<{
  label: string; onPress: () => void; variant?: 'primary' | 'secondary';
}> = ({ label, onPress, variant = 'primary' }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[styles.btn, variant === 'secondary' && styles.btnSecondary]}
  >
    <Text style={[styles.btnText, variant === 'secondary' && styles.btnTextSecondary]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ModeToggle: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label, active, onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[styles.modeBtn, active && styles.modeBtnActive]}
  >
    <Text style={[styles.modeBtnText, active && styles.modeBtnTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const BatchChip: React.FC<{ label: string; checked: boolean; onPress?: () => void }> = ({ label, checked, onPress }) => (
  <TouchableOpacity style={styles.batchChip} activeOpacity={0.75} onPress={onPress}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={{ fontSize: 9, color: BG, fontWeight: '900' }}>✓</Text>}
    </View>
    <Text style={[styles.batchLabel, { color: checked ? TEXT : MUTED }]}>{label}</Text>
  </TouchableOpacity>
);

const Chip: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View style={[styles.chip, { borderColor: color + '40', backgroundColor: color + '15' }]}>
    <Text style={[styles.chipText, { color }]}>{label}</Text>
  </View>
);

const ActionBtn: React.FC<{ label: string; color: string; onPress: () => void }> = ({
  label, color, onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.actionBtn, { borderColor: color + '40', backgroundColor: color + '20' }]}
    activeOpacity={0.75}
  >
    <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  /* Sub-tabs */
  subTabWrapper: {
    backgroundColor: SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  subTabRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: BG,
    // Neumorphic raised
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  subTabActive: {
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  subTabLabel:       { fontSize: 11, color: MUTED, fontWeight: '600' },
  subTabLabelActive: { color: BG, fontWeight: '800' },

  /* Cards */
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 4,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: TEXT, marginBottom: 12, letterSpacing: 0.3 },

  /* Mode toggle */
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  modeBtnActive: {
    backgroundColor: `${GOLD}20`,
    borderColor: `${GOLD}60`,
    shadowColor: GOLD,
    shadowOpacity: 0.2,
    elevation: 0,
  },
  modeBtnText:       { fontSize: 12, color: MUTED, fontWeight: '600' },
  modeBtnTextActive: { color: GOLD, fontWeight: '800' },

  inheritBadge: {
    marginTop: 12,
    backgroundColor: `${GOLD}10`,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: `${GOLD}25`,
  },
  inheritText: { fontSize: 11, color: GOLD, fontWeight: '600' },

  /* Visibility */
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: BG,
  },
  visibilityRowActive: {
    backgroundColor: SURF_H,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 0,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  visLabel:   { fontSize: 13, color: TEXT, fontWeight: '700' },
  visDesc:    { fontSize: 11, color: MUTED, marginTop: 2 },

  /* Sub-section */
  subSection: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  subTitle: { fontSize: 11, color: GOLD, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },

  /* Batch chips */
  batchChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  checkbox: {
    width: 18, height: 18, borderRadius: 5,
    borderWidth: 1, borderColor: MUTED,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: GOLD, borderColor: GOLD },
  batchLabel: { fontSize: 13, fontWeight: '500' },

  filterToggleWrap: {
    flexDirection: 'row',
    backgroundColor: BG,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  filterToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  filterToggleBtnActive: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  filterToggleText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '500',
  },
  filterToggleTextActive: {
    color: TEXT,
    fontWeight: '700',
  },

  /* Cascade */
  cascadeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  cascadeRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: MUTED,
    alignItems: 'center', justifyContent: 'center',
  },
  cascadeLabel: { fontSize: 13, color: MUTED, fontWeight: '500' },

  /* Buttons */
  btn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: `${GOLD}40`,
    shadowColor: 'transparent',
    elevation: 0,
  },
  btnText:          { fontSize: 14, fontWeight: '800', color: BG, letterSpacing: 0.5 },
  btnTextSecondary: { color: GOLD },

  /* Requests */
  reqRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  reqStudent:{ fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 2 },
  reqEntity: { fontSize: 12, color: MUTED },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },

  /* Matrix */
  matrixHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  matrixRow:     { flexDirection: 'row', paddingVertical: 8 },
  matrixRowEven: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 6 },
  matrixCell: {
    flex: 1,
    fontSize: 11,
    color: MUTED,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Misc */
  chip: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 10, fontWeight: '700' },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: 14, fontWeight: '900' },
  applyBtn: {
    backgroundColor: `${GOLD}20`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${GOLD}40`,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  applyBtnText: { fontSize: 12, color: GOLD, fontWeight: '700' },

  /* Bulk & Analytics */
  bulkToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${GOLD}20`,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${GOLD}40`,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: BG,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: TEXT,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: SURFACE,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statVal: {
    fontSize: 24,
    fontWeight: '800',
    color: GOLD,
  },
  statLbl: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '600',
    marginTop: 4,
  }
});
