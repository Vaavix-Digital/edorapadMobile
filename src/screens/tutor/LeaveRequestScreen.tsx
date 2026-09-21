import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Check,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  submitTutorLeave,
  fetchTutorLeaveHistory,
} from '../../store/slices/tutorSlice';

const { width: SCREEN_W } = Dimensions.get('window');

const LEAVE_TYPES = ['Paid Leave', 'Casual Leave', 'Sick Leave', 'Unpaid Leave'];

export const LeaveRequestScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { leaveHistory } = useAppSelector((state) => state.tutor);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('Paid Leave');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [dispatch]);

  const loadHistory = async () => {
    setFetchingHistory(true);
    try {
      await dispatch(fetchTutorLeaveHistory()).unwrap();
    } catch {
      // ignore
    } finally {
      setFetchingHistory(false);
    }
  };

  const calculateDays = (start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return isNaN(diffDays) ? 1 : diffDays;
    } catch {
      return 1;
    }
  };

  const handleSubmit = async () => {
    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert('Required', 'Please enter start date and end date');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Required', 'Please enter reason for leave');
      return;
    }

    // Format DD-MM-YYYY to YYYY-MM-DD if needed
    let startIso = startDate.trim();
    if (startIso.includes('-')) {
      const parts = startIso.split('-');
      if (parts.length === 3 && parts[0].length === 2) {
        startIso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    let endIso = endDate.trim();
    if (endIso.includes('-')) {
      const parts = endIso.split('-');
      if (parts.length === 3 && parts[0].length === 2) {
        endIso = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    setLoading(true);
    try {
      await dispatch(
        submitTutorLeave({
          startDate: startIso,
          endDate: endIso,
          reason: reason.trim(),
          type: leaveType,
        })
      ).unwrap();

      Alert.alert('Success', 'Leave application submitted successfully!');
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveType('Paid Leave');
      loadHistory();
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || 'Pending').toLowerCase();
    if (s.includes('approved')) {
      return {
        bg: '#DCFCE7',
        text: '#15803D',
        border: '#BBF7D0',
        label: 'Approved',
        icon: <CheckCircle2 size={12} color="#15803D" />,
      };
    }
    if (s.includes('rejected')) {
      return {
        bg: '#FEE2E2',
        text: '#B91C1C',
        border: '#FECACA',
        label: 'Rejected',
        icon: <XCircle size={12} color="#B91C1C" />,
      };
    }
    return {
      bg: '#FEF9C3',
      text: '#A16207',
      border: '#FEF08A',
      label: 'Pending',
      icon: <Clock size={12} color="#A16207" />,
    };
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <Header
        title="Leave Request"
        subtitle="Apply for leave and track your leave history"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ─── APPLY FOR LEAVE CARD (Matches Web Screenshot 2) ─── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Apply for Leave</Text>

          {/* Date Range */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Date Range <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <View style={styles.dateRangeBox}>
              <TextInput
                style={styles.dateInput}
                placeholder="Start date (YYYY-MM-DD)"
                placeholderTextColor="#94A3B8"
                value={startDate}
                onChangeText={setStartDate}
              />
              <Text style={styles.dateArrow}>→</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="End date (YYYY-MM-DD)"
                placeholderTextColor="#94A3B8"
                value={endDate}
                onChangeText={setEndDate}
              />
              <CalendarIcon size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
            </View>
          </View>

          {/* Leave Type */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Leave Type <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => setIsTypePickerOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>{leaveType}</Text>
              <ChevronDown size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Reason */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Reason <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.inputField, styles.textarea]}
              placeholder="Enter reason for leave..."
              placeholderTextColor="#94A3B8"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Leave Request</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ─── LEAVE HISTORY CARD (Matches Web Screenshot 2) ─── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Leave History</Text>

          {fetchingHistory ? (
            <View style={styles.loadingHistory}>
              <ActivityIndicator color="#3E7B74" />
              <Text style={styles.loadingHistoryText}>Loading leave history...</Text>
            </View>
          ) : leaveHistory.length === 0 ? (
            <View style={styles.emptyHistoryBox}>
              <View style={styles.calendarIconBubble}>
                <CalendarIcon size={32} color="#3B82F6" />
              </View>
              <Text style={styles.emptyHistoryTitle}>No leave requests yet</Text>
              <Text style={styles.emptyHistorySub}>Apply for leave using the form</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {leaveHistory.map((item: any, idx: number) => {
                const badge = getStatusBadge(item.status);
                const sDate = item.startDate ? item.startDate.split('T')[0] : '';
                const eDate = item.endDate ? item.endDate.split('T')[0] : '';
                const days = calculateDays(sDate, eDate);

                return (
                  <View key={item.id || item._id || idx} style={styles.historyItem}>
                    <View style={styles.historyItemHeader}>
                      <View>
                        <Text style={styles.historyItemType}>
                          {item.type || item.leaveType || 'Leave'}
                        </Text>
                        <Text style={styles.historyItemDates}>
                          {sDate} → {eDate} ({days} day{days > 1 ? 's' : ''})
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: badge.bg, borderColor: badge.border },
                        ]}
                      >
                        {badge.icon}
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                    {item.reason ? (
                      <Text style={styles.historyItemReason} numberOfLines={2}>
                        {item.reason}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Leave Type Selector Modal */}
      <Modal
        visible={isTypePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTypePickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setIsTypePickerOpen(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Leave Type</Text>
            {LEAVE_TYPES.map((t) => {
              const isSelected = leaveType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                  onPress={() => {
                    setLeaveType(t);
                    setIsTypePickerOpen(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                    {t}
                  </Text>
                  {isSelected && <Check size={16} color="#3E7B74" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dateRangeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    padding: 0,
  },
  dateArrow: {
    paddingHorizontal: 6,
    color: '#9CA3AF',
    fontSize: 14,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: '#1F2937',
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  textarea: {
    height: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#3E7B74',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // History section
  loadingHistory: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  loadingHistoryText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyHistoryBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  calendarIconBubble: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptyHistorySub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  historyItemType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  historyItemDates: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  historyItemReason: {
    fontSize: 13,
    color: '#475569',
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemActive: {
    backgroundColor: '#F0FDFA',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  pickerItemText: {
    fontSize: 14,
    color: '#334155',
  },
  pickerItemTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
});
