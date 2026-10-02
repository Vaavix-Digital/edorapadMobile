import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path, Line as SvgLine, Rect, G, Text as SvgText } from 'react-native-svg';
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  Layers,
  CheckCircle,
  Calendar,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  DollarSign,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { InstituteDrawerMenu } from '../../components/navigation/InstituteDrawerMenu';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { fetchInstituteDashboard } from '../../store/slices/instituteSlice';
import { formatDate } from '../../shared/utils/dateHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Financial Overview SVG Chart ──────────────────────────
const FinancialOverviewChart = ({
  data,
}: {
  data: { month: string; income: number; expense: number }[];
}) => {
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 150;
  const padLeft = 40;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 25;

  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const maxVal = 26000;
  const months = data.map((d) => d.month);

  const getX = (index: number) => padLeft + (index / (months.length - 1)) * innerWidth;
  const getY = (val: number) => padTop + innerHeight - (Math.min(val, maxVal) / maxVal) * innerHeight;

  // Build income curve path
  const incomePoints = data.map((d, i) => `${getX(i)},${getY(d.income)}`);
  const incomePath = `M ${incomePoints.join(' L ')}`;

  // Build expense line path
  const expensePoints = data.map((d, i) => `${getX(i)},${getY(d.expense)}`);
  const expensePath = `M ${expensePoints.join(' L ')}`;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.headerRow}>
        <Text style={chartStyles.cardTitle}>Financial Overview</Text>
        <View style={chartStyles.legendRow}>
          <View style={chartStyles.legendItem}>
            <View style={[chartStyles.legendDot, { backgroundColor: '#64748B' }]} />
            <Text style={chartStyles.legendText}>Expenses</Text>
          </View>
          <View style={chartStyles.legendItem}>
            <View style={[chartStyles.legendDot, { backgroundColor: '#14B8A6' }]} />
            <Text style={chartStyles.legendText}>Income</Text>
          </View>
        </View>
      </View>

      <View style={chartStyles.svgCard}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Horizontal Grid lines & Y-axis labels */}
          {[0, 6500, 13000, 19500, 26000].map((val) => {
            const y = getY(val);
            return (
              <G key={val}>
                <SvgLine
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <SvgText
                  x={padLeft - 6}
                  y={y + 4}
                  fill="#94A3B8"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="end"
                >
                  {val === 0 ? '0' : val >= 1000 ? `${val / 1000}k` : val}
                </SvgText>
              </G>
            );
          })}

          {/* Expense Path (Gray Line) */}
          <Path d={expensePath} fill="none" stroke="#64748B" strokeWidth={2.5} />
          {data.map((d, i) => (
            <Circle
              key={`exp-${i}`}
              cx={getX(i)}
              cy={getY(d.expense)}
              r={3.5}
              fill="#64748B"
              stroke="#FFF"
              strokeWidth={1.5}
            />
          ))}

          {/* Income Path (Teal Curve) */}
          <Path d={incomePath} fill="none" stroke="#14B8A6" strokeWidth={3} />
          {data.map((d, i) => (
            <Circle
              key={`inc-${i}`}
              cx={getX(i)}
              cy={getY(d.income)}
              r={4.5}
              fill="#14B8A6"
              stroke="#FFF"
              strokeWidth={2}
            />
          ))}

          {/* Month labels along X-axis */}
          {data.map((d, i) => (
            <SvgText
              key={`label-${i}`}
              x={getX(i)}
              y={chartHeight - 6}
              fill="#64748B"
              fontSize="10.5"
              fontWeight="600"
              textAnchor="middle"
            >
              {d.month}
            </SvgText>
          ))}
        </Svg>
      </View>
    </View>
  );
};

// ─── Staff Role Distribution Donut Chart ───────────────────
const StaffDistributionChart = ({
  data,
}: {
  data: { role: string; count: number; percentage: number }[];
}) => {
  const size = 130;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const halfCircumference = circumference * 0.5;

  return (
    <View style={chartStyles.container}>
      <Text style={chartStyles.cardTitle}>Staff Role Distribution</Text>

      <View style={chartStyles.donutCard}>
        <View style={chartStyles.donutWrapper}>
          <Svg width={size} height={size}>
            {/* 1st segment: Account & Marketing (50%) */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#B7BEBC"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${halfCircumference} ${circumference}`}
              strokeDashoffset={0}
              originX={size / 2}
              originY={size / 2}
              rotation="-90"
            />
            {/* 2nd segment: Tutor (50%) */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#54A39A"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${halfCircumference} ${circumference}`}
              strokeDashoffset={-halfCircumference}
              originX={size / 2}
              originY={size / 2}
              rotation="-90"
            />
          </Svg>

          <View style={chartStyles.donutCenterText}>
            <Text style={chartStyles.donutPercent}>50%</Text>
            <Text style={chartStyles.donutSub}>Ratio</Text>
          </View>
        </View>

        {/* Legend Chips */}
        <View style={chartStyles.staffLegendCol}>
          <View style={chartStyles.staffLegendItem}>
            <View style={[chartStyles.staffLegendBox, { backgroundColor: '#B7BEBC' }]} />
            <Text style={chartStyles.staffLegendLabel}>Account & Marketing (2)</Text>
            <Text style={chartStyles.staffLegendVal}>50%</Text>
          </View>
          <View style={chartStyles.staffLegendItem}>
            <View style={[chartStyles.staffLegendBox, { backgroundColor: '#54A39A' }]} />
            <Text style={chartStyles.staffLegendLabel}>Tutor (2)</Text>
            <Text style={chartStyles.staffLegendVal}>50%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Breakdown By Department Chart ─────────────────────────
const BreakdownByDepartmentChart = ({
  data,
}: {
  data: { course: string; Aug?: number; Jul?: number; Sep?: number }[];
}) => {
  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.headerRow}>
        <Text style={chartStyles.cardTitle}>Breakdown By Department</Text>
        <View style={chartStyles.legendRow}>
          <View style={chartStyles.legendItem}>
            <View style={[chartStyles.legendDot, { backgroundColor: '#98E3B3' }]} />
            <Text style={chartStyles.legendText}>Aug</Text>
          </View>
          <View style={chartStyles.legendItem}>
            <View style={[chartStyles.legendDot, { backgroundColor: '#8CA4FF' }]} />
            <Text style={chartStyles.legendText}>Jul</Text>
          </View>
          <View style={chartStyles.legendItem}>
            <View style={[chartStyles.legendDot, { backgroundColor: '#FFC482' }]} />
            <Text style={chartStyles.legendText}>Sep</Text>
          </View>
        </View>
      </View>

      <View style={chartStyles.deptCard}>
        {data.map((item, idx) => (
          <View key={idx} style={chartStyles.deptRow}>
            <View style={chartStyles.deptTitleRow}>
              <Text style={chartStyles.deptCourseName} numberOfLines={1}>
                {item.course}
              </Text>
              <Text style={chartStyles.deptMetricNote}>Active Cohort</Text>
            </View>

            {/* Visual multi-segment bar */}
            <View style={chartStyles.deptBarTrack}>
              <View style={[chartStyles.deptBarSegment, { width: '35%', backgroundColor: '#8CA4FF' }]} />
              <View style={[chartStyles.deptBarSegment, { width: '40%', backgroundColor: '#98E3B3' }]} />
              <View style={[chartStyles.deptBarSegment, { width: '25%', backgroundColor: '#FFC482' }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Main Institute Dashboard Screen ─────────────────────────
export const InstituteDashboardScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, leaves, batches, financialOverview, staffDistribution, departmentBreakdown, loading } =
    useAppSelector((state) => state.institute);

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchInstituteDashboard());
  }, [dispatch]);

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchInstituteDashboard())}
            tintColor={THEME.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with hamburger menu icon */}
        <Header
          title="Institute Dashboard"
          subtitle="Institution Management Overview"
          showMenu
          onMenuPress={() => setDrawerOpen(true)}
          showNotifications
          onNotificationsPress={() => navigation.navigate('Notifications')}
        />

        {/* Quick Action Banner */}
        <Card style={styles.bannerCard} onPress={() => navigation.navigate('AttendanceMarking')}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>Daily Attendance</Text>
              <Text style={styles.bannerSub}>Mark or inspect faculty & student attendance</Text>
            </View>
            <View style={styles.bannerAction}>
              <Text style={styles.bannerActionText}>Open</Text>
              <ArrowRight size={16} color="#FFF" />
            </View>
          </View>
        </Card>

        {/* 4 KPI Stats Grid (Total Tutors, Active Students, Departments, Total Courses) */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title="Total Tutors"
              value={stats?.totalTutors || 2}
              icon={<Users size={18} color={THEME.colors.primary} />}
              accentColor={THEME.colors.primary}
            />
            <StatCard
              title="Active Students"
              value={stats?.activeStudents || 2}
              icon={<GraduationCap size={18} color="#3B82F6" />}
              accentColor="#3B82F6"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title="Departments"
              value={stats?.totalDepartments || 2}
              icon={<Building2 size={18} color="#8B5CF6" />}
              accentColor="#8B5CF6"
            />
            <StatCard
              title="Total Courses"
              value={stats?.totalCourses || 4}
              icon={<BookOpen size={18} color="#F59E0B" />}
              accentColor="#F59E0B"
            />
          </View>
        </View>

        {/* Financial Overview Chart Card */}
        <FinancialOverviewChart data={financialOverview} />

        {/* Staff Role Distribution Donut Card */}
        <StaffDistributionChart data={staffDistribution?.data || []} />

        {/* Breakdown By Department Card */}
        <BreakdownByDepartmentChart data={departmentBreakdown} />

        {/* Pending Leave Requests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Leave Approvals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('LeaveApprovals')}>
            <Text style={styles.seeAllText}>View All ({pendingLeaves.length})</Text>
          </TouchableOpacity>
        </View>

        {pendingLeaves.length > 0 ? (
          pendingLeaves.slice(0, 3).map((leave, idx) => (
            <Card
              key={leave.id || leave._id || idx}
              style={styles.leaveCard}
              onPress={() => navigation.navigate('LeaveApprovals')}
            >
              <View style={styles.leaveRow}>
                <View style={styles.leaveAvatar}>
                  <Text style={styles.leaveAvatarText}>
                    {((leave.staff?.name || leave.userName || 'ST').substring(0, 2)).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.leaveInfo}>
                  <Text style={styles.leaveName}>{leave.staff?.name || leave.userName || 'Faculty Member'}</Text>
                  <Text style={styles.leaveReason} numberOfLines={1}>
                    {leave.reason}
                  </Text>
                  <Text style={styles.leaveDates}>
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </Text>
                </View>
                <StatusBadge status={leave.status} />
              </View>
            </Card>
          ))
        ) : (
          <Card variant="flat" style={styles.emptyCard}>
            <CheckCircle size={20} color={THEME.colors.success} />
            <Text style={styles.emptyText}>No pending leave approvals</Text>
          </Card>
        )}

        {/* Active Batches List */}
        <View style={[styles.sectionHeader, { marginTop: THEME.spacing.md }]}>
          <Text style={styles.sectionTitle}>Active Batches</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Batches')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {(batches.length > 0
          ? batches
          : [
              { name: 'TC-MAR-01', courseName: 'General Academic Course', schedule: 'Regular Class Schedule', totalStudents: 0, status: 'Active' },
              { name: 'GLB MRN EVE 101', courseName: 'General Academic Course', schedule: 'Regular Class Schedule', totalStudents: 0, status: 'Active' },
            ]
        )
          .slice(0, 4)
          .map((batch: any, index: number) => (
            <Card key={batch.id || batch._id || index} style={styles.batchCard} onPress={() => navigation.navigate('Batches')}>
              <View style={styles.batchTop}>
                <Text style={styles.batchName}>{batch.name || `Batch ${index + 1}`}</Text>
                <StatusBadge status={batch.status || 'Active'} size="sm" />
              </View>
              <Text style={styles.batchCourse}>{batch.courseName || 'General Academic Course'}</Text>
              <View style={styles.batchFooter}>
                <Text style={styles.batchTiming}>
                  {batch.timing || batch.schedule || 'Regular Class Schedule'}
                </Text>
                <Text style={styles.batchCount}>{batch.totalStudents || 0} Students</Text>
              </View>
            </Card>
          ))}
      </ScrollView>

      {/* Side Drawer Menu with all Institute features */}
      {drawerOpen && (
        <InstituteDrawerMenu
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          navigation={navigation}
          activeScreen="InstituteDashboard"
          onLogout={() => dispatch(logoutUser())}
        />
      )}
    </SafeAreaView>
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
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primaryDark,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: THEME.typography.sizes.base,
    fontWeight: '700',
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: THEME.typography.sizes.xs,
    marginTop: 2,
  },
  bannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.full,
    gap: 4,
  },
  bannerActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  sectionTitle: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  seeAllText: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  leaveCard: {
    padding: 12,
    marginBottom: 8,
  },
  leaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaveAvatarText: {
    color: THEME.colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  leaveInfo: {
    flex: 1,
    marginRight: 8,
  },
  leaveName: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  leaveReason: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  leaveDates: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginBottom: THEME.spacing.md,
  },
  emptyText: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  batchCard: {
    marginBottom: 8,
    padding: 12,
  },
  batchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  batchName: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  batchCourse: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
    marginBottom: 8,
  },
  batchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
    paddingTop: 8,
  },
  batchTiming: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  batchCount: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
});

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 10,
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
    fontWeight: '600',
    color: '#475569',
  },
  svgCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  donutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  donutWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenterText: {
    position: 'absolute',
    alignItems: 'center',
  },
  donutPercent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F766E',
  },
  donutSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  staffLegendCol: {
    gap: 10,
  },
  staffLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  staffLegendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  staffLegendLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  staffLegendVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F766E',
    marginLeft: 4,
  },
  deptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    marginTop: 8,
    gap: 10,
  },
  deptRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  deptTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  deptCourseName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: '75%',
  },
  deptMetricNote: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  deptBarTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  deptBarSegment: {
    height: '100%',
  },
});
