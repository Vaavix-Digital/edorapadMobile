import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, RefreshControl,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  Video, Award, CreditCard, BookOpen, Clock, AlertCircle, Play,
  ArrowRight, ChevronRight, Calendar, User,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StudentDrawerMenu } from '../../components/navigation/StudentDrawerMenu';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { fetchStudentFullDashboard } from '../../store/slices/studentSlice';
import { formatCurrency } from '../../shared/utils/calculations';
import { formatDate } from '../../shared/utils/dateHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Donut / Ring Progress ──────────────────────────────
const DonutProgress = ({ percentage = 80 }: { percentage: number }) => {
  const validPct = Math.min(Math.max(Number(percentage) || 0, 0), 100);
  const size = 114;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * validPct) / 100;

  return (
    <View style={donutStyles.container}>
      <Svg width={size} height={size}>
        {/* Background Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Active Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#3E7874"
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
      {/* Perfectly Centered Upright Percentage Text */}
      <View style={donutStyles.centerLabel}>
        <Text style={donutStyles.percentageText}>{validPct}%</Text>
      </View>
    </View>
  );
};

const donutStyles = StyleSheet.create({
  container: {
    width: 114,
    height: 114,
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
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
});

// â”€â”€â”€ Study Hours Bar Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StudyHoursChart = ({ data }: { data: { day: string; hours: number }[] }) => {
  const maxH = Math.max(...data.map((d) => d.hours), 1);
  const barMaxH = 72;

  return (
    <View style={chartStyles.container}>
      {data.map((d, i) => {
        const h = (d.hours / maxH) * barMaxH;
        return (
          <View key={i} style={chartStyles.col}>
            <View style={[chartStyles.bar, { height: Math.max(h, 4) }]} />
            <Text style={chartStyles.dayLabel}>{d.day.substring(0, 3)}</Text>
          </View>
        );
      })}
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
    gap: 6,
    paddingHorizontal: 4,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    width: '100%',
    backgroundColor: THEME.colors.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
});

// â”€â”€â”€ Main Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const StudentDashboardScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    stats, courseCompletion, studyHours, feeSummary,
    upcomingActivities, feeCourses, classes, assessments, loading,
  } = useAppSelector((state) => state.student);

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchStudentFullDashboard());
  }, [dispatch]);

  const pendingFees = feeCourses.reduce((acc: number, c: any) => acc + (c.pendingAmount || 0), 0);
  const liveClass = classes.find((c: any) => c.status === 'live');

  const formatFeeCurrency = (amount: number) =>
    `$${Number(amount || 0).toLocaleString()}`;

  const formatDueDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchStudentFullDashboard())}
            tintColor={THEME.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with menu icon */}
        <Header
          title={`Welcome, ${user?.name || 'Student'}`}
          subtitle={`Student ID: ${user?.studentCustomId || 'STU-001'}`}
          showMenu
          onMenuPress={() => setDrawerOpen(true)}
          showNotifications
          onNotificationsPress={() => navigation.navigate('Notifications')}
        />

        {/* Live Class Banner */}
        {liveClass ? (
          <Card style={styles.liveBanner} onPress={() => navigation.navigate('Classes')}>
            <View style={styles.bannerRow}>
              <View style={styles.liveDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.liveBannerTitle}>LIVE CLASS IN PROGRESS!</Text>
                <Text style={styles.liveBannerSub}>{liveClass.title}</Text>
              </View>
              <View style={styles.joinBtn}>
                <Text style={styles.joinBtnText}>Join Now</Text>
                <Play size={12} color="#FFF" />
              </View>
            </View>
          </Card>
        ) : null}

        {/* Pending Fee Banner */}
        {pendingFees > 0 && (
          <Card style={styles.feeBanner} onPress={() => navigation.navigate('Payments')}>
            <View style={styles.bannerRow}>
              <CreditCard size={20} color={THEME.colors.warning} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.feeBannerTitle}>Pending Tuition Fee</Text>
                <Text style={styles.feeBannerSub}>
                  Outstanding: {formatCurrency(pendingFees)}
                </Text>
              </View>
              <Text style={styles.feePayLink}>Pay Online â†’</Text>
            </View>
          </Card>
        )}

        {/* â”€â”€ 4 Stat Cards (2Ã—2 Grid) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Text style={styles.sectionTitle}>Student Dashboard</Text>
        <View style={styles.statsGrid}>
          {/* Total Course Enrolled */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statCardLabel}>Total Course Enrolled</Text>
              <Text style={styles.statCardValue}>{stats.totalCourseEnrolled}</Text>
            </View>
          </View>

          {/* Pending Assignments */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statCardLabel}>Pending Assignments</Text>
              <Text style={styles.statCardValue}>{stats.pendingAssignments}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Assessments')} style={styles.cardActionBtn}>
                <Text style={styles.cardActionText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Upcoming Live Classes */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statCardLabel}>Upcoming Live Classes</Text>
              <Text style={styles.statCardValue}>{stats.upcomingLiveClasses}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Classes')} style={styles.cardActionBtn}>
                <Text style={styles.cardActionText}>Scheduled</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Certificates Earned */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statCardLabel}>Certificates Earned</Text>
              <Text style={styles.statCardValue}>{stats.certificatesEarned}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Certificates')} style={styles.cardActionBtn}>
                <Text style={styles.cardActionText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* â”€â”€ Course Completion + Fees (side by side on wider / stacked on narrow) */}
        <View style={styles.rowCards}>
          {/* Course Completion Donut */}
          <Card style={[styles.halfCard, styles.completionCard]}>
            <Text style={styles.cardTitle}>Course Completion</Text>
            <View style={styles.donutWrap}>
              <DonutProgress percentage={courseCompletion.completedPercentage} />
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: THEME.colors.primary }]} />
                <Text style={styles.legendText}>Completed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#E5E7EB' }]} />
                <Text style={styles.legendText}>Remaining</Text>
              </View>
            </View>
          </Card>

          {/* Fees Summary */}
          <Card style={[styles.halfCard, styles.feesCard]}>
            <Text style={styles.cardTitle}>Fees</Text>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Total Fee</Text>
              <Text style={styles.feeValue}>{formatFeeCurrency(feeSummary.totalFee)}</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Paid</Text>
              <Text style={[styles.feeValue, { color: THEME.colors.success }]}>
                {formatFeeCurrency(feeSummary.paid)}
              </Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Remaining</Text>
              <Text style={[styles.feeValue, { color: THEME.colors.error }]}>
                {formatFeeCurrency(feeSummary.remaining)}
              </Text>
            </View>
            <View style={styles.feeDivider} />
            <Text style={styles.dueDateLabel}>Next Due Date</Text>
            <Text style={styles.dueDateValue}>{formatDueDate(feeSummary.nextDueDate)}</Text>
            <TouchableOpacity
              style={styles.viewDetailsBtn}
              onPress={() => navigation.navigate('Payments')}
              activeOpacity={0.85}
            >
              <Text style={styles.viewDetailsBtnText}>view details</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* â”€â”€ Study Hours Bar Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>Study Hours</Text>
            <View style={styles.lastSevenBadge}>
              <Text style={styles.lastSevenText}>Last 7 Days</Text>
            </View>
          </View>
          <StudyHoursChart data={studyHours} />
        </Card>

        {/* â”€â”€ Upcoming Activities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Upcoming Activities</Text>
        </View>

        {upcomingActivities.length > 0 ? (
          upcomingActivities.slice(0, 5).map((item: any, idx: number) => (
            <Card key={item.id || idx} style={styles.activityCard}>
              <View style={styles.activityTop}>
                <Text style={styles.activityName} numberOfLines={1}>{item.activity}</Text>
                <StatusBadge status={item.status} size="sm" />
              </View>
              <Text style={styles.activityCourse} numberOfLines={1}>{item.course}</Text>
              <View style={styles.activityMeta}>
                <View style={styles.activityMetaItem}>
                  <Calendar size={12} color={THEME.colors.textMuted} />
                  <Text style={styles.activityDate}>{formatDate(item.date)}</Text>
                </View>
                {item.instructor ? (
                  <View style={styles.activityMetaItem}>
                    <User size={12} color={THEME.colors.textMuted} />
                    <Text style={styles.activityInstructor}>{item.instructor}</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          ))
        ) : (
          <Card variant="flat" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No upcoming activities found</Text>
          </Card>
        )}

        {/* â”€â”€ Today's Classes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View style={[styles.sectionHeader, { marginTop: THEME.spacing.md }]}>
          <Text style={styles.sectionHeading}>Today's Classes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Classes')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {classes.length > 0 ? (
          classes.slice(0, 3).map((item: any, idx: number) => (
            <Card key={item.id || idx} style={styles.classCard}>
              <View style={styles.classTop}>
                <Text style={styles.classTitle}>{item.title}</Text>
                <StatusBadge status={item.status} size="sm" />
              </View>
              <View style={styles.classMeta}>
                <Clock size={13} color={THEME.colors.textSecondary} />
                <Text style={styles.classTime}>
                  {formatDate(item.scheduledStartTime)}
                </Text>
              </View>
              <Text style={styles.tutorName}>Instructor: {item.tutorName || 'Faculty Tutor'}</Text>
            </Card>
          ))
        ) : (
          <Card variant="flat" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No classes scheduled for today</Text>
          </Card>
        )}
      </ScrollView>

      {/* Side Drawer */}
      {(drawerOpen) && (
        <StudentDrawerMenu
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          navigation={navigation}
          activeScreen="StudentDashboard"
          onLogout={() => dispatch(logoutUser())}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl + 20,
  },

  // â”€â”€ Banners
  liveBanner: {
    backgroundColor: THEME.colors.error,
    padding: 12,
    marginBottom: THEME.spacing.sm,
  },
  feeBanner: {
    backgroundColor: THEME.colors.warningLight,
    borderColor: THEME.colors.warning,
    padding: 12,
    marginBottom: THEME.spacing.sm,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#FFF', marginRight: 10,
  },
  liveBannerTitle: {
    color: '#FFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase',
  },
  liveBannerSub: {
    color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 1,
  },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.sm, gap: 4,
  },
  joinBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  feeBannerTitle: { color: '#92400E', fontSize: 12, fontWeight: '700' },
  feeBannerSub: { color: '#B45309', fontSize: 11, marginTop: 1 },
  feePayLink: { color: '#92400E', fontSize: 12, fontWeight: '700' },

  // â”€â”€ Section Titles
  sectionTitle: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
    letterSpacing: -0.3,
  },

  // â”€â”€ 4 Stat Cards Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: THEME.spacing.md,
  },
  statCard: {
    width: (SCREEN_WIDTH - THEME.spacing.md * 2 - 10) / 2,
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statCardInner: {
    padding: 14,
    minHeight: 100,
  },
  statCardLabel: {
    fontSize: THEME.typography.sizes.sm,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
  },
  statCardValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1A5247',
    lineHeight: 48,
  },
  cardActionBtn: {
    marginTop: 4,
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },

  // â”€â”€ Side-by-side completion + fees
  rowCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: THEME.spacing.md,
  },
  halfCard: {
    flex: 1,
    padding: 14,
  },
  completionCard: {
    alignItems: 'center',
  },
  feesCard: {},
  cardTitle: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.sm,
  },
  donutWrap: {
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
  },

  // â”€â”€ Fee rows
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textSecondary,
  },
  feeValue: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  feeDivider: {
    height: 1,
    backgroundColor: THEME.colors.borderLight,
    marginVertical: 8,
  },
  dueDateLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginBottom: 2,
  },
  dueDateValue: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 10,
  },
  viewDetailsBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 9,
    alignItems: 'center',
  },
  viewDetailsBtnText: {
    color: '#FFF',
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '700',
  },

  // â”€â”€ Study Hours Card
  chartCard: {
    padding: 14,
    marginBottom: THEME.spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  lastSevenBadge: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lastSevenText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },

  // â”€â”€ Activities
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  sectionHeading: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  viewAllText: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  activityCard: {
    padding: 12,
    marginBottom: 8,
  },
  activityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityName: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  activityCourse: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityDate: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  activityInstructor: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },

  // â”€â”€ Classes
  classCard: { padding: 12, marginBottom: 8 },
  classTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  classTitle: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  classMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  classTime: { fontSize: 11, color: THEME.colors.textSecondary },
  tutorName: { fontSize: 11, color: THEME.colors.textMuted },

  emptyCard: { padding: 20, alignItems: 'center', marginBottom: THEME.spacing.sm },
  emptyText: { fontSize: 13, color: THEME.colors.textSecondary },
});

