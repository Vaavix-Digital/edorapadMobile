import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  BookOpen,
  Users,
  Video,
  Award,
  ChevronRight,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { TutorDrawerMenu } from '../../components/navigation/TutorDrawerMenu';
import { AttendanceCalendarModal } from '../../components/tutor/AttendanceCalendarModal';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchTutorDashboardData,
  updateTaskStatus,
} from '../../store/slices/tutorSlice';
import { normalizeUserRole } from '../../store/slices/authSlice';
import { USER_ROLES } from '../../shared/types';
import { formatDate } from '../../shared/utils/dateHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const TutorDashboardScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user, role } = useAppSelector((state) => state.auth);
  const {
    stats,
    tasks,
    attendance,
    batchAttendance,
    upcomingActivities,
    loading,
  } = useAppSelector((state) => state.tutor);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const normalizedRole = normalizeUserRole(role || user?.role || '');
  const isOnlineTutor = normalizedRole === USER_ROLES.ONLINETUTOR;

  useEffect(() => {
    dispatch(fetchTutorDashboardData());
  }, [dispatch]);

  const handleToggleTask = (taskId: string, currentStatus: boolean) => {
    dispatch(updateTaskStatus({ taskId, isCompleted: !currentStatus }));
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchTutorDashboardData())}
            tintColor="#3E7B74"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with hamburger menu icon */}
        <Header
          title="Tutor Dashboard"
          subtitle={
            user?.name
              ? `${user.name} • ${isOnlineTutor ? 'Online Educator' : 'Faculty Member'}`
              : isOnlineTutor
              ? 'Online Educator'
              : 'Faculty Member'
          }
          showMenu
          onMenuPress={() => setDrawerOpen(true)}
          showNotifications
          onNotificationsPress={() => navigation.navigate('Notifications')}
        />

        {/* ─── Top Metrics Section ─────────────────────────────── */}
        {isOnlineTutor ? (
          // 4 KPI Cards for Online Tutor matching web
          <View style={styles.metricsGrid2x2}>
            {/* Total Batches */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricCardTitle}>Total Batches</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('TutorBatches')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.viewListText}>View List</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.metricNumber}>{stats?.totalBatches ?? 0}</Text>
            </View>

            {/* Active Students */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricCardTitle}>Active Students</Text>
              </View>
              <Text style={styles.metricNumber}>{stats?.activeStudents ?? 0}</Text>
            </View>

            {/* Upcoming Classes */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricCardTitle}>Upcoming Classes</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('LiveClasses')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.viewListText}>View List</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.metricNumber}>
                {stats?.upcomingLiveClasses ?? 0}
              </Text>
            </View>

            {/* Certificates */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricCardTitle}>Certificates</Text>
              </View>
              <Text style={styles.metricNumber}>
                {stats?.certificatesIssued ?? 0}
              </Text>
            </View>
          </View>
        ) : (
          // Full-width cards for Offline Tutor matching web
          <View style={styles.offlineMetricsStack}>
            {/* Total Batches Teaching */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricCardTitle}>Total Batches Teaching</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('TutorBatches')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.viewListText}>View List</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.metricNumberLarge}>
                {stats?.totalBatches ?? 0}
              </Text>
            </View>

            {/* Active Students */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricCardTitle}>Active Students</Text>
              </View>
              <Text style={styles.metricNumberLarge}>
                {stats?.activeStudents ?? 0}
              </Text>
            </View>
          </View>
        )}

        {/* ─── Daily Tasks Card ─────────────────────────────── */}
        <View style={styles.webCard}>
          <Text style={styles.cardHeaderTitle}>Daily Tasks</Text>
          <View style={styles.tasksContainer}>
            {tasks && tasks.length > 0 ? (
              tasks.slice(0, 5).map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskItem}
                  onPress={() => handleToggleTask(task.id, task.isCompleted)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskCheckbox}>
                    {task.isCompleted ? (
                      <CheckCircle2 size={20} color="#3E7B74" />
                    ) : (
                      <Circle size={20} color="#94A3B8" />
                    )}
                  </View>
                  <View style={styles.taskTextCol}>
                    <Text
                      style={[
                        styles.taskContent,
                        task.isCompleted && styles.taskCompleted,
                      ]}
                      numberOfLines={2}
                    >
                      {task.content}
                    </Text>
                    {task.batch?.name && (
                      <Text style={styles.taskBatchTag}>
                        Batch: {task.batch.name}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyTasksBox}>
                <Text style={styles.emptyTasksText}>No pending tasks</Text>
              </View>
            )}
          </View>

          {/* View More button */}
          <TouchableOpacity
            style={styles.viewMoreBtn}
            onPress={() => navigation.navigate('TutorTasks')}
            activeOpacity={0.8}
          >
            <Text style={styles.viewMoreBtnText}>View More</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Student Attendance Card ──────────────────────── */}
        <View style={styles.webCard}>
          <View style={styles.cardHeaderWithBadge}>
            <Text style={styles.cardHeaderTitle}>Student Attendance</Text>
            <View style={styles.badgeDays}>
              <Text style={styles.badgeDaysText}>Last 7 Days</Text>
            </View>
          </View>

          <View style={styles.attendanceChartBox}>
            {batchAttendance && batchAttendance.length > 0 ? (
              batchAttendance.map((item, idx) => {
                const val = Math.min(Math.max(Number(item.attendanceValue) || 0, 0), 100);
                return (
                  <View key={idx} style={styles.barItemRow}>
                    <View style={styles.barMetaRow}>
                      <Text style={styles.barBatchName} numberOfLines={1}>
                        {item.batchName || `Batch ${idx + 1}`}
                      </Text>
                      <Text style={styles.barPercentText}>{val}%</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${val}%` }]} />
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyChartContainer}>
                <View style={styles.emptyChartGrid}>
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                  <View style={styles.gridLine} />
                </View>
                <Text style={styles.emptyChartText}>
                  No attendance records found for the last 7 days
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── Attendance Summary Card ──────────────────────── */}
        <View style={styles.webCard}>
          <Text style={styles.cardHeaderTitle}>Attendance</Text>
          <View style={styles.attSummaryRows}>
            <View style={styles.attRow}>
              <Text style={styles.attLabel}>Attended Days</Text>
              <Text style={styles.attValue}>{attendance?.attendedDays ?? 0}</Text>
            </View>
            <View style={styles.attDivider} />
            <View style={styles.attRow}>
              <Text style={styles.attLabel}>Leave Taken</Text>
              <Text style={styles.attValue}>{attendance?.leaveTaken ?? 0}</Text>
            </View>
            <View style={styles.attDivider} />
            <View style={styles.attRow}>
              <Text style={styles.attLabel}>Remaining</Text>
              <Text style={styles.attValue}>{attendance?.remaining ?? 0}</Text>
            </View>
          </View>

          {/* View Details button */}
          <TouchableOpacity
            style={styles.viewDetailsBtn}
            onPress={() => setIsCalendarOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewDetailsBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Upcoming Activities Section ──────────────────── */}
        <View style={styles.webCard}>
          <Text style={styles.cardHeaderTitle}>Upcoming Activities</Text>
          <View style={styles.activitiesContainer}>
            {upcomingActivities && upcomingActivities.length > 0 ? (
              <View style={styles.activitiesList}>
                {upcomingActivities.map((act, idx) => (
                  <View key={act.id || idx} style={styles.activityItem}>
                    <View style={styles.actTopRow}>
                      <Text style={styles.actName}>{act.activity}</Text>
                      <View style={styles.actStatusBadge}>
                        <Text style={styles.actStatusText}>{act.status}</Text>
                      </View>
                    </View>
                    <View style={styles.actMetaRow}>
                      <Text style={styles.actCourseText}>
                        Course: {act.course || 'General'}
                      </Text>
                      {act.batch ? (
                        <Text style={styles.actBatchText}>
                          Batch: {act.batch}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.actDateRow}>
                      <Calendar size={12} color="#64748B" />
                      <Text style={styles.actDateText}>
                        {formatDate(act.date)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyActivitiesBox}>
                <Text style={styles.emptyActivitiesText}>
                  No upcoming activities found
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Side Navigation Drawer Menu */}
      {drawerOpen && (
        <TutorDrawerMenu
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          navigation={navigation}
          activeScreen="TutorDashboard"
        />
      )}

      {/* Monthly Attendance Calendar Modal */}
      <AttendanceCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        staffId={user?.id}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FBFA',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Metrics
  metricsGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  offlineMetricsStack: {
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flex: 1,
    minWidth: (SCREEN_WIDTH - 44) / 2,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  viewListText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3E7B74',
  },
  metricNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E3A34',
  },
  metricNumberLarge: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1E3A34',
  },

  // Base Web-style Card
  webCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  cardHeaderWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badgeDays: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#94A3B8',
    backgroundColor: 'transparent',
  },
  badgeDaysText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  // Tasks
  tasksContainer: {
    minHeight: 120,
    justifyContent: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 12,
  },
  taskCheckbox: {
    marginTop: 2,
  },
  taskTextCol: {
    flex: 1,
  },
  taskContent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748B',
  },
  taskBatchTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  emptyTasksBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTasksText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  viewMoreBtn: {
    backgroundColor: '#3E7B74',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  viewMoreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Attendance Chart
  attendanceChartBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    minHeight: 160,
    justifyContent: 'center',
  },
  barItemRow: {
    marginBottom: 12,
  },
  barMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barBatchName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 8,
  },
  barPercentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3E7B74',
  },
  barTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3E7B74',
    borderRadius: 5,
  },
  emptyChartContainer: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartGrid: {
    width: '100%',
    height: 60,
    justifyContent: 'space-between',
    marginBottom: 12,
    opacity: 0.3,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#94A3B8',
    width: '100%',
  },
  emptyChartText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Attendance Summary
  attSummaryRows: {
    backgroundColor: '#DEE6E4',
    borderRadius: 8,
  },
  attRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  attDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  attLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  attValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewDetailsBtn: {
    backgroundColor: '#3E7B74',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  viewDetailsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Activities
  activitiesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  activitiesList: {
    padding: 12,
  },
  activityItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  actStatusBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  actMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  actCourseText: {
    fontSize: 12,
    color: '#475569',
  },
  actBatchText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  actDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actDateText: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyActivitiesBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivitiesText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
