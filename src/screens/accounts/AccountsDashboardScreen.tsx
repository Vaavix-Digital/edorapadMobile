import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  Line,
  Text as SvgText,
  G,
  Rect,
} from 'react-native-svg';
import {
  TrendingUp,
  CreditCard,
  Banknote,
  Users,
  ChevronRight,
  Bell,
  Menu,
  DollarSign,
  ArrowUpRight,
  Calendar,
  Layers,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { AccountsDrawerMenu } from '../../components/navigation/AccountsDrawerMenu';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchFullAccountsDashboard,
  fetchDashboardSummary,
  fetchFeeTrend,
  fetchExpenseTrend,
  fetchRecentPayments,
  fetchPayrollSummary,
} from '../../store/slices/accountSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

// ─── Format Currency Helper ──────────────────────────────────────────────────
const formatCurrency = (val?: number | null, currencyCode: string = 'usd'): string => {
  if (val === undefined || val === null) return '$0';
  const symbol = currencyCode?.toLowerCase() === 'inr' ? '₹' : '$';
  return `${symbol}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

// ─── Line Chart for Monthly Fee Collection Trend ──────────────────────────────
interface LineChartProps {
  data: { month: string; collected: number; netEarnings: number }[];
  currency?: string;
}

const MonthlyFeeLineChart: React.FC<LineChartProps> = ({ data, currency = 'usd' }) => {
  const chartHeight = 220;
  const paddingLeft = 46;
  const paddingRight = 18;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphWidth = CHART_WIDTH - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.collected || 0, d.netEarnings || 0)),
    30000
  );

  const yTicks = [0, 7500, 15000, 22500, 30000];

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + graphWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * graphWidth;
  };

  const getY = (value: number) => {
    const clamped = Math.max(0, Math.min(value, maxVal));
    return paddingTop + graphHeight - (clamped / maxVal) * graphHeight;
  };

  // Build path strings
  let collectedPath = '';
  let netPath = '';

  data.forEach((pt, i) => {
    const x = getX(i);
    const yC = getY(pt.collected);
    const yN = getY(pt.netEarnings);

    if (i === 0) {
      collectedPath += `M ${x} ${yC}`;
      netPath += `M ${x} ${yN}`;
    } else {
      // Smooth cubic bezier curve
      const prevX = getX(i - 1);
      const prevYC = getY(data[i - 1].collected);
      const prevYN = getY(data[i - 1].netEarnings);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpX2 = prevX + (x - prevX) / 2;

      collectedPath += ` C ${cpX1} ${prevYC}, ${cpX2} ${yC}, ${x} ${yC}`;
      netPath += ` C ${cpX1} ${prevYN}, ${cpX2} ${yN}, ${x} ${yN}`;
    }
  });

  return (
    <View style={chartStyles.container}>
      <Svg width={CHART_WIDTH} height={chartHeight}>
        {/* Horizontal Grid lines & Y labels */}
        {yTicks.map((tick) => {
          const yPos = getY(tick);
          return (
            <G key={`tick-${tick}`}>
              <Line
                x1={paddingLeft}
                y1={yPos}
                x2={CHART_WIDTH - paddingRight}
                y2={yPos}
                stroke="#D1DDD9"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 8}
                y={yPos + 4}
                fill="#546E68"
                fontSize={10}
                fontWeight="500"
                textAnchor="end"
              >
                {tick === 0 ? '0' : tick >= 1000 ? `${tick / 1000}k` : tick}
              </SvgText>
            </G>
          );
        })}

        {/* X Axis bottom base line */}
        <Line
          x1={paddingLeft}
          y1={paddingTop + graphHeight}
          x2={CHART_WIDTH - paddingRight}
          y2={paddingTop + graphHeight}
          stroke="#95ACA6"
          strokeWidth={1.5}
        />

        {/* X Axis Labels */}
        {data.map((pt, i) => (
          <SvgText
            key={`x-${i}`}
            x={getX(i)}
            y={chartHeight - 8}
            fill="#546E68"
            fontSize={11}
            fontWeight="600"
            textAnchor="middle"
          >
            {pt.month}
          </SvgText>
        ))}

        {/* Net Earnings Line (Dark Teal Dashed) */}
        <Path
          d={netPath}
          fill="none"
          stroke="#295651"
          strokeWidth={2}
          strokeDasharray="4 4"
        />

        {/* Fee Collected Line (Teal Solid) */}
        <Path
          d={collectedPath}
          fill="none"
          stroke="#4EA397"
          strokeWidth={2.5}
        />

        {/* Markers for Fee Collected */}
        {data.map((pt, i) => {
          const x = getX(i);
          const y = getY(pt.collected);
          return (
            <Circle
              key={`c-dot-${i}`}
              cx={x}
              cy={y}
              r={4.5}
              fill="#4EA397"
              stroke="#FFF"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Markers for Net Earnings */}
        {data.map((pt, i) => {
          const x = getX(i);
          const y = getY(pt.netEarnings);
          return (
            <Circle
              key={`n-dot-${i}`}
              cx={x}
              cy={y}
              r={4}
              fill="#295651"
              stroke="#FFF"
              strokeWidth={1.5}
            />
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={chartStyles.legendRow}>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: '#4EA397' }]} />
          <Text style={chartStyles.legendLabel}>Fee Collected</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDot, { backgroundColor: '#295651' }]} />
          <Text style={chartStyles.legendLabel}>Net Earnings</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Donut Chart for Expense Trend ───────────────────────────────────────────
interface ExpenseDonutProps {
  salaryPct: number;
}

const ExpenseDonutChart: React.FC<ExpenseDonutProps> = ({ salaryPct = 100 }) => {
  const size = 150;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(Math.max(salaryPct, 0), 100)) / 100;

  return (
    <View style={donutStyles.container}>
      <View style={donutStyles.donutWrapper}>
        <Svg width={size} height={size}>
          {/* Background Track (Income / Gray) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#CBD5E1"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Salary Segment (Teal) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#4EA397"
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
        <View style={donutStyles.centerContent}>
          <Text style={donutStyles.centerPercentage}>{salaryPct}%</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={donutStyles.legendRow}>
        <View style={donutStyles.legendItem}>
          <View style={[donutStyles.legendDot, { backgroundColor: '#4EA397' }]} />
          <Text style={donutStyles.legendLabel}>Staff Salary</Text>
        </View>
        <View style={donutStyles.legendItem}>
          <View style={[donutStyles.legendDot, { backgroundColor: '#CBD5E1' }]} />
          <Text style={donutStyles.legendLabel}>Income</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Accounts Dashboard Screen ──────────────────────────────────────────
export const AccountsDashboardScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAppSelector((state) => state.auth);
  const {
    dashboardSummary,
    feeTrend,
    expenseTrend,
    recentPayments,
    payrollSummary,
    dashboardLoading,
  } = useAppSelector((state) => state.account);

  const loadData = async () => {
    await dispatch(fetchFullAccountsDashboard());
  };

  // Automatically close and reset drawer whenever returning to this screen
  useFocusEffect(
    useCallback(() => {
      setDrawerOpen(false);
    }, [])
  );

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const currency = dashboardSummary?.currency || 'usd';
  const salaryPct = expenseTrend?.salaryPercentage ?? 100;

  return (
    <ScreenContainer style={styles.container}>
      {/* Sliding Navigation Drawer */}
      {drawerOpen && (
        <AccountsDrawerMenu
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          navigation={navigation}
          activeScreen="AccountsDashboard"
        />
      )}

      {/* Top Header Bar */}
      <Header
        title={`Welcome, ${user?.name || 'shahn'}`}
        subtitle="Accounts & Marketing"
        showMenu
        onMenuPress={() => setDrawerOpen(true)}
        showNotifications
        onNotificationsPress={() => navigation.navigate('Notifications')}
        unreadNotificationsCount={1}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4EA397']}
            tintColor="#4EA397"
          />
        }
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>Accounts Dashboard</Text>

        {/* ─── 4 Stat Summary Cards (2×2 Grid) ──────────────────────────── */}
        {/* Row 1 */}
        <View style={styles.statCardsRow}>
          {/* 1. Total Fees Collected */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statLabel}>Total Fees Collected</Text>
              <Text style={styles.statMainNumber}>
                {formatCurrency(dashboardSummary?.revenue?.totalVolume ?? 30157.22, currency)}
              </Text>
              <View style={styles.netEarningsRow}>
                <TrendingUp size={16} color="#16A34A" />
                <Text style={styles.netEarningsText}>
                  Net: {formatCurrency(dashboardSummary?.revenue?.netEarnings ?? 25591.14, currency)}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. Pending Dues */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statLabel}>Pending Dues</Text>
              <Text style={styles.statMainNumber}>
                {formatCurrency(dashboardSummary?.pendingDues ?? 1100, currency)}
              </Text>
              <TouchableOpacity
                style={styles.actionChip}
                onPress={() => navigation.navigate('AccountsFees')}
              >
                <Text style={styles.actionChipText}>View Dues</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Row 2 */}
        <View style={styles.statCardsRow}>
          {/* 3. Active Students */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statLabel}>Active Students</Text>
              <Text style={styles.statMainNumber}>
                {dashboardSummary?.activeStudents ?? 3}
              </Text>
              <Text style={styles.statSubText}>Enrolled &amp; active</Text>
            </View>
          </View>

          {/* 4. Payroll Summary */}
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statLabel}>Payroll Summary</Text>
              <Text style={styles.statMainNumber}>
                {formatCurrency(dashboardSummary?.payroll?.netPayroll ?? 6172.55, currency)}
              </Text>
              <Text style={styles.statSubText}>
                PF: {formatCurrency(dashboardSummary?.payroll?.totalPF ?? 1039.44, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Monthly Fee Collection Trend ──────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Monthly Fee Collection Trend</Text>
          </View>
          <MonthlyFeeLineChart
            data={feeTrend && feeTrend.length > 0 ? feeTrend : [
              { month: 'Jan', collected: 0, netEarnings: 0 },
              { month: 'Feb', collected: 0, netEarnings: 0 },
              { month: 'Mar', collected: 0, netEarnings: 0 },
              { month: 'Apr', collected: 0, netEarnings: 0 },
              { month: 'May', collected: 1200, netEarnings: 1000 },
              { month: 'Jun', collected: 28957, netEarnings: 24591 },
              { month: 'Jul', collected: 0, netEarnings: 0 },
              { month: 'Aug', collected: 0, netEarnings: 0 },
              { month: 'Sep', collected: 0, netEarnings: 0 },
            ]}
            currency={currency}
          />
        </View>

        {/* ─── Expense Trend ────────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expense Trend</Text>
          </View>
          <ExpenseDonutChart salaryPct={salaryPct} />
        </View>

        {/* ─── Recent Payments Section ──────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            <TouchableOpacity
              style={styles.viewMoreBtn}
              onPress={() => navigation.navigate('AccountsFees')}
            >
              <Text style={styles.viewMoreText}>View More</Text>
              <ChevronRight size={16} color="#295651" />
            </TouchableOpacity>
          </View>

          {recentPayments && recentPayments.length > 0 ? (
            <View style={styles.itemsList}>
              {recentPayments.map((payment, idx) => (
                <View key={idx} style={styles.itemRowCard}>
                  <View style={styles.itemMainInfo}>
                    <Text style={styles.itemPrimaryTitle}>{payment.studentName}</Text>
                    <Text style={styles.itemSecondarySubtitle}>
                      {payment.courseName} • {payment.batch}
                    </Text>
                    <View style={styles.itemMetaRow}>
                      <Calendar size={13} color="#657B76" />
                      <Text style={styles.itemDateText}>{payment.date}</Text>
                    </View>
                  </View>
                  <View style={styles.itemEndInfo}>
                    <Text style={styles.itemAmountText}>
                      {formatCurrency(payment.amount, payment.currency || currency)}
                    </Text>
                    <View style={styles.statusBadgeGreen}>
                      <Text style={styles.statusBadgeGreenText}>{payment.status || 'PAID'}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recent payments found</Text>
            </View>
          )}
        </View>

        {/* ─── Payroll Summary Section ──────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <Text style={styles.sectionTitle}>Payroll Summary</Text>
            <TouchableOpacity
              style={styles.viewMoreBtn}
              onPress={() => navigation.navigate('AccountsSalary')}
            >
              <Text style={styles.viewMoreText}>View More</Text>
              <ChevronRight size={16} color="#295651" />
            </TouchableOpacity>
          </View>

          {payrollSummary && payrollSummary.length > 0 ? (
            <View style={styles.itemsList}>
              {payrollSummary.map((payroll, idx) => (
                <View key={idx} style={styles.itemRowCard}>
                  <View style={styles.itemMainInfo}>
                    <Text style={styles.itemPrimaryTitle}>{payroll.staffName}</Text>
                    <Text style={styles.itemSecondarySubtitle}>
                      ID: {payroll.staffId} • {payroll.course}
                    </Text>
                    <View style={styles.itemMetaRow}>
                      <Calendar size={13} color="#657B76" />
                      <Text style={styles.itemDateText}>{payroll.date}</Text>
                    </View>
                  </View>
                  <View style={styles.itemEndInfo}>
                    <Text style={styles.itemAmountText}>
                      {formatCurrency(payroll.amount, payroll.currency || currency)}
                    </Text>
                    <View style={styles.statusBadgeGreen}>
                      <Text style={styles.statusBadgeGreenText}>{payroll.status || 'PAID'}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No payroll records found</Text>
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 28 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFA',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F5',
  },
  welcomeGreeting: {
    fontSize: 16,
    fontWeight: '700',
    color: '#243029',
  },
  userRoleSubtitle: {
    fontSize: 12,
    color: '#657B76',
    fontWeight: '500',
  },
  bellButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F5',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53E3E',
  },
  scrollContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
  },
  pageTitle: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
    letterSpacing: -0.3,
  },

  // Stat cards grid
  statCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
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
  statLabel: {
    fontSize: THEME.typography.sizes.sm,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 18,
  },
  statMainNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A5247',
    lineHeight: 32,
    marginBottom: 6,
  },
  netEarningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  netEarningsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  statSubText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  actionChip: {
    marginTop: 4,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },

  // Sections
  sectionCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#243029',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#295651',
  },

  // Tables / Cards list
  itemsList: {
    gap: 10,
  },
  itemRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemPrimaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#243029',
  },
  itemSecondarySubtitle: {
    fontSize: 12,
    color: '#546E68',
    marginTop: 2,
    fontWeight: '500',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  itemDateText: {
    fontSize: 11,
    color: '#758D87',
  },
  itemEndInfo: {
    alignItems: 'flex-end',
  },
  itemAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#295651',
    marginBottom: 4,
  },
  statusBadgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#8A9D98',
    fontWeight: '500',
  },
});

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: '#DEE6E4',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
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
    color: '#243029',
  },
});

const donutStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  donutWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerPercentage: {
    fontSize: 28,
    fontWeight: '800',
    color: '#295651',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 18,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#243029',
  },
});
