/**
 * NERMAI SACS — Mobile Locked Content Card (Student UX)
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AnimatedScaleIn, AnimatedSlideUp, configureLayoutAnimation } from '../../core/animations';
import { Lock, Clock, Send, AlertTriangle } from 'lucide-react-native';
import { colors } from '@nermai/theme';

const BG      = colors.background;
const SURFACE = colors.surface;
const SURF_H  = '#252525';
const GOLD    = colors.primary;
const RED     = colors.accent;
const TEXT    = colors.textPrimary;
const MUTED   = colors.textSecondary;

interface LockedContentCardProps {
  entityId: string;
  entityName: string;
  entityType: string;
  lockReason: 'batch_only' | 'student_only' | 'hidden_by_admin' | 'prerequisite_not_met' | 'pending_request';
  lockMessage: string;
  onSubmitRequest?: (reason: string) => Promise<void>;
}

export const LockedContentCard: React.FC<LockedContentCardProps> = ({
  entityName, entityType, lockReason, lockMessage, onSubmitRequest
}) => {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(lockReason === 'pending_request');

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      if (onSubmitRequest) await onSubmitRequest(reason);
      setSubmitted(true);
      setShowForm(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHidden = lockReason === 'hidden_by_admin';

  return (
    <AnimatedScaleIn style={styles.card}>
      <View style={[styles.iconWrap, { borderColor: isHidden ? `${RED}40` : `${GOLD}40`, backgroundColor: isHidden ? `${RED}15` : `${GOLD}15` }]}>
        {isHidden ? <AlertTriangle size={32} color={RED} /> : <Lock size={32} color={GOLD} />}
      </View>

      <Text style={styles.title}>{isHidden ? 'Content Unavailable' : 'Content Locked'}</Text>
      <Text style={styles.message}>{lockMessage}</Text>

      <View style={styles.actionArea}>
        {isHidden ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Administrators have hidden this {entityType}.</Text>
          </View>
        ) : submitted ? (
          <View style={styles.successBadge}>
            <Clock size={16} color={GOLD} />
            <Text style={styles.successText}>Access request is pending review.</Text>
          </View>
        ) : !showForm ? (
          <TouchableOpacity style={styles.requestBtn} onPress={() => { configureLayoutAnimation(); setShowForm(true); }} activeOpacity={0.8}>
            <Text style={styles.requestBtnText}>Request Access</Text>
          </TouchableOpacity>
        ) : (
          <AnimatedSlideUp style={{ height: 140 }}>
            <TextInput
              style={styles.input}
              placeholder="Why do you need access?"
              placeholderTextColor={MUTED}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, (!reason.trim() || isSubmitting) && styles.submitDisabled]} 
                onPress={handleSubmit}
                disabled={!reason.trim() || isSubmitting}
              >
                <Text style={[styles.submitText, (!reason.trim() || isSubmitting) && styles.submitTextDisabled]}>
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </Text>
                {!isSubmitting && reason.trim() && <Send size={14} color={BG} style={{ marginLeft: 6 }} />}
              </TouchableOpacity>
            </View>
          </AnimatedSlideUp>
        )}
      </View>
    </AnimatedScaleIn>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  actionArea: {
    width: '100%',
    marginTop: 24,
  },
  badge: {
    backgroundColor: SURF_H,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  badgeText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  successBadge: {
    flexDirection: 'row',
    backgroundColor: `${GOLD}15`,
    borderColor: `${GOLD}40`,
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    color: GOLD,
    fontWeight: '700',
    marginLeft: 8,
  },
  requestBtn: {
    backgroundColor: GOLD,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  requestBtnText: {
    color: BG,
    fontSize: 15,
    fontWeight: '800',
  },
  input: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    color: TEXT,
    padding: 14,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: SURF_H,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: MUTED,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: GOLD,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitDisabled: {
    backgroundColor: SURF_H,
  },
  submitText: {
    color: BG,
    fontWeight: '800',
  },
  submitTextDisabled: {
    color: MUTED,
  }
});
