import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle,
  Bell,
  MessageSquare,
  TrendingUp,
  BarChart2,
  Award,
  BookOpen,
  LogOut,
  ShieldCheck,
  UserMinus,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser, normalizeUserRole } from '../../store/slices/authSlice';
import { fetchStudentProfileData } from '../../store/slices/studentSlice';
import { formatDate } from '../../shared/utils/dateHelpers';
import { InstituteProfileScreen } from '../institute/InstituteProfileScreen';
import { ParentProfileScreen } from '../parent/ParentProfileScreen';
import { TutorProfileScreen } from '../tutor/TutorProfileScreen';
import { USER_ROLES } from '../../shared/types';
import { authApi } from '../../shared/api/authApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user, role } = useAppSelector((state) => state.auth);
  const currentRole = normalizeUserRole(role || user?.role);

  if (currentRole === USER_ROLES.INSTITUTE) {
    return <InstituteProfileScreen navigation={navigation} />;
  }

  if (currentRole === USER_ROLES.PARENT) {
    return <ParentProfileScreen navigation={navigation} />;
  }

  if (
    currentRole === USER_ROLES.ONLINETUTOR ||
    currentRole === USER_ROLES.OFFLINETUTOR ||
    String(currentRole || '').toUpperCase().includes('TUTOR')
  ) {
    return <TutorProfileScreen navigation={navigation} />;
  }

  const { settings, attendanceAnalytics, coursePerformance, loading } = useAppSelector(
    (state) => state.student
  );

  const [activeTab, setActiveTab] = useState<'personal' | 'progress'>('personal');

  useEffect(() => {
    dispatch(fetchStudentProfileData());
  }, [dispatch]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from Edorapad?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingAccount(true);
              await authApi.deleteAccount();
              dispatch(logoutUser());
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to delete account');
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  const studentName = settings?.name || user?.name || 'Shrihari Nambiar p';
  const studentEmail = settings?.email || user?.email || 'shrihari1056@gmail.com';
  const phoneNumber = settings?.phoneNumber || user?.phone || '+919106163467';
  const s = settings?.studentSettings || {};
  const avatarUrl =
    s.profilePicUrl ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      studentName
    )}&background=DEE6E4&color=295651&size=200`;

  const memberSince = settings?.createdAt ? formatDate(settings.createdAt) : '21/03/2026';

  const monthlyAttendance = attendanceAnalytics?.monthlyAttendance || [
    { month: 'Apr', percentage: 100, present: 22, absent: 0 },
    { month: 'May', percentage: 100, present: 24, absent: 0 },
    { month: 'Jun', percentage: 0, present: 0, absent: 0 },
    { month: 'Jul', percentage: 0, present: 0, absent: 0 },
    { month: 'Aug', percentage: 0, present: 0, absent: 0 },
    { month: 'Sep', percentage: 0, present: 0, absent: 0 },
  ];

  const overallAttendance = attendanceAnalytics?.attendancePercentage ?? 100;
  const coursesList = coursePerformance || [];
  const avgPerformance = coursesList.length
    ? Math.round(coursesList.reduce((acc, c) => acc + c.performance, 0) / coursesList.length)
    : 19;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Header
          title="Profile"
          subtitle="Personal details & performance analytics"
          showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
          onBack={() => navigation?.goBack?.()}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'personal' && styles.tabBtnActive]}
          onPress={() => setActiveTab('personal')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'personal' && styles.tabBtnTextActive]}>
            Personal Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'progress' && styles.tabBtnActive]}
          onPress={() => setActiveTab('progress')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'progress' && styles.tabBtnTextActive]}>
            Personal Progress
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchStudentProfileData())}
            tintColor={THEME.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Profile Banner Card ── */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              defaultSource={{ uri: avatarUrl }}
            />
          </View>
          <Text style={styles.profileName}>{studentName}</Text>
          <Text style={styles.profileEmail}>{studentEmail}</Text>
        </View>

        {/* ════════════════════════════════════════════════════
            TAB 1: PERSONAL DETAILS
        ════════════════════════════════════════════════════ */}
        {activeTab === 'personal' && (
          <View style={styles.tabContent}>
            {/* 1. Basic Information */}
            <View style={styles.infoCard}>
              <Text style={styles.cardHeaderTitle}>Basic Information</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{studentName}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{phoneNumber}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>E-mail</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {studentEmail}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>{s.gender || 'Male'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nationality</Text>
                <Text style={styles.infoValue}>{s.nationality || 'Indian'}</Text>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>{memberSince}</Text>
              </View>
            </View>

            {/* 2. Preferences */}
            <View style={styles.infoCard}>
              <Text style={styles.cardHeaderTitle}>Preferences</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email Notifications</Text>
                <View
                  style={[
                    styles.badge,
                    s.emailAlerts !== false ? styles.badgeEnabled : styles.badgeDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      s.emailAlerts !== false ? styles.textEnabled : styles.textDisabled,
                    ]}
                  >
                    {s.emailAlerts !== false ? '• Enabled' : '• Disabled'}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>WhatsApp Alerts</Text>
                <View
                  style={[
                    styles.badge,
                    s.whatsappAlerts !== false ? styles.badgeEnabled : styles.badgeDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      s.whatsappAlerts !== false ? styles.textEnabled : styles.textDisabled,
                    ]}
                  >
                    {s.whatsappAlerts !== false ? '• Enabled' : '• Disabled'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. Payment Method */}
            <View style={styles.infoCard}>
              <Text style={styles.cardHeaderTitle}>Payment Method</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Preferred Method</Text>
                <Text style={styles.infoValue}>{s.preferredPaymentMethod || 'Card'}</Text>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Card</Text>
                <Text style={styles.infoValue}>
                  {s.cardType || 'Visa'} •••• {s.cardLast4 || '4111'}
                </Text>
              </View>
            </View>

            {/* 4. Verification */}
            <View style={styles.infoCard}>
              <Text style={styles.cardHeaderTitle}>Verification</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone Verified</Text>
                <View
                  style={[
                    styles.badge,
                    settings?.isPhoneVerified ? styles.badgeEnabled : styles.badgeDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      settings?.isPhoneVerified ? styles.textEnabled : styles.textDisabled,
                    ]}
                  >
                    {settings?.isPhoneVerified ? '• Yes' : '• No'}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Account Active</Text>
                <View
                  style={[
                    styles.badge,
                    settings?.isActive !== false ? styles.badgeEnabled : styles.badgeDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      settings?.isActive !== false ? styles.textEnabled : styles.textDisabled,
                    ]}
                  >
                    {settings?.isActive !== false ? '• Yes' : '• No'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleLogout}
              activeOpacity={0.85}
              disabled={isDeletingAccount}
            >
              <LogOut size={18} color="#FFF" />
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>

            {/* Delete Account Button */}
            <TouchableOpacity
              style={styles.deleteAccountBtn}
              onPress={handleDeleteAccount}
              activeOpacity={0.85}
              disabled={isDeletingAccount}
            >
              <UserMinus size={18} color="#EF4444" />
              <Text style={styles.deleteAccountBtnText}>
                {isDeletingAccount ? 'Deleting Account...' : 'Delete Account'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ════════════════════════════════════════════════════
            TAB 2: PERSONAL PROGRESS
        ════════════════════════════════════════════════════ */}
        {activeTab === 'progress' && (
          <View style={styles.tabContent}>
            {/* Top 2 Stat Cards */}
            <View style={styles.summaryStatsRow}>
              <View style={styles.statSummaryBox}>
                <Text style={styles.statSummaryLabel}>Overall Attendance</Text>
                <Text style={styles.statSummaryVal}>{overallAttendance}%</Text>
                <Text style={styles.statSummarySub}>Last 6 months</Text>
              </View>

              <View style={styles.statSummaryBox}>
                <Text style={styles.statSummaryLabel}>Avg Performance</Text>
                <Text style={styles.statSummaryVal}>{avgPerformance}%</Text>
                <Text style={styles.statSummarySub}>Across courses</Text>
              </View>
            </View>

            {/* Attendance Monthly Chart Card */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Attendance</Text>
                <View style={styles.chartPillRow}>
                  <View style={styles.pillGray}>
                    <Text style={styles.pillGrayText}>Last 6 Months</Text>
                  </View>
                  <View style={styles.pillGreen}>
                    <Text style={styles.pillGreenText}>{overallAttendance}% Overall</Text>
                  </View>
                </View>
              </View>

              {/* Bar Chart Container */}
              <View style={styles.chartInnerWhite}>
                <View style={styles.barChartContainer}>
                  {monthlyAttendance.map((m, idx) => {
                    const barHeightPercent = Math.max(m.percentage, 4);
                    return (
                      <View key={idx} style={styles.barColumn}>
                        <Text style={styles.barTopVal}>
                          {m.percentage > 0 ? `${m.percentage}%` : ''}
                        </Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: `${barHeightPercent}%`,
                                backgroundColor: m.percentage > 0 ? '#54A39A' : '#E2E8F0',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barMonthLabel}>{m.month}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Performance Card */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Performance</Text>
                <View style={styles.pillGray}>
                  <Text style={styles.pillGrayText}>Per Course</Text>
                </View>
              </View>

              <View style={styles.chartInnerWhite}>
                {coursesList.map((c, idx) => (
                  <View key={idx} style={styles.perfRow}>
                    <View style={styles.perfLabelRow}>
                      <Text style={styles.perfCourseName} numberOfLines={1}>
                        {c.course}
                      </Text>
                      <Text style={styles.perfScore}>{c.performance}%</Text>
                    </View>
                    <View style={styles.perfTrack}>
                      <View
                        style={[
                          styles.perfFill,
                          {
                            width: `${Math.max(c.performance, 3)}%`,
                            backgroundColor: c.performance > 0 ? '#295651' : '#CBD5E1',
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Course Table / Cards List */}
            <View style={styles.courseTableWrapper}>
              <View style={styles.courseTableHeaderBar}>
                <Text style={styles.courseTableHeaderTitle}>Course Progress Breakdown</Text>
              </View>

              <View style={styles.courseTableBody}>
                {coursesList.map((course, idx) => (
                  <View key={idx} style={styles.courseCardItem}>
                    <Text style={styles.courseCardTitle}>{course.course}</Text>
                    <View style={styles.courseMetricsGrid}>
                      <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Progress</Text>
                        <Text style={styles.metricVal}>{course.progress}%</Text>
                      </View>

                      <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Attendance</Text>
                        <Text style={styles.metricVal}>{course.attendance}%</Text>
                      </View>

                      <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Performance</Text>
                        <Text
                          style={[
                            styles.metricVal,
                            { color: course.performance > 0 ? '#16A34A' : '#295651' },
                          ]}
                        >
                          {course.performance}%
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 50,
  },

  // ── Tabs ──
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#54A39A',
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },

  // ── Avatar Profile Card ──
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#DEE6E4',
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#DEE6E4',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  // ── Tab Content ──
  tabContent: {
    gap: 12,
  },

  // ── Details Cards ──
  infoCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(41, 86, 81, 0.1)',
  },
  infoLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#295651',
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: '55%',
    textAlign: 'right',
  },

  // ── Badges ──
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeEnabled: {
    backgroundColor: '#DCFCE7',
  },
  badgeDisabled: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textEnabled: {
    color: '#166534',
  },
  textDisabled: {
    color: '#991B1B',
  },

  // ── Sign Out Button ──
  signOutBtn: {
    backgroundColor: '#EF4444',
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  signOutBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },

  // ── Delete Account Button ──
  deleteAccountBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  deleteAccountBtnText: {
    color: '#EF4444',
    fontSize: 14.5,
    fontWeight: '700',
  },

  // ── Summary Stats (Progress Tab) ──
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statSummaryBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statSummaryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  statSummaryVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#295651',
    marginTop: 4,
  },
  statSummarySub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // ── Chart Cards ──
  chartCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  chartPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pillGray: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94A3B8',
    backgroundColor: '#F1F5F9',
  },
  pillGrayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  pillGreen: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  pillGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  chartInnerWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
  },

  // ── Bar Chart ──
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 16,
  },
  barColumn: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 100) / 6,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopVal: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0F766E',
    marginBottom: 3,
  },
  barTrack: {
    width: 20,
    height: 80,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barMonthLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },

  // ── Performance Rows ──
  perfRow: {
    marginBottom: 10,
  },
  perfLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  perfCourseName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
    maxWidth: '78%',
  },
  perfScore: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#295651',
  },
  perfTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  perfFill: {
    height: '100%',
    borderRadius: 4,
  },

  // ── Course Table / Breakdown ──
  courseTableWrapper: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
  },
  courseTableHeaderBar: {
    backgroundColor: '#54A39A',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 10,
  },
  courseTableHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  courseTableBody: {
    gap: 8,
  },
  courseCardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  courseCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#295651',
    marginBottom: 8,
  },
  courseMetricsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(222, 230, 228, 0.45)',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#295651',
  },
});
