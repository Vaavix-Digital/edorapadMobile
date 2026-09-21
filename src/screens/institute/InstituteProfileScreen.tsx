import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Building2,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Shield,
  Bell,
  LogOut,
  Settings,
  RefreshCw,
  CheckCircle,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchInstituteSettings } from '../../store/slices/instituteSlice';
import { logoutUser } from '../../store/slices/authSlice';

export const InstituteProfileScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { settings, loading } = useAppSelector((state) => state.institute);

  const [activeTab, setActiveTab] = useState<'personal' | 'payment'>('personal');
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async () => {
    await dispatch(fetchInstituteSettings());
  }, [dispatch]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

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

  // Safe mapping matching web src/pages/institute/profile/Profile.jsx
  const {
    institutionDetails,
    adminInformation,
    payoutMetadata,
    preferences,
    configuration,
  } = settings || {};

  const instituteName =
    institutionDetails?.institutionName ||
    user?.name ||
    'Global Tech Institute';

  const adminEmail =
    configuration?.email ||
    adminInformation?.adminEmail ||
    user?.email ||
    'nihalafathima547@gmail.com';

  const profileImageUrl =
    configuration?.profileImageUrl ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      instituteName
    )}&background=3E7B74&color=FFFFFF&size=200`;

  const registeredDateFormatted = configuration?.registeredOn
    ? new Date(configuration.registeredOn).toLocaleDateString()
    : '3/16/2024';

  const phoneNumber = configuration?.phoneNumber || user?.phone || '91 9778113243';
  const roleTitle = adminInformation?.role || 'Institute';
  const designation = adminInformation?.designation || 'Principal';

  // Bank & Payout
  const bankName = configuration?.bankName || 'HDFC Bank';
  const branchName = configuration?.branchName || 'Cyber City Branch';
  const accountHolder = configuration?.accountHolderName || instituteName;
  const accountNumber = configuration?.accountNumber || '•••• •••• •••• 4589';
  const ifscCode = configuration?.ifscCode || 'HDFC0001234';
  const payoutMode = payoutMetadata?.payoutMode || 'STRIPE';
  const stripeId = payoutMetadata?.stripe?.accountId || 'acct_1NxY72LJ3ZE13EB5';

  // Preferences
  const emailAlertsEnabled = preferences?.emailAlerts !== false;
  const smsAlertsEnabled =
    preferences?.whatsappAlerts !== false && preferences?.smsAlerts !== false;

  return (
    <ScreenContainer>
      {/* Header */}
      <Header
        title="Profile"
        subtitle="Institution details & payment info"
        showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
        onBack={() => navigation?.goBack?.()}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation?.navigate?.('Settings')}
              style={styles.headerIconBtn}
            >
              <Settings size={18} color="#1E293B" />
            </TouchableOpacity>
            <TouchableOpacity onPress={loadProfile} style={styles.headerIconBtn}>
              <RefreshCw size={18} color="#1E293B" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'personal' && styles.tabButtonActive]}
          onPress={() => setActiveTab('personal')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'personal' && styles.tabButtonTextActive,
            ]}
          >
            Institution Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'payment' && styles.tabButtonActive]}
          onPress={() => setActiveTab('payment')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'payment' && styles.tabButtonTextActive,
            ]}
          >
            Payment Info
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing && !settings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Retrieving profile intelligence...</Text>
          </View>
        ) : (
          <>
            {/* ── Center Avatar & Institute Banner ── */}
            <View style={styles.bannerContainer}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: profileImageUrl }}
                  style={styles.avatarImage}
                  defaultSource={{ uri: profileImageUrl }}
                />
              </View>
              <Text style={styles.instituteTitle}>{instituteName}</Text>
              <Text style={styles.instituteEmail}>{adminEmail}</Text>
            </View>

            {/* ══════════════════════════════════════════════
                TAB 1: INSTITUTION DETAILS
            ══════════════════════════════════════════════ */}
            {activeTab === 'personal' && (
              <View style={styles.tabContent}>
                {/* 1. Basic Information Card */}
                <View style={styles.greenCard}>
                  <Text style={styles.cardHeaderTitle}>Basic Information</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Institute Name :</Text>
                    <Text style={styles.infoValue}>{instituteName}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Registered On :</Text>
                    <Text style={styles.infoValue}>{registeredDateFormatted}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone Number :</Text>
                    <Text style={styles.infoValue}>{phoneNumber}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email :</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {adminEmail}
                    </Text>
                  </View>
                </View>

                {/* 2. Admin Information Card */}
                <View style={styles.greenCard}>
                  <Text style={styles.cardHeaderTitle}>Admin Information</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Role :</Text>
                    <Text style={styles.infoValue}>{roleTitle}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Designation :</Text>
                    <Text style={styles.infoValue}>{designation}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Institution :</Text>
                    <Text style={styles.infoValue}>{instituteName}</Text>
                  </View>
                </View>

                {/* 3. Preferences Card */}
                <View style={styles.greenCard}>
                  <Text style={styles.cardHeaderTitle}>Preferences</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email Notifications</Text>
                    <Text style={styles.infoValue}>
                      {emailAlertsEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Sms Alerts</Text>
                    <Text style={styles.infoValue}>
                      {smsAlertsEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════
                TAB 2: PAYMENT INFO
            ══════════════════════════════════════════════ */}
            {activeTab === 'payment' && (
              <View style={styles.tabContent}>
                {/* Bank Details Card */}
                <View style={styles.greenCard}>
                  <Text style={styles.cardHeaderTitle}>Bank Details</Text>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Bank Name :</Text>
                    <Text style={styles.infoValue}>{bankName}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Branch Name :</Text>
                    <Text style={styles.infoValue}>{branchName}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Account Holder :</Text>
                    <Text style={styles.infoValue}>{accountHolder}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Account Number :</Text>
                    <Text style={styles.infoValue}>{accountNumber}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>IFSC Code :</Text>
                    <Text style={styles.infoValue}>{ifscCode}</Text>
                  </View>

                  {/* Payout Mode & Stripe ID Sub-section */}
                  <View style={styles.payoutSubSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.payoutMetaLabel}>PAYOUT MODE :</Text>
                      <Text style={styles.payoutMetaValue}>{payoutMode}</Text>
                    </View>
                    <View style={[styles.infoRow, { marginTop: 4 }]}>
                      <Text style={styles.payoutMetaLabel}>STRIPE ID :</Text>
                      <Text style={styles.payoutMetaValue}>{stripeId}</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ─── Footer Action: Sign Out ─── */}
            <View style={styles.footerWrap}>
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <LogOut size={16} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={styles.signOutBtnText}>Sign Out from Institute Portal</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  tabButtonActive: {
    borderBottomColor: '#3E7B74',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#1A202C',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
  },
  bannerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#3E7B74',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  instituteTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 2,
    textAlign: 'center',
  },
  instituteEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  tabContent: {
    gap: 14,
  },
  greenCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CCD8D5',
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#295651',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#295651',
    flex: 1,
    textAlign: 'right',
  },
  payoutSubSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(41, 86, 81, 0.25)',
  },
  payoutMetaLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#295651',
    letterSpacing: 0.5,
  },
  payoutMetaValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#295651',
    textAlign: 'right',
  },
  footerWrap: {
    marginTop: 20,
    alignItems: 'center',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  signOutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
