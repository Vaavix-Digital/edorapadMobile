import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Check,
  X,
  CalendarDays,
  FileText,
  Search,
  RefreshCw,
  Info,
  User,
  Inbox,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchInstituteLeaves,
  updateLeaveStatusThunk,
} from '../../store/slices/instituteSlice';
import { LeaveRequest } from '../../shared/types';

export const LeaveApprovalsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { leaves, loading } = useAppSelector((state) => state.institute);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadLeaves = useCallback(async () => {
    await dispatch(fetchInstituteLeaves());
  }, [dispatch]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaves();
    setRefreshing(false);
  };

  // ─── Format Dates & Calculate Duration ───────────────────────────────────────
  const formatDateRange = (start?: string, end?: string) => {
    if (!start) return 'N/A';
    try {
      const s = new Date(start);
      const e = end ? new Date(end) : s;

      const sFormatted = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const eFormatted = e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      return `${sFormatted} - ${eFormatted}`;
    } catch {
      return `${start} - ${end || ''}`;
    }
  };

  const calculateDays = (start?: string, end?: string) => {
    if (!start || !end) return 1;
    try {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const diffTime = Math.abs(e - s);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    } catch {
      return 1;
    }
  };

  // ─── Filter Leaves ──────────────────────────────────────────────────────────
  const filteredLeaves = useMemo(() => {
    return (leaves || []).filter((leave) => {
      const staffName = leave.staff?.name || leave.userName || '';
      const reason = leave.reason || '';
      const type = leave.type || '';
      const customId = leave.staff?.staffCustomId || '';

      const matchesSearch =
        staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' || leave.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchQuery, statusFilter]);

  // ─── Status Counts for Filter Chips ─────────────────────────────────────────
  const counts = useMemo(() => {
    const list = leaves || [];
    return {
      all: list.length,
      pending: list.filter((l) => l.status?.toLowerCase() === 'pending').length,
      approved: list.filter((l) => l.status?.toLowerCase() === 'approved').length,
      rejected: list.filter((l) => l.status?.toLowerCase() === 'rejected').length,
    };
  }, [leaves]);

  // ─── Status Actions ──────────────────────────────────────────────────────────
  const handleStatusChange = (leave: LeaveRequest, newStatus: 'Approved' | 'Rejected') => {
    const leaveId = leave.id || leave._id || '';
    const staffName = leave.staff?.name || leave.userName || 'Staff Member';

    Alert.alert(
      `${newStatus === 'Approved' ? 'Approve' : 'Reject'} Leave`,
      `Are you sure you want to ${newStatus.toLowerCase()} the leave request for ${staffName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus === 'Approved' ? 'Approve' : 'Reject',
          style: newStatus === 'Approved' ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoadingId(leaveId);
            try {
              const res = await dispatch(
                updateLeaveStatusThunk({ leaveId, status: newStatus })
              );
              if (updateLeaveStatusThunk.fulfilled.match(res)) {
                Alert.alert('Success', `Leave request ${newStatus.toLowerCase()} successfully.`);
              } else {
                Alert.alert('Error', (res.payload as string) || 'Failed to update leave status.');
              }
            } catch {
              Alert.alert('Error', 'An error occurred while updating status.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // ─── Render Leave Card ───────────────────────────────────────────────────────
  const renderLeaveCard = ({ item }: { item: LeaveRequest }) => {
    const leaveId = item.id || item._id || '';
    const staffName = item.staff?.name || item.userName || 'Staff Member';
    const staffId = item.staff?.staffCustomId || 'STF-001';
    const staffRole = item.staff?.role || item.role || 'Faculty';
    const profilePic = item.staff?.profilePicUrl;
    const leaveType = item.type || 'Paid';
    const isPending = item.status?.toLowerCase() === 'pending';
    const isApproved = item.status?.toLowerCase() === 'approved';
    const isRejected = item.status?.toLowerCase() === 'rejected';
    const isActionLoading = actionLoadingId === leaveId;

    const daysCount = calculateDays(item.startDate, item.endDate);

    return (
      <View style={styles.leaveCard}>
        {/* Top Header: Staff Avatar, Name, Custom ID, Role, and Leave Type */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.staffMetaLeft}>
            <View style={styles.avatarWrap}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {staffName.charAt(0).toUpperCase() || 'S'}
                </Text>
              )}
            </View>
            <View style={styles.staffNamesCol}>
              <Text style={styles.staffNameText} numberOfLines={1}>
                {staffName}
              </Text>
              <Text style={styles.staffSubText} numberOfLines={1}>
                {staffId} • {staffRole}
              </Text>
            </View>
          </View>

          {/* Leave Type Pill (Paid / Unpaid) */}
          <View
            style={[
              styles.leaveTypePill,
              leaveType.toLowerCase() === 'paid' ? styles.paidPill : styles.unpaidPill,
            ]}
          >
            <Text
              style={[
                styles.leaveTypeText,
                leaveType.toLowerCase() === 'paid' ? styles.paidText : styles.unpaidText,
              ]}
            >
              {leaveType.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Middle Section: Period & Duration */}
        <View style={styles.periodRow}>
          <View style={styles.periodLeft}>
            <CalendarDays size={16} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.dateRangeText}>
              {formatDateRange(item.startDate, item.endDate)}
            </Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {daysCount} {daysCount === 1 ? 'Day' : 'Days'}
            </Text>
          </View>
        </View>

        {/* Reason Box */}
        {item.reason ? (
          <View style={styles.reasonBox}>
            <FileText size={14} color="#94A3B8" style={{ marginRight: 6, marginTop: 2 }} />
            <Text style={styles.reasonText} numberOfLines={3}>
              "{item.reason}"
            </Text>
          </View>
        ) : null}

        {/* Bottom Action / Status Bar */}
        <View style={styles.bottomBarRow}>
          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              isApproved
                ? styles.statusApproved
                : isRejected
                ? styles.statusRejected
                : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isApproved
                  ? styles.statusTextApproved
                  : isRejected
                  ? styles.statusTextRejected
                  : styles.statusTextPending,
              ]}
            >
              {item.status?.toUpperCase() || 'PENDING'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {isPending ? (
              <View style={styles.actionBtnsGroup}>
                {/* Approve Button */}
                <TouchableOpacity
                  style={[styles.actionIconBtn, styles.approveBtn, isActionLoading && styles.btnDisabled]}
                  onPress={() => handleStatusChange(item, 'Approved')}
                  disabled={isActionLoading}
                  activeOpacity={0.7}
                >
                  {isActionLoading ? (
                    <ActivityIndicator size="small" color="#16A34A" />
                  ) : (
                    <Check size={18} color="#16A34A" />
                  )}
                </TouchableOpacity>

                {/* Reject Button */}
                <TouchableOpacity
                  style={[styles.actionIconBtn, styles.rejectBtn, isActionLoading && styles.btnDisabled]}
                  onPress={() => handleStatusChange(item, 'Rejected')}
                  disabled={isActionLoading}
                  activeOpacity={0.7}
                >
                  <X size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.infoActionPill}>
                <Info size={14} color="#94A3B8" style={{ marginRight: 4 }} />
                <Text style={styles.infoActionText}>
                  {item.approvedBy ? `Reviewed by ${item.approvedBy}` : 'Recorded'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <Header
        title="Leave Approvals"
        subtitle="Review faculty and staff leave applications"
        showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
        onBack={() => navigation?.goBack?.()}
        rightAction={
          <TouchableOpacity onPress={loadLeaves} style={styles.refreshBtn}>
            <RefreshCw size={18} color="#1E293B" />
          </TouchableOpacity>
        }
      />

      {/* ─── Search Bar ─── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrap}>
          <Search size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by staff name, reason or type..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Filter Chips (All, Pending, Approved, Rejected) ─── */}
      <View style={styles.filterChipsContainer}>
        {(
          [
            { key: 'All', label: 'All', count: counts.all },
            { key: 'Pending', label: 'Pending', count: counts.pending },
            { key: 'Approved', label: 'Approved', count: counts.approved },
            { key: 'Rejected', label: 'Rejected', count: counts.rejected },
          ] as const
        ).map((f) => {
          const isActive = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {f.label}
              </Text>
              <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                <Text style={[styles.countBadgeText, isActive && styles.countBadgeTextActive]}>
                  {f.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── Leaves List ─── */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Fetching Leave Requests...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeaves}
          keyExtractor={(item, idx) => item.id || item._id || String(idx)}
          renderItem={renderLeaveCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Inbox size={32} color="#64748B" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery || statusFilter !== 'All' ? 'No Matching Requests' : 'No Leave Requests'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || statusFilter !== 'All'
                  ? 'Try adjusting your search query or status filter.'
                  : 'There are currently no staff or faculty leave applications to review.'}
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  refreshBtn: {
    padding: 8,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: '#F1F5F9',
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  countBadgeTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 40,
  },
  leaveCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  staffMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '800',
    color: '#54A39A',
  },
  staffNamesCol: {
    flex: 1,
  },
  staffNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  staffSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },
  leaveTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  paidPill: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  unpaidPill: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  leaveTypeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  paidText: {
    color: '#2563EB',
  },
  unpaidText: {
    color: '#9333EA',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  periodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  durationBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: THEME.borderRadius.md,
    padding: 8,
    marginBottom: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 11,
    fontStyle: 'italic',
    color: '#475569',
    lineHeight: 16,
  },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextPending: {
    color: '#D97706',
  },
  statusTextApproved: {
    color: '#16A34A',
  },
  statusTextRejected: {
    color: '#DC2626',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  approveBtn: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  rejectBtn: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  infoActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.xl,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
});
