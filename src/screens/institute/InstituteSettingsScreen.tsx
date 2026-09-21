import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  User,
  CreditCard,
  Bell,
  Save,
  Upload,
  ShieldCheck,
  CheckCircle,
  Mail,
  Smartphone,
  LogOut,
  RefreshCw,
  ExternalLink,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { fetchInstituteSettings } from '../../store/slices/instituteSlice';
import { instituteApi } from '../../shared/api/instituteApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const InstituteSettingsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { settings, loading } = useAppSelector((state) => state.institute);

  const [activeSection, setActiveSection] = useState<'general' | 'financial' | 'alerts'>('general');
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string>('');
  const [stripeStatus, setStripeStatus] = useState<any>(null);

  const [form, setForm] = useState({
    institutionName: '',
    email: '',
    phoneNumber: '',
    registeredOn: '',
    profileImageUrl: '',
    bankName: '',
    branchName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    razorpayAccountId: '',
    emailAlerts: true,
    whatsappAlerts: false,
  });

  const loadData = useCallback(async () => {
    try {
      const res = await dispatch(fetchInstituteSettings()).unwrap();
      const d = res?.data || res || settings;
      if (d) {
        const config = d.configuration || {};
        const inst = d.institutionDetails || {};
        const admin = d.adminInformation || {};
        const prefs = d.preferences || {};
        const stripe = d.payoutMetadata?.stripe || {};

        setForm({
          institutionName: inst.institutionName || user?.name || 'Global Tech Institute',
          email: config.email || admin.adminEmail || user?.email || 'nihalafathima547@gmail.com',
          phoneNumber: config.phoneNumber || user?.phone || '91 9778113243',
          registeredOn: config.registeredOn ? config.registeredOn.split('T')[0] : '2024-03-16',
          profileImageUrl: config.profileImageUrl || user?.avatar || '',
          bankName: config.bankName || 'HDFC Bank',
          branchName: config.branchName || 'Cyber City Branch',
          accountHolderName: config.accountHolderName || inst.institutionName || user?.name || 'Global Tech Institute',
          accountNumber: config.accountNumber || '•••• •••• •••• 4589',
          ifscCode: config.ifscCode || 'HDFC0001234',
          razorpayAccountId: config.razorpayAccountId || '',
          emailAlerts: prefs.emailAlerts !== false,
          whatsappAlerts: prefs.whatsappAlerts !== false,
        });

        if (stripe?.accountId) {
          setStripeStatus({ connected: true, accountId: stripe.accountId });
        }
      }
    } catch {
      // Fallback
    }

    try {
      const stripeRes = await instituteApi.getStripeStatus();
      if (stripeRes?.success && stripeRes?.data) {
        setStripeStatus(stripeRes.data);
      }
    } catch {
      // ignore
    }
  }, [dispatch, settings, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpdate = async (type: 'general' | 'bank' | 'alerts', customPayload?: any) => {
    setUpdating(type);
    try {
      if (type === 'general') {
        const payload = {
          institutionName: form.institutionName.trim(),
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim(),
          registeredOn: form.registeredOn,
        };
        const res = await instituteApi.updateBasicSettings(payload);
        if (res?.success !== false) {
          Alert.alert('Success', 'Institution identity updated successfully.');
          dispatch(fetchInstituteSettings());
        } else {
          Alert.alert('Error', res?.message || 'Failed to update general settings.');
        }
      } else if (type === 'bank') {
        const payload = {
          bankName: form.bankName.trim(),
          branchName: form.branchName.trim(),
          accountHolderName: form.accountHolderName.trim(),
          accountNumber: form.accountNumber.trim(),
          ifscCode: form.ifscCode.trim().toUpperCase(),
          razorpayAccountId: form.razorpayAccountId.trim(),
        };
        const res = await instituteApi.updateBankSettings(payload);
        if (res?.success !== false) {
          Alert.alert('Success', 'Bank account details updated successfully.');
          dispatch(fetchInstituteSettings());
        } else {
          Alert.alert('Error', res?.message || 'Failed to update bank details.');
        }
      } else if (type === 'alerts') {
        const payload = customPayload || {
          emailAlerts: form.emailAlerts,
          whatsappAlerts: form.whatsappAlerts,
        };
        const res = await instituteApi.updateAlertSettings(payload);
        if (res?.success !== false) {
          dispatch(fetchInstituteSettings());
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Operation failed.');
    } finally {
      setUpdating('');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your account? Your current session will be terminated.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  const navItems = [
    { id: 'general' as const, label: 'General', icon: User },
    { id: 'financial' as const, label: 'Financial', icon: CreditCard },
    { id: 'alerts' as const, label: 'Notifications', icon: Bell },
  ];

  const logoUrl =
    form.profileImageUrl ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      form.institutionName || 'Global Tech'
    )}&background=3E7B74&color=FFFFFF&size=200`;

  return (
    <ScreenContainer>
      {/* Header */}
      <Header
        title="Settings"
        subtitle="Manage your institute profile and digital infrastructure."
        showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
        onBack={() => navigation?.goBack?.()}
        rightAction={
          <TouchableOpacity onPress={onRefresh} style={styles.headerIconBtn}>
            <RefreshCw size={18} color="#1E293B" />
          </TouchableOpacity>
        }
      />

      {/* ─── Navigation Tabs ─── */}
      <View style={styles.navBar}>
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveSection(item.id)}
              style={[styles.navBtn, isActive && styles.navBtnActive]}
              activeOpacity={0.8}
            >
              <IconComp size={15} color={isActive ? '#FFF' : '#64748B'} style={{ marginRight: 6 }} />
              <Text style={[styles.navBtnText, isActive && styles.navBtnTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── Main Content Area ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing && !settings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Syncing your preferences...</Text>
          </View>
        ) : (
          <>
            {/* ══════════════════════════════════════════════
                SECTION 1: GENERAL (Institution Identity)
            ══════════════════════════════════════════════ */}
            {activeSection === 'general' && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Institution Identity</Text>
                    <Text style={styles.sectionSubtitle}>
                      Update your public facing profile information.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => handleUpdate('general')}
                    disabled={updating === 'general'}
                    activeOpacity={0.85}
                  >
                    {updating === 'general' ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Save size={15} color="#FFF" style={{ marginRight: 5 }} />
                        <Text style={styles.saveBtnText}>Save Profile</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Logo Upload Box */}
                <View style={styles.logoSection}>
                  <View style={styles.logoWrapper}>
                    <Image source={{ uri: logoUrl }} style={styles.logoImg} />
                    <TouchableOpacity
                      style={styles.uploadBadge}
                      onPress={() => Alert.alert('Upload Logo', 'Choose image from gallery')}
                      activeOpacity={0.85}
                    >
                      <Upload size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.logoTextWrap}>
                    <Text style={styles.logoTitle}>Institution Logo</Text>
                    <Text style={styles.logoSubtitle}>PNG or JPG, max 5MB.</Text>
                  </View>
                </View>

                {/* Form Fields */}
                <View style={styles.formGrid}>
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>INSTITUTION NAME</Text>
                    <TextInput
                      style={styles.input}
                      value={form.institutionName}
                      onChangeText={(v) => setForm({ ...form, institutionName: v })}
                      placeholder="Academy Ltd"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>SUPPORT EMAIL</Text>
                    <TextInput
                      style={styles.input}
                      value={form.email}
                      onChangeText={(v) => setForm({ ...form, email: v })}
                      placeholder="contact@institute.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                    <TextInput
                      style={styles.input}
                      value={form.phoneNumber}
                      onChangeText={(v) => setForm({ ...form, phoneNumber: v })}
                      placeholder="+1 234 567 890"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>REGISTERED ON</Text>
                    <TextInput
                      style={styles.input}
                      value={form.registeredOn}
                      onChangeText={(v) => setForm({ ...form, registeredOn: v })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════
                SECTION 2: FINANCIAL (Bank Account Details)
            ══════════════════════════════════════════════ */}
            {activeSection === 'financial' && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Bank Account Details</Text>
                    <Text style={styles.sectionSubtitle}>
                      Configure your payout routing and fallback bank details.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.saveBankBtn}
                    onPress={() => handleUpdate('bank')}
                    disabled={updating === 'bank'}
                    activeOpacity={0.85}
                  >
                    {updating === 'bank' ? (
                      <ActivityIndicator size="small" color="#295651" />
                    ) : (
                      <>
                        <Save size={14} color="#295651" style={{ marginRight: 5 }} />
                        <Text style={styles.saveBankBtnText}>Update Bank Info</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Stripe Connect Card */}
                <View style={styles.stripeBox}>
                  <View style={styles.stripeHeaderRow}>
                    <View style={styles.stripeIconWrap}>
                      <CreditCard size={20} color="#635BFF" />
                    </View>
                    <View>
                      <Text style={styles.stripeTitle}>Stripe Connect</Text>
                      <Text style={styles.stripeSubtitle}>Automated Global Payouts</Text>
                    </View>
                  </View>

                  {stripeStatus?.connected || stripeStatus?.accountId ? (
                    <View style={styles.stripeVerifiedRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={styles.verifiedIconWrap}>
                          <ShieldCheck size={20} color="#10B981" />
                        </View>
                        <View>
                          <Text style={styles.verifiedTitle}>Identity Verified</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Text style={styles.stripeIdLabel}>STRIPE ID:</Text>
                            <Text style={styles.stripeIdVal}>
                              {stripeStatus?.accountId || 'acct_1NxY72LJ3ZE13EB5'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.activePayoutBadge}>
                        <CheckCircle size={12} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.activePayoutText}>Payouts Active</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.stripeDesc}>
                        Connect your Stripe account to enable automated payouts and instant settlement.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Bank Fields */}
                <View style={styles.formGrid}>
                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>BANK NAME</Text>
                    <TextInput
                      style={styles.input}
                      value={form.bankName}
                      onChangeText={(v) => setForm({ ...form, bankName: v })}
                      placeholder="National Bank"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>BRANCH</Text>
                    <TextInput
                      style={styles.input}
                      value={form.branchName}
                      onChangeText={(v) => setForm({ ...form, branchName: v })}
                      placeholder="City Center"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>ACCOUNT HOLDER</Text>
                    <TextInput
                      style={styles.input}
                      value={form.accountHolderName}
                      onChangeText={(v) => setForm({ ...form, accountHolderName: v })}
                      placeholder="Full Name"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>ACCOUNT NUMBER</Text>
                    <TextInput
                      style={styles.input}
                      value={form.accountNumber}
                      onChangeText={(v) => setForm({ ...form, accountNumber: v })}
                      placeholder="0000 0000 0000"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>IFSC CODE</Text>
                    <TextInput
                      style={styles.input}
                      value={form.ifscCode}
                      onChangeText={(v) => setForm({ ...form, ifscCode: v.toUpperCase() })}
                      placeholder="BANK000123"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>RAZORPAY / STRIPE ACCOUNT ID</Text>
                    <TextInput
                      style={styles.input}
                      value={form.razorpayAccountId}
                      onChangeText={(v) => setForm({ ...form, razorpayAccountId: v })}
                      placeholder="acc_..."
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* ══════════════════════════════════════════════
                SECTION 3: NOTIFICATIONS (Preferences)
            ══════════════════════════════════════════════ */}
            {activeSection === 'alerts' && (
              <View style={styles.card}>
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.sectionTitle}>Notification Preferences</Text>
                  <Text style={styles.sectionSubtitle}>
                    Configure how we reach out for system events.
                  </Text>
                </View>

                {/* Preference Toggle 1: Email Dispatch */}
                <View style={styles.toggleCard}>
                  <View style={styles.toggleLeft}>
                    <View style={styles.toggleIconWrap}>
                      <Mail size={22} color="#3E7B74" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>Email Dispatch</Text>
                      <Text style={styles.toggleDesc}>
                        Critical enrollment and platform updates.
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.switchTrack, form.emailAlerts && styles.switchTrackActive]}
                    onPress={() => {
                      const next = !form.emailAlerts;
                      setForm({ ...form, emailAlerts: next });
                      handleUpdate('alerts', {
                        emailAlerts: next,
                        whatsappAlerts: form.whatsappAlerts,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[styles.switchThumb, form.emailAlerts && styles.switchThumbActive]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Preference Toggle 2: WhatsApp Node */}
                <View style={styles.toggleCard}>
                  <View style={styles.toggleLeft}>
                    <View style={styles.toggleIconWrap}>
                      <Smartphone size={22} color="#3E7B74" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>WhatsApp Node</Text>
                      <Text style={styles.toggleDesc}>
                        Real-time mobile alerts for instant actions.
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.switchTrack, form.whatsappAlerts && styles.switchTrackActive]}
                    onPress={() => {
                      const next = !form.whatsappAlerts;
                      setForm({ ...form, whatsappAlerts: next });
                      handleUpdate('alerts', {
                        emailAlerts: form.emailAlerts,
                        whatsappAlerts: next,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[styles.switchThumb, form.whatsappAlerts && styles.switchThumbActive]}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ─── Bottom Logout Action ─── */}
            <View style={styles.logoutCard}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={styles.logoutBtnText}>Logout Session</Text>
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
  headerIconBtn: {
    padding: 8,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  navBtnActive: {
    backgroundColor: '#3E7B74',
    shadowColor: '#3E7B74',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  navBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  navBtnTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  scroll: {
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
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E7B74',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#3E7B74',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  saveBankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEE6E4',
    borderWidth: 1,
    borderColor: 'rgba(41, 86, 81, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBankBtnText: {
    color: '#295651',
    fontSize: 11.5,
    fontWeight: '800',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'visible',
    position: 'relative',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'contain',
  },
  uploadBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#3E7B74',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  logoTextWrap: {
    flex: 1,
  },
  logoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  logoSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  formGrid: {
    gap: 14,
  },
  fieldWrap: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  stripeBox: {
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFF6FF',
    padding: 14,
    marginBottom: 16,
  },
  stripeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  stripeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  stripeSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stripeVerifiedRow: {
    flexDirection: 'column',
    gap: 10,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  verifiedIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  stripeIdLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
  },
  stripeIdVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'monospace',
  },
  activePayoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activePayoutText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stripeDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  toggleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  toggleDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  switchTrack: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CBD5E1',
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: '#3E7B74',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  logoutCard: {
    marginTop: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
