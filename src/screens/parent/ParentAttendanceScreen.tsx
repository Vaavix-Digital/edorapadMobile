import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle } from 'react-native-svg';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { StudentSelector } from '../../components/parent/StudentSelector';
import { StatusBadge } from '../../components/common/StatusBadge';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchParentFullDashboard } from '../../store/slices/parentSlice';
import { formatDate } from '../../shared/utils/dateHelpers';

// ─── Attendance Donut ──────────────────────────────────
const AttendanceDonut = ({ percentage = 0 }: { percentage: number }) => {
  const validPct = Math.min(Math.max(Number(percentage) || 0, 0), 100);
  const size = 100;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * validPct) / 100;

  return (
    <View style={donutStyles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#B7BEBC"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#54A39A"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          originX={size / 2}
          originY={size / 2}
          rotation="-90"
        />
      </Svg>
      <View style={donutStyles.centerLabel}>
        <Text style={donutStyles.percentageText}>{validPct}%</Text>
      </View>
    </View>
  );
};

const donutStyles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  percentageText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
});

export const ParentAttendanceScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { attendance, selectedStudentId, loading } = useAppSelector((state) => state.parent);
  const [filter, setFilter] = useState<'All' | 'Present' | 'Absent' | 'Late'>('All');

  useEffect(() => {
    dispatch(fetchParentFullDashboard());
  }, [dispatch]);

  // Find attendance object for selected student
  const activeAttendance = useMemo(() => {
    if (!selectedStudentId || !Array.isArray(attendance)) return attendance?.[0] || {};
    return (
      attendance.find(
        (item) =>
          item?.studentInfo?.id === selectedStudentId ||
          item?.studentInfo?._id === selectedStudentId ||
          item?.studentId === selectedStudentId
      ) || attendance[0] || {}
    );
  }, [attendance, selectedStudentId]);

  const rawRecords = activeAttendance?.records || [
    { date: '2026-09-08', status: 'Present', subject: 'Calculus & Physics', remarks: 'On time' },
    { date: '2026-09-07', status: 'Present', subject: 'Computer Networks', remarks: 'On time' },
    { date: '2026-09-05', status: 'Late', subject: 'Digital Electronics', remarks: '10 mins late' },
    { date: '2026-09-04', status: 'Present', subject: 'Database Management', remarks: 'On time' },
    { date: '2026-09-03', status: 'Absent', subject: 'Operating Systems', remarks: 'Sick leave approved' },
    { date: '2026-09-02', status: 'Present', subject: 'Software Engineering', remarks: 'On time' },
  ];

  const filteredRecords = rawRecords.filter((r: any) => {
    if (filter === 'All') return true;
    return (r.status || '').toLowerCase() === filter.toLowerCase();
  });

  const presentCount = rawRecords.filter((r: any) => (r.status || '').toLowerCase() === 'present').length;
  const absentCount = rawRecords.filter((r: any) => (r.status || '').toLowerCase() === 'absent').length;
  const lateCount = rawRecords.filter((r: any) => (r.status || '').toLowerCase() === 'late').length;
  const totalStatsPct = activeAttendance?.totalStats?.percentage ?? (rawRecords.length > 0 ? Math.round((presentCount / rawRecords.length) * 100) : 94);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchParentFullDashboard())}
            tintColor={THEME.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Attendance Record"
          subtitle="Child's attendance analytics & daily logs"
          showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
          onBack={() => navigation?.goBack?.()}
        />

        {/* Student Selector */}
        <StudentSelector />

        {/* ─── Overview Card with Donut & Stats ─── */}
        <View style={styles.overviewCard}>
          <View style={styles.donutRow}>
            <AttendanceDonut percentage={totalStatsPct} />
            <View style={styles.kpiGrid}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>PRESENT</Text>
                <Text style={[styles.kpiValue, { color: THEME.colors.success }]}>{presentCount}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>ABSENT</Text>
                <Text style={[styles.kpiValue, { color: THEME.colors.error }]}>{absentCount}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>LATE</Text>
                <Text style={[styles.kpiValue, { color: THEME.colors.warning }]}>{lateCount}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>RATIO</Text>
                <Text style={[styles.kpiValue, { color: '#1A5247' }]}>{totalStatsPct}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Filter Tabs ─── */}
        <View style={styles.filterRow}>
          {(['All', 'Present', 'Absent', 'Late'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Daily Logs List ─── */}
        <View style={styles.logsContainer}>
          <View style={styles.logsHeaderBar}>
            <Text style={styles.logsHeaderTitle}>Attendance History</Text>
          </View>

          {filteredRecords.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar size={32} color="#94A3B8" style={{ marginBottom: 6 }} />
              <Text style={styles.emptyText}>No attendance records found matching "{filter}".</Text>
            </View>
          ) : (
            filteredRecords.map((item: any, index: number) => (
              <View key={item.date + index} style={styles.recordCard}>
                <View style={styles.recordLeft}>
                  <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
                  <Text style={styles.subjectText}>{item.subject || 'All Scheduled Classes'}</Text>
                </View>
                <View style={styles.recordRight}>
                  <StatusBadge status={item.status} size="sm" />
                  {item.remarks ? <Text style={styles.remarks}>{item.remarks}</Text> : null}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  overviewCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C2D1CD',
    marginBottom: THEME.spacing.md,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  kpiGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiBox: {
    width: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#54A39A',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logsContainer: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#C2D1CD',
    padding: 12,
  },
  logsHeaderBar: {
    backgroundColor: '#54A39A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 10,
  },
  logsHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordLeft: {
    flex: 1,
    marginRight: 8,
  },
  recordDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  subjectText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  remarks: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 3,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
