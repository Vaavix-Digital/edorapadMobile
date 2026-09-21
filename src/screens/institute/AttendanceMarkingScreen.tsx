import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  User,
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Users,
  UserCheck,
  UserX,
  AlertCircle,
  CalendarDays,
  BarChart2,
  Filter,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setActiveTab,
  setSelectedDate,
  fetchStaffAttendanceInitial,
  fetchDailyWorksheet,
  fetchStaffMonthlyReport,
  markSingleStaffAttendance,
  bulkMarkStaffAttendance,
  updateAttendanceRecordField,
  toggleStaffSelection,
  selectAllStaff,
  clearStaffSelection,
} from '../../store/slices/attendanceSlice';
import { AttendanceRecord, StaffDailyWorksheetItem, StaffMonthlyItem } from '../../shared/types';
import { getISODateString } from '../../shared/utils/dateHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Preset Timings for Fast Picking ──────────────────────────────────────────
const IN_TIME_PRESETS = ['08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM'];
const OUT_TIME_PRESETS = ['04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'];
const STATUS_OPTIONS = ['Present', 'Absent', 'Leave'] as const;

export const AttendanceMarkingScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const {
    attendanceRecords,
    selectedStaffIds,
    dailyWorksheet,
    stats,
    monthlyReportData,
    selectedDate,
    activeTab,
    loading,
    saving,
    savingStaffId,
  } = useAppSelector((state) => state.attendance);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [timePickerState, setTimePickerState] = useState<{
    visible: boolean;
    staffId: string;
    staffName: string;
    field: 'inTime' | 'outTime';
    currentVal: string;
  }>({
    visible: false,
    staffId: '',
    staffName: '',
    field: 'inTime',
    currentVal: '',
  });

  const [statusPickerState, setStatusPickerState] = useState<{
    visible: boolean;
    staffId: string;
    staffName: string;
    currentStatus: string;
  }>({
    visible: false,
    staffId: '',
    staffName: '',
    currentStatus: 'Present',
  });

  // Custom Time Input state inside modal
  const [customTimeInput, setCustomTimeInput] = useState('');

  // ─── Fetch data on tab or date change ─────────────────────────────────────────
  const loadActiveData = useCallback(() => {
    if (!selectedDate) return;

    if (activeTab === 'mark') {
      dispatch(fetchStaffAttendanceInitial(selectedDate));
    } else if (activeTab === 'worksheet') {
      dispatch(fetchDailyWorksheet(selectedDate));
    } else if (activeTab === 'monthly') {
      const parts = selectedDate.split('-');
      const year = parts[0] || new Date().getFullYear();
      const month = parts[1] || String(new Date().getMonth() + 1).padStart(2, '0');
      dispatch(fetchStaffMonthlyReport({ month, year }));
    }
  }, [dispatch, activeTab, selectedDate]);

  useEffect(() => {
    loadActiveData();
  }, [loadActiveData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActiveData();
    setRefreshing(false);
  };

  // ─── Date Navigators ─────────────────────────────────────────────────────────
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate || getISODateString());
    current.setDate(current.getDate() + days);
    const newDateStr = getISODateString(current);
    dispatch(setSelectedDate(newDateStr));
  };

  const handleShiftMonth = (months: number) => {
    const current = new Date(selectedDate || getISODateString());
    current.setMonth(current.getMonth() + months);
    const newDateStr = getISODateString(current);
    dispatch(setSelectedDate(newDateStr));
  };

  // ─── Formatted Date Display ──────────────────────────────────────────────────
  const formattedDateTitle = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      if (isNaN(d.getTime())) return selectedDate;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const formattedMonthTitle = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      if (isNaN(d.getTime())) return selectedDate;
      return d.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // ─── Filtered Mark Attendance Records ────────────────────────────────────────
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return attendanceRecords;
    const q = searchQuery.toLowerCase();
    return attendanceRecords.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.customId?.toLowerCase().includes(q) ||
        r.role?.toLowerCase().includes(q)
    );
  }, [attendanceRecords, searchQuery]);

  // ─── Save Single Staff Attendance ────────────────────────────────────────────
  const handleSaveSingle = async (record: AttendanceRecord) => {
    const staffId = record.staffId || record.id || '';
    if (!staffId) return;

    try {
      const res = await dispatch(
        markSingleStaffAttendance({
          staffId,
          date: selectedDate,
          status: record.status || 'Present',
          inTime: record.inTime || '09:00 AM',
          outTime: record.outTime || '05:00 PM',
          remarks: record.remarks || 'Updated via mobile',
        })
      );

      if (markSingleStaffAttendance.fulfilled.match(res)) {
        Alert.alert('Saved', `Attendance saved for ${record.name}`);
      } else {
        Alert.alert('Error', (res.payload as string) || 'Failed to save attendance.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    }
  };

  // ─── Bulk Mark Staff Attendance ──────────────────────────────────────────────
  const handleBulkMarkPresent = async () => {
    const idsToMark =
      selectedStaffIds.length > 0
        ? selectedStaffIds
        : attendanceRecords.filter((r) => !r.isSaved).map((r) => r.staffId || r.id || '');

    const validIds = idsToMark.filter(Boolean);

    if (validIds.length === 0) {
      Alert.alert('All Saved', 'All staff members are already marked for this date.');
      return;
    }

    const recordsToMark = attendanceRecords
      .filter((r) => validIds.includes(r.staffId || r.id || ''))
      .map((r) => ({
        staffId: r.staffId || r.id || '',
        status: 'Present',
        inTime: r.inTime || '09:00 AM',
        outTime: r.outTime || '06:00 PM',
        remarks: 'Bulk marked via mobile',
      }));

    Alert.alert(
      'Bulk Mark Present',
      `Mark ${recordsToMark.length} staff member${recordsToMark.length > 1 ? 's' : ''} as Present?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const res = await dispatch(
              bulkMarkStaffAttendance({
                date: selectedDate,
                records: recordsToMark,
              })
            );
            if (bulkMarkStaffAttendance.fulfilled.match(res)) {
              Alert.alert('Success', `Bulk marked ${recordsToMark.length} staff as Present.`);
            } else {
              Alert.alert('Error', (res.payload as string) || 'Bulk marking failed.');
            }
          },
        },
      ]
    );
  };

  // ─── Open Time Picker Modal ──────────────────────────────────────────────────
  const openTimePicker = (
    staffId: string,
    staffName: string,
    field: 'inTime' | 'outTime',
    currentVal: string | null | undefined
  ) => {
    setTimePickerState({
      visible: true,
      staffId,
      staffName,
      field,
      currentVal: currentVal || (field === 'inTime' ? '09:00 AM' : '05:00 PM'),
    });
    setCustomTimeInput(currentVal || '');
  };

  const applySelectedTime = (timeStr: string) => {
    if (timePickerState.staffId) {
      dispatch(
        updateAttendanceRecordField({
          staffId: timePickerState.staffId,
          field: timePickerState.field,
          value: timeStr,
        })
      );
    }
    setTimePickerState((prev) => ({ ...prev, visible: false }));
  };

  // ─── Open Status Picker Modal ────────────────────────────────────────────────
  const openStatusPicker = (staffId: string, staffName: string, currentStatus: string) => {
    setStatusPickerState({
      visible: true,
      staffId,
      staffName,
      currentStatus,
    });
  };

  const applySelectedStatus = (status: string) => {
    if (statusPickerState.staffId) {
      dispatch(
        updateAttendanceRecordField({
          staffId: statusPickerState.staffId,
          field: 'status',
          value: status,
        })
      );
    }
    setStatusPickerState((prev) => ({ ...prev, visible: false }));
  };

  // ─── Render Mark Attendance Staff Card ───────────────────────────────────────
  const renderMarkStaffCard = ({ item }: { item: AttendanceRecord }) => {
    const staffId = item.staffId || item.id || '';
    const isSelected = selectedStaffIds.includes(staffId);
    const isRowSaving = savingStaffId === staffId;

    const getStatusTheme = (status: string) => {
      switch (status) {
        case 'Present':
          return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
        case 'Absent':
          return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
        case 'Leave':
          return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' };
        default:
          return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
      }
    };

    const statusTheme = getStatusTheme(item.status);

    return (
      <View style={[styles.staffCard, item.isSaved && styles.staffCardSaved]}>
        {/* Card Header Row: Checkbox, Name, Custom ID, Role */}
        <View style={styles.cardHeaderRow}>
          <TouchableOpacity
            style={styles.checkTouchArea}
            onPress={() => dispatch(toggleStaffSelection(staffId))}
            activeOpacity={0.7}
          >
            {item.isSaved ? (
              <CheckCircle2 size={22} color="#22C55E" />
            ) : isSelected ? (
              <CheckCircle2 size={22} color={THEME.colors.primary} />
            ) : (
              <Circle size={22} color="#CBD5E1" />
            )}
          </TouchableOpacity>

          <View style={styles.staffHeaderInfo}>
            <View style={styles.nameAndSaveRow}>
              <Text style={[styles.staffNameText, item.isSaved && styles.staffNameSaved]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.isSaved && (
                <View style={styles.savedBadge}>
                  <Check size={12} color="#16A34A" />
                  <Text style={styles.savedBadgeText}>Saved</Text>
                </View>
              )}
            </View>

            <View style={styles.idRoleRow}>
              <View style={styles.idPill}>
                <Text style={styles.idText}>{item.customId || 'STF-001'}</Text>
              </View>
              <Text style={styles.roleText} numberOfLines={1}>
                {item.role || 'Staff'}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Controls Grid: In Time, Out Time, Status, Save */}
        <View style={styles.controlsContainer}>
          <View style={styles.timeInputsRow}>
            {/* In Time Trigger */}
            <View style={styles.controlBox}>
              <Text style={styles.controlLabel}>IN TIME</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => openTimePicker(staffId, item.name, 'inTime', item.inTime)}
                activeOpacity={0.7}
              >
                <Clock size={14} color="#64748B" />
                <Text style={styles.timeButtonText}>{item.inTime || '-- : --'}</Text>
              </TouchableOpacity>
            </View>

            {/* Out Time Trigger */}
            <View style={styles.controlBox}>
              <Text style={styles.controlLabel}>OUT TIME</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => openTimePicker(staffId, item.name, 'outTime', item.outTime)}
                activeOpacity={0.7}
              >
                <Clock size={14} color="#64748B" />
                <Text style={styles.timeButtonText}>{item.outTime || '-- : --'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Status & Save Action Row */}
          <View style={styles.statusAndSaveRow}>
            {/* Status Dropdown Trigger */}
            <TouchableOpacity
              style={[
                styles.statusDropdownBtn,
                { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
              ]}
              onPress={() => openStatusPicker(staffId, item.name, item.status)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusDropdownText, { color: statusTheme.text }]}>
                {item.status || 'Present'}
              </Text>
              <ChevronDown size={14} color={statusTheme.text} />
            </TouchableOpacity>

            {/* Save Row Button */}
            <TouchableOpacity
              style={[styles.saveRowBtn, isRowSaving && styles.saveRowBtnDisabled]}
              onPress={() => handleSaveSingle(item)}
              disabled={isRowSaving}
              activeOpacity={0.8}
            >
              {isRowSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Save size={14} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.saveRowBtnText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ─── Render Daily Worksheet Staff Card ───────────────────────────────────────
  const renderWorksheetCard = ({ item }: { item: StaffDailyWorksheetItem }) => {
    const att = item.attendance;
    const status = att ? att.status || 'Present' : item.suggestedStatus || 'Absent';

    const getBadgeStyle = (st: string) => {
      switch (st) {
        case 'Present':
          return { bg: '#DCFCE7', text: '#15803D' };
        case 'Absent':
          return { bg: '#FEE2E2', text: '#B91C1C' };
        case 'Leave':
          return { bg: '#FEF3C7', text: '#B45309' };
        default:
          return { bg: '#F1F5F9', text: '#475569' };
      }
    };

    const badge = getBadgeStyle(status);

    return (
      <View style={styles.worksheetCard}>
        <View style={styles.worksheetTopRow}>
          <View style={styles.worksheetStaffInfo}>
            <Text style={styles.worksheetName}>{item.name}</Text>
            <Text style={styles.worksheetSub}>
              {item.staffCustomId || 'STF-001'} • {item.role || 'Staff'}
            </Text>
          </View>
          <View style={[styles.statusBadgePill, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{status}</Text>
          </View>
        </View>

        <View style={styles.worksheetMetricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>IN</Text>
            <Text style={styles.metricVal}>{att?.inTime || '-'}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>OUT</Text>
            <Text style={styles.metricVal}>{att?.outTime || '-'}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>HOURS</Text>
            <Text style={styles.metricVal}>{item.workHours || '-'}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ─── Render Monthly Report Staff Card ────────────────────────────────────────
  const renderMonthlyStaffCard = ({ item }: { item: StaffMonthlyItem }) => {
    const daysInMonth = monthlyReportData?.daysInMonth || 30;
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getDayCharColor = (char: string) => {
      switch (char) {
        case 'P':
          return { bg: '#DCFCE7', text: '#16A34A' };
        case 'A':
          return { bg: '#FEE2E2', text: '#EF4444' };
        case 'L':
          return { bg: '#FEF3C7', text: '#D97706' };
        default:
          return { bg: '#F8FAFC', text: '#94A3B8' };
      }
    };

    return (
      <View style={styles.monthlyCard}>
        {/* Staff info and Summary Badges */}
        <View style={styles.monthlyCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.monthlyStaffName}>{item.name}</Text>
            <Text style={styles.monthlyStaffId}>{item.staffCustomId || 'STF-001'}</Text>
          </View>

          <View style={styles.monthlySummaryPillsRow}>
            <View style={[styles.summaryPill, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.summaryPillText, { color: '#15803D' }]}>
                P: {item.summary?.present || 0}
              </Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.summaryPillText, { color: '#B91C1C' }]}>
                A: {item.summary?.absent || 0}
              </Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.summaryPillText, { color: '#2563EB' }]}>
                {item.summary?.percentage || '0%'}
              </Text>
            </View>
          </View>
        </View>

        {/* Scrollable Days Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthlyDaysScroll}
        >
          {daysArray.map((dayNum) => {
            const status = item.days?.[dayNum] || '-';
            const theme = getDayCharColor(status);
            return (
              <View key={dayNum} style={styles.dayCellContainer}>
                <Text style={styles.dayNumberLabel}>{dayNum}</Text>
                <View style={[styles.dayStatusCircle, { backgroundColor: theme.bg }]}>
                  <Text style={[styles.dayStatusChar, { color: theme.text }]}>{status}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Top Header */}
      <Header
        title="Staff Attendance"
        subtitle="Manage daily logs, mark presence, & inspect monthly reports"
        showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
        onBack={() => navigation?.goBack?.()}
        rightAction={
          <TouchableOpacity onPress={loadActiveData} style={styles.headerActionBtn}>
            <RefreshCw size={18} color="#1E293B" />
          </TouchableOpacity>
        }
      />

      {/* ─── 3 Tabs Navigation Bar ─── */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'mark', label: 'Mark Attendance' },
          { key: 'worksheet', label: 'Daily Worksheet' },
          { key: 'monthly', label: 'Monthly Report' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => dispatch(setActiveTab(tab.key as any))}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.tabActiveIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── Date Selector & Action Bar ─── */}
      <View style={styles.dateBar}>
        {activeTab === 'monthly' ? (
          // Month Selector
          <View style={styles.dateSelectorRow}>
            <TouchableOpacity
              onPress={() => handleShiftMonth(-1)}
              style={styles.arrowStepBtn}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color="#334155" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDatePickerModal(true)}
              style={styles.dateDisplayBtn}
              activeOpacity={0.8}
            >
              <Calendar size={16} color={THEME.colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.dateDisplayText}>{formattedMonthTitle}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleShiftMonth(1)}
              style={styles.arrowStepBtn}
              activeOpacity={0.7}
            >
              <ChevronRight size={18} color="#334155" />
            </TouchableOpacity>
          </View>
        ) : (
          // Daily Date Selector
          <View style={styles.dateSelectorRow}>
            <TouchableOpacity
              onPress={() => handleShiftDate(-1)}
              style={styles.arrowStepBtn}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color="#334155" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowDatePickerModal(true)}
              style={styles.dateDisplayBtn}
              activeOpacity={0.8}
            >
              <Calendar size={16} color={THEME.colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.dateDisplayText}>Date: {formattedDateTitle}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleShiftDate(1)}
              style={styles.arrowStepBtn}
              activeOpacity={0.7}
            >
              <ChevronRight size={18} color="#334155" />
            </TouchableOpacity>
          </View>
        )}

        {/* Load / Sync Button */}
        <TouchableOpacity
          onPress={loadActiveData}
          style={styles.loadDataBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.loadDataBtnText}>Load</Text>
        </TouchableOpacity>
      </View>

      {/* ─── TAB 1: MARK ATTENDANCE ─── */}
      {activeTab === 'mark' && (
        <View style={{ flex: 1 }}>
          {/* Quick Select-All & Search Toolbar */}
          <View style={styles.markToolbar}>
            <TouchableOpacity
              style={styles.selectAllBtn}
              onPress={() => {
                if (selectedStaffIds.length === attendanceRecords.length && attendanceRecords.length > 0) {
                  dispatch(clearStaffSelection());
                } else {
                  dispatch(selectAllStaff());
                }
              }}
              activeOpacity={0.7}
            >
              {selectedStaffIds.length > 0 && selectedStaffIds.length === attendanceRecords.length ? (
                <CheckCircle2 size={18} color={THEME.colors.primary} style={{ marginRight: 6 }} />
              ) : (
                <Circle size={18} color="#94A3B8" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.selectAllText}>
                {selectedStaffIds.length > 0
                  ? `Selected (${selectedStaffIds.length})`
                  : `Select All (${attendanceRecords.length})`}
              </Text>
            </TouchableOpacity>

            <View style={styles.searchMiniWrap}>
              <TextInput
                style={styles.searchMiniInput}
                placeholder="Search staff..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* List Content */}
          {loading && !refreshing ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>Syncing Staff Attendance...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecords}
              keyExtractor={(item) => item.staffId || item.id || Math.random().toString()}
              renderItem={renderMarkStaffCard}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <AlertCircle size={36} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Staff Records Found</Text>
                  <Text style={styles.emptySub}>
                    No staff records are available for this date. Check your connection or tap Load.
                  </Text>
                </View>
              }
            />
          )}

          {/* Bottom Floating Mark All Present Action */}
          <View style={styles.stickyBottomBar}>
            <TouchableOpacity
              style={[styles.bulkMarkBtn, saving && styles.bulkMarkBtnDisabled]}
              onPress={handleBulkMarkPresent}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <UserCheck size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.bulkMarkBtnText}>Mark All Present</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── TAB 2: DAILY WORKSHEET ─── */}
      {activeTab === 'worksheet' && (
        <View style={{ flex: 1 }}>
          {/* Summary Stats Grid (Total, Present, Absent, Leave) */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOTAL</Text>
              <Text style={styles.statVal}>{stats.total || dailyWorksheet.length || 0}</Text>
            </View>
            <View style={[styles.statBox, { borderColor: '#86EFAC' }]}>
              <Text style={[styles.statLabel, { color: '#16A34A' }]}>PRESENT</Text>
              <Text style={[styles.statVal, { color: '#16A34A' }]}>{stats.present || 0}</Text>
            </View>
            <View style={[styles.statBox, { borderColor: '#FCA5A5' }]}>
              <Text style={[styles.statLabel, { color: '#EF4444' }]}>ABSENT</Text>
              <Text style={[styles.statVal, { color: '#EF4444' }]}>{stats.absent || 0}</Text>
            </View>
            <View style={[styles.statBox, { borderColor: '#FCD34D' }]}>
              <Text style={[styles.statLabel, { color: '#D97706' }]}>LEAVE</Text>
              <Text style={[styles.statVal, { color: '#D97706' }]}>{stats.leave || 0}</Text>
            </View>
          </View>

          {/* Worksheet List */}
          {loading && !refreshing ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>Loading Daily Worksheet...</Text>
            </View>
          ) : (
            <FlatList
              data={dailyWorksheet}
              keyExtractor={(item) => item.id || Math.random().toString()}
              renderItem={renderWorksheetCard}
              contentContainerStyle={styles.listContainerNoBottomBar}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <AlertCircle size={36} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Worksheet Entries</Text>
                  <Text style={styles.emptySub}>
                    No worksheet entries recorded for this date.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* ─── TAB 3: MONTHLY REPORT ─── */}
      {activeTab === 'monthly' && (
        <View style={{ flex: 1 }}>
          {/* Monthly Staff List */}
          {loading && !refreshing ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>Generating Monthly Report...</Text>
            </View>
          ) : (
            <FlatList
              data={monthlyReportData?.data || []}
              keyExtractor={(item) => item.id || Math.random().toString()}
              renderItem={renderMonthlyStaffCard}
              contentContainerStyle={styles.listContainerNoBottomBar}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <BarChart2 size={36} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Monthly Data</Text>
                  <Text style={styles.emptySub}>
                    No monthly records available for {formattedMonthTitle}.
                  </Text>
                </View>
              }
              ListFooterComponent={
                monthlyReportData?.data && monthlyReportData.data.length > 0 ? (
                  <View style={styles.legendContainer}>
                    <Text style={styles.legendHeader}>LEGEND</Text>
                    <View style={styles.legendRow}>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                        <Text style={styles.legendText}>P = Present</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.legendText}>A = Absent</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
                        <Text style={styles.legendText}>L = Leave</Text>
                      </View>
                    </View>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ─── MODALS ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}

      {/* 1. Time Picker Modal */}
      <Modal
        visible={timePickerState.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimePickerState((prev) => ({ ...prev, visible: false }))}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.card}>
            <View style={modalStyles.header}>
              <View>
                <Text style={modalStyles.title}>
                  Select {timePickerState.field === 'inTime' ? 'In Time' : 'Out Time'}
                </Text>
                <Text style={modalStyles.subTitle}>{timePickerState.staffName}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setTimePickerState((prev) => ({ ...prev, visible: false }))}
                style={modalStyles.closeBtn}
              >
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <Text style={modalStyles.sectionTitle}>QUICK PRESETS</Text>
            <View style={modalStyles.presetsWrap}>
              {(timePickerState.field === 'inTime' ? IN_TIME_PRESETS : OUT_TIME_PRESETS).map(
                (preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      modalStyles.presetChip,
                      timePickerState.currentVal === preset && modalStyles.presetChipActive,
                    ]}
                    onPress={() => applySelectedTime(preset)}
                  >
                    <Clock
                      size={13}
                      color={timePickerState.currentVal === preset ? '#FFF' : '#475569'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        modalStyles.presetChipText,
                        timePickerState.currentVal === preset && modalStyles.presetChipTextActive,
                      ]}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* Manual Custom Time Input */}
            <Text style={[modalStyles.sectionTitle, { marginTop: 16 }]}>OR ENTER TIME</Text>
            <View style={modalStyles.customInputRow}>
              <TextInput
                style={modalStyles.customTextInput}
                placeholder="e.g. 09:15 AM"
                placeholderTextColor="#94A3B8"
                value={customTimeInput}
                onChangeText={setCustomTimeInput}
              />
              <TouchableOpacity
                style={modalStyles.applyCustomBtn}
                onPress={() => {
                  if (customTimeInput.trim()) {
                    applySelectedTime(customTimeInput.trim());
                  }
                }}
              >
                <Text style={modalStyles.applyCustomBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Status Picker Modal */}
      <Modal
        visible={statusPickerState.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusPickerState((prev) => ({ ...prev, visible: false }))}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.card}>
            <View style={modalStyles.header}>
              <View>
                <Text style={modalStyles.title}>Select Attendance Status</Text>
                <Text style={modalStyles.subTitle}>{statusPickerState.staffName}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setStatusPickerState((prev) => ({ ...prev, visible: false }))}
                style={modalStyles.closeBtn}
              >
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.statusOptionsList}>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = statusPickerState.currentStatus === opt;
                const getOptColor = (s: string) => {
                  if (s === 'Present') return { color: '#16A34A', bg: '#DCFCE7' };
                  if (s === 'Absent') return { color: '#EF4444', bg: '#FEE2E2' };
                  return { color: '#D97706', bg: '#FEF3C7' };
                };
                const theme = getOptColor(opt);

                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      modalStyles.statusOptionItem,
                      isSelected && { borderColor: theme.color, backgroundColor: theme.bg },
                    ]}
                    onPress={() => applySelectedStatus(opt)}
                    activeOpacity={0.7}
                  >
                    <View style={modalStyles.statusOptLeft}>
                      <View
                        style={[
                          modalStyles.statusIndicatorDot,
                          { backgroundColor: theme.color },
                        ]}
                      />
                      <Text
                        style={[
                          modalStyles.statusOptionText,
                          isSelected && { color: theme.color, fontWeight: '800' },
                        ]}
                      >
                        {opt}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={theme.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Date Picker Modal */}
      <Modal
        visible={showDatePickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.card}>
            <View style={modalStyles.header}>
              <View>
                <Text style={modalStyles.title}>Select Date</Text>
                <Text style={modalStyles.subTitle}>Jump to specific day or month</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDatePickerModal(false)}
                style={modalStyles.closeBtn}
              >
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.quickDatePresetsRow}>
              <TouchableOpacity
                style={modalStyles.quickDateBtn}
                onPress={() => {
                  dispatch(setSelectedDate(getISODateString(new Date())));
                  setShowDatePickerModal(false);
                }}
              >
                <Text style={modalStyles.quickDateBtnText}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={modalStyles.quickDateBtn}
                onPress={() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  dispatch(setSelectedDate(getISODateString(y)));
                  setShowDatePickerModal(false);
                }}
              >
                <Text style={modalStyles.quickDateBtnText}>Yesterday</Text>
              </TouchableOpacity>
            </View>

            {/* YYYY-MM-DD Input */}
            <Text style={[modalStyles.sectionTitle, { marginTop: 12 }]}>ENTER DATE (YYYY-MM-DD)</Text>
            <View style={modalStyles.customInputRow}>
              <TextInput
                style={modalStyles.customTextInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                defaultValue={selectedDate}
                onChangeText={(val) => {
                  if (val.length === 10) {
                    dispatch(setSelectedDate(val));
                  }
                }}
              />
              <TouchableOpacity
                style={modalStyles.applyCustomBtn}
                onPress={() => setShowDatePickerModal(false)}
              >
                <Text style={modalStyles.applyCustomBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

// ─── Screen Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerActionBtn: {
    padding: 8,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    position: 'relative',
    alignItems: 'center',
  },
  tabButtonActive: {},
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabButtonTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  tabActiveIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: THEME.colors.primary,
    borderRadius: 2,
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowStepBtn: {
    padding: 6,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateDisplayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateDisplayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  loadDataBtn: {
    backgroundColor: '#3E7B74',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
    shadowColor: '#3E7B74',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  loadDataBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  markToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  searchMiniWrap: {
    width: 140,
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchMiniInput: {
    fontSize: 11,
    color: '#1E293B',
    padding: 0,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 90,
  },
  listContainerNoBottomBar: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 30,
  },
  staffCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  staffCardSaved: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkTouchArea: {
    paddingRight: 10,
  },
  staffHeaderInfo: {
    flex: 1,
  },
  nameAndSaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staffNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  staffNameSaved: {
    color: '#15803D',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  savedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  idRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  idPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  idText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  roleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  controlsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    gap: 8,
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  controlBox: {
    flex: 1,
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 5,
  },
  timeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  statusAndSaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
  },
  statusDropdownText: {
    fontSize: 12,
    fontWeight: '800',
  },
  saveRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#54A39A',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: THEME.borderRadius.md,
    shadowColor: '#54A39A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  saveRowBtnDisabled: {
    opacity: 0.6,
  },
  saveRowBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 8,
  },
  bulkMarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#666666',
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
  },
  bulkMarkBtnDisabled: {
    opacity: 0.6,
  },
  bulkMarkBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  worksheetCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  worksheetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  worksheetStaffInfo: {
    flex: 1,
  },
  worksheetName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  worksheetSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  worksheetMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.borderRadius.md,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E2E8F0',
  },
  monthlyCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthlyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthlyStaffName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  monthlyStaffId: {
    fontSize: 10,
    color: '#64748B',
  },
  monthlySummaryPillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  summaryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summaryPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  monthlyDaysScroll: {
    paddingVertical: 4,
    gap: 4,
  },
  dayCellContainer: {
    alignItems: 'center',
    width: 26,
  },
  dayNumberLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  dayStatusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayStatusChar: {
    fontSize: 10,
    fontWeight: '900',
  },
  legendContainer: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legendHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 30,
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
  },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 18,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  subTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94A3B8',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  presetChipTextActive: {
    color: '#FFF',
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  customTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
  },
  applyCustomBtn: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THEME.borderRadius.md,
  },
  applyCustomBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  statusOptionsList: {
    gap: 8,
  },
  statusOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  statusOptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  quickDatePresetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quickDateBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickDateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
});
