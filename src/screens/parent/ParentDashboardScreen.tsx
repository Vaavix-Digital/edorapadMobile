import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle } from 'react-native-svg';
import { Play, Calendar, Clock, AlertCircle } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { StudentSelector } from '../../components/parent/StudentSelector';
import { ParentDrawerMenu } from '../../components/navigation/ParentDrawerMenu';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchParentFullDashboard, DEFAULT_PARENT_STUDENTS } from '../../store/slices/parentSlice';
import { formatDate } from '../../shared/utils/dateHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Attendance Donut Chart ──────────────────────────────
const AttendanceDonut = ({ percentage = 0 }: { percentage: number }) => {
  const validPct = Math.min(Math.max(Number(percentage) || 0, 0), 100);
  const size = 130;
  const strokeWidth = 14;
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
    width: 130,
    height: 130,
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
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
});

// ─── Stat Card Component ──────────────────────────────────
const DashboardStatCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
}) => {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statCardTitle}>{title}</Text>
      <View style={styles.statCardBottom}>
        <Text style={styles.statCardValue}>{value ?? '—'}</Text>
        {subtitle ? <Text style={styles.statCardSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

export const ParentDashboardScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    loading,
    error,
    dashboard,
    attendance,
    attendancePercentage,
    notifications,
    pendingExams,
    children,
    selectedStudentId,
    parentName,
  } = useAppSelector((state) => state.parent);

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchParentFullDashboard());
  }, [dispatch]);

  // Derive selected student data from dashboard
  const students =
    Array.isArray(dashboard) && dashboard.length > 0
      ? dashboard
      : DEFAULT_PARENT_STUDENTS;

  const activeStudentId =
    selectedStudentId ||
    students[0]?.studentInfo?.id ||
    students[0]?.studentInfo?._id ||
    students[0]?.id ||
    students[0]?._id ||
    children[0]?.id ||
    children[0]?._id ||
    'stu-shrihari-1';

  const selectedStudentItem = activeStudentId
    ? students.find(
      (s) =>
        s?.studentInfo?.id === activeStudentId ||
        s?.studentInfo?._id === activeStudentId ||
        s?.studentId === activeStudentId ||
        s?.student === activeStudentId ||
        s?.id === activeStudentId ||
        s?._id === activeStudentId
    ) || students[0]
    : students[0];

  const studentInfo = selectedStudentItem?.studentInfo || selectedStudentItem || {};
  const academicPerformance = selectedStudentItem?.academicPerformance || {};

  const totalLiveClasses =
    academicPerformance?.liveClasses?.total ??
    selectedStudentItem?.totalLiveClasses ??
    (activeStudentId === 'stu-shekha-2' ? 6 : 4);

  const attendedLiveClasses =
    academicPerformance?.liveClasses?.attended ??
    selectedStudentItem?.attendedLiveClasses ??
    (activeStudentId === 'stu-shekha-2' ? 5 : 7);

  const totalExams =
    academicPerformance?.exams?.totalCount ??
    selectedStudentItem?.totalExams ??
    (activeStudentId === 'stu-shekha-2' ? 5 : 7);

  const submittedExams =
    academicPerformance?.exams?.submittedCount ??
    selectedStudentItem?.submittedExams ??
    (activeStudentId === 'stu-shekha-2' ? 5 : 6);

  const totalAssignments =
    academicPerformance?.assignments?.totalCount ??
    selectedStudentItem?.totalAssignments ??
    (activeStudentId === 'stu-shekha-2' ? 4 : 2);

  const submittedAssignments =
    academicPerformance?.assignments?.submittedCount ??
    selectedStudentItem?.submittedAssignments ??
    (activeStudentId === 'stu-shekha-2' ? 3 : 1);

  const studentDisplayName =
    studentInfo?.name ||
    selectedStudentItem?.name ||
    children.find((c: any) => c.id === activeStudentId || c._id === activeStudentId)?.name ||
    (activeStudentId === 'stu-shekha-2' ? 'Shekha Nasrudin' : 'Shrihari Nambiar p');

  const studentEmail =
    studentInfo?.email ||
    selectedStudentItem?.email ||
    children.find((c: any) => c.id === activeStudentId || c._id === activeStudentId)?.email ||
    (activeStudentId === 'stu-shekha-2' ? 'shekha.nasrudin@gmail.com' : 'shrihari1056@gmail.com');

  const studentPic =
    studentInfo?.profilePic ||
    studentInfo?.profilePicUrl ||
    selectedStudentItem?.profilePic ||
    (activeStudentId === 'stu-shrihari-1'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'
      : null);

  // Filter notifications for active child
  const filteredNotifications = activeStudentId
    ? notifications.filter(
      (n: any) =>
        n?.studentInfo?.id === activeStudentId ||
        n?.studentInfo?._id === activeStudentId ||
        n?.studentId === activeStudentId ||
        n?.student === activeStudentId ||
        !n?.studentId
    )
    : notifications;

  // Filter pending exams for active child
  const filteredPendingExams = activeStudentId
    ? pendingExams.filter(
      (exam: any) =>
        exam?.studentInfo?.id === activeStudentId ||
        exam?.studentInfo?._id === activeStudentId ||
        exam?.studentId === activeStudentId ||
        exam?.student === activeStudentId ||
        !exam?.studentId
    )
    : pendingExams;

  // Get active student attendance percentage
  let selectedAttendancePct = attendancePercentage;
  if (activeStudentId && Array.isArray(attendance) && attendance.length > 0) {
    const selectedAttendance = attendance.find(
      (item) =>
        item?.studentInfo?.id === activeStudentId ||
        item?.studentInfo?._id === activeStudentId ||
        item?.studentId === activeStudentId ||
        item?.id === activeStudentId ||
        item?._id === activeStudentId
    );
    if (selectedAttendance?.totalStats?.percentage !== undefined) {
      selectedAttendancePct = selectedAttendance.totalStats.percentage;
    }
  } else {
    selectedAttendancePct = activeStudentId === 'stu-shekha-2' ? 85 : 5;
  }

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
        {/* Header */}
        <Header
          title="Parent Dashboard"
          subtitle={`Welcome, ${parentName || user?.name || 'Parent'}`}
          showMenu
          onMenuPress={() => setDrawerOpen(true)}
          showNotifications
          onNotificationsPress={() => navigation.navigate('Notifications')}
          unreadNotificationsCount={filteredNotifications.length}
        />

        {/* Student Selector */}
        <StudentSelector />

        {/* Error Alert */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ─── 2x2 Stats Grid ─── */}
        <View style={styles.statsGrid}>
          <DashboardStatCard
            title="Total Live Classes"
            value={totalLiveClasses}
          />
          <DashboardStatCard
            title="Attended Live Classes"
            value={attendedLiveClasses}
          />
          <DashboardStatCard
            title="Exams"
            value={totalExams}
            subtitle={`${submittedExams} submitted`}
          />
          <DashboardStatCard
            title="Assignments"
            value={totalAssignments}
            subtitle={`${submittedAssignments} submitted`}
          />
        </View>

        {/* ─── Student Profile Card ─── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            {studentPic ? (
              <Image source={{ uri: studentPic }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>
                {studentDisplayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.profileName}>{studentDisplayName}</Text>
          <Text style={styles.profileEmail}>Email: {studentEmail}</Text>
        </View>

        {/* ─── Attendance Card ─── */}
        <View style={styles.attendanceCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Attendance</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Attendance')}>
              <Text style={styles.viewMoreText}>View Details →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.donutContainer}>
            <AttendanceDonut percentage={selectedAttendancePct} />
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#54A39A' }]} />
                <Text style={styles.legendLabel}>Attended</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#B7BEBC' }]} />
                <Text style={styles.legendLabel}>Leave</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Notifications Section ─── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Notifications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <Text style={styles.viewMoreText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.innerWhiteCard}>
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No notifications found.</Text>
              </View>
            ) : (
              filteredNotifications.slice(0, 4).map((notif: any, idx: number) => (
                <View key={notif._id || notif.id || idx} style={styles.notifRow}>
                  <View style={styles.notifTop}>
                    <Text style={styles.notifMatter}>{notif.matter || notif.title || 'Notice'}</Text>
                    <Text style={styles.notifDate}>
                      {notif.createdAt ? formatDate(notif.createdAt) : notif.time || '—'}
                    </Text>
                  </View>
                  <Text style={styles.notifDetails}>{notif.details || notif.message || '—'}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* ─── Pending Exams Section ─── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Pending Exams</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ExamResults')}>
              <Text style={styles.viewMoreText}>View Results</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.innerWhiteCard}>
            {filteredPendingExams.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No pending exams found.</Text>
              </View>
            ) : (
              filteredPendingExams.slice(0, 4).map((exam: any, idx: number) => (
                <View key={exam._id || exam.id || idx} style={styles.examRow}>
                  <View style={styles.examMain}>
                    <Text style={styles.examName}>{exam.examName || exam.title || 'Exam'}</Text>
                    <Text style={styles.examCourse}>
                      Course: {exam.course || exam.courseName || 'Academic Course'}
                    </Text>
                  </View>
                  <View style={styles.examMeta}>
                    <Text style={styles.examMarks}>
                      Marks: {exam.passMarks ?? '—'} / {exam.totalMarks ?? '—'}
                    </Text>
                    {exam.dueDate ? (
                      <Text style={styles.examDue}>Due: {formatDate(exam.dueDate)}</Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Side Drawer Menu */}
      {drawerOpen && (
        <ParentDrawerMenu
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          navigation={navigation}
          activeScreen="ParentDashboard"
        />
      )}
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
    paddingBottom: THEME.spacing.xl + 24,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    marginBottom: THEME.spacing.md,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },

  // ─── 2x2 Stats Grid ───
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: THEME.spacing.md,
  },
  statCard: {
    width: (SCREEN_WIDTH - THEME.spacing.md * 2 - 10) / 2,
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#C2D1CD',
    padding: 14,
    minHeight: 90,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  statCardBottom: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A5247',
    lineHeight: 36,
  },
  statCardSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#295651',
    marginLeft: 4,
  },

  // ─── Student Profile Card ───
  profileCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#C2D1CD',
    padding: 18,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#54A39A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFF',
    marginBottom: 10,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFF',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    marginTop: 3,
  },

  // ─── Attendance Card ───
  attendanceCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#C2D1CD',
    padding: 16,
    marginBottom: THEME.spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A5247',
  },
  donutContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },

  // ─── Section Container & Inner White Cards ───
  sectionContainer: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#C2D1CD',
    padding: 14,
    marginBottom: THEME.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  innerWhiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // ─── Notification Rows ───
  notifRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  notifMatter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  notifDate: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  notifDetails: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },

  // ─── Exam Rows ───
  examRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  examMain: {
    flex: 1,
    marginRight: 10,
  },
  examName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  examCourse: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  examMeta: {
    alignItems: 'flex-end',
  },
  examMarks: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A5247',
  },
  examDue: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
});
