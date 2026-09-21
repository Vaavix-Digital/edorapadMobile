import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Flag,
  CreditCard,
  Building2,
  Bell,
  CheckCircle2,
  Shield,
  Edit3,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchAccountSettings } from '../../store/slices/accountSlice';

function getInitial(name: string = '') {
  return (
    name
      .trim()
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'S'
  );
}

const formatImageUrl = (url?: string | null) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return `https://server.edorapad.com${trimmed}`;
  }
  return `https://server.edorapad.com/${trimmed}`;
};

export const AccountsProfileScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'personal' | 'bank'>('personal');
  const [refreshing, setRefreshing] = useState(false);

  const { settings, settingsLoading } = useAppSelector((state) => state.account);
  const { user } = useAppSelector((state) => state.auth);

  const loadData = async () => {
    await dispatch(fetchAccountSettings());
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const displayName = settings?.name || user?.name || 'Shrihari Nambiar p';
  const displayEmail = settings?.email || user?.email || 'shrihari1056@gmail.com';
  const displayPhone = settings?.phoneNumber || user?.phone || '+91 9106163467';
  const displayDob = settings?.dob
    ? new Date(settings.dob).toLocaleDateString('en-GB')
    : '15/08/1996';
  const displayGender = settings?.gender || 'Male';
  const displayNationality = settings?.nationality || 'Indian';
  const profilePicUrl = formatImageUrl(settings?.profilePicUrl || (user as any)?.profilePicUrl);

  const bank = settings?.bankDetails || {};
  const alerts = settings?.alerts || { emailAlerts: true, smsAlerts: false, whatsappAlerts: true };

  return (
    <ScreenContainer style={styles.container}>
      {/* Header */}
      <Header
        title="Profile"
        subtitle="Personal details & account information"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'personal' && styles.tabBtnActive]}
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'personal' && styles.tabBtnTextActive]}>
            Personal Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'bank' && styles.tabBtnActive]}
          onPress={() => setActiveTab('bank')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'bank' && styles.tabBtnTextActive]}>
            Bank & Preferences
          </Text>
        </TouchableOpacity>
      </View>

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
        {settingsLoading && !settings ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#4EA397" />
            <Text style={styles.loadingText}>Fetching profile details...</Text>
          </View>
        ) : (
          <>
            {/* Top Profile Card */}
            <View style={styles.profileHeroCard}>
              <View style={styles.avatarContainer}>
                {profilePicUrl ? (
                  <Image source={{ uri: profilePicUrl }} style={styles.avatarImg} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitialText}>{getInitial(displayName)}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.profileNameText}>{displayName}</Text>
              <Text style={styles.profileEmailText}>{displayEmail}</Text>

              <View style={styles.roleBadge}>
                <Shield size={12} color="#295651" />
                <Text style={styles.roleBadgeText}>Accounts & Marketing</Text>
              </View>
            </View>

            {/* TAB 1: PERSONAL DETAILS */}
            {activeTab === 'personal' && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                  <TouchableOpacity
                    style={styles.editLinkBtn}
                    onPress={() => navigation.navigate('AccountsSettings')}
                  >
                    <Edit3 size={13} color="#295651" />
                    <Text style={styles.editLinkText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoList}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelGroup}>
                      <User size={15} color="#657B76" />
                      <Text style={styles.infoLabel}>Full Name</Text>
                    </View>
                    <Text style={styles.infoValue}>{displayName}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelGroup}>
                      <Phone size={15} color="#657B76" />
                      <Text style={styles.infoLabel}>Phone Number</Text>
                    </View>
                    <Text style={styles.infoValue}>{displayPhone}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelGroup}>
                      <Mail size={15} color="#657B76" />
                      <Text style={styles.infoLabel}>Email</Text>
                    </View>
                    <Text style={styles.infoValue}>{displayEmail}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelGroup}>
                      <Calendar size={15} color="#657B76" />
                      <Text style={styles.infoLabel}>Date of Birth</Text>
                    </View>
                    <Text style={styles.infoValue}>{displayDob}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoLabelGroup}>
                      <User size={15} color="#657B76" />
                      <Text style={styles.infoLabel}>Gender</Text>
                    </View>
                    <Text style={styles.infoValue}>{displayGender}</Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <View style={styles.infoLabelGroup}>
                      <Flag size={15} color="#657B76" />
                      <Text style={styles.infoLabel}>Nationality</Text>
                    </View>
                    <Text style={styles.infoValue}>{displayNationality}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 2: BANK DETAILS & PREFERENCES */}
            {activeTab === 'bank' && (
              <>
                {/* Bank Details Card */}
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Bank & Payout Details</Text>
                    <TouchableOpacity
                      style={styles.editLinkBtn}
                      onPress={() => navigation.navigate('AccountsSettings')}
                    >
                      <Edit3 size={13} color="#295651" />
                      <Text style={styles.editLinkText}>Edit</Text>
                    </TouchableOpacity>
                  </View>

                  {settings?.payoutMetadata?.payoutMode === 'AUTOMATED' ? (
                    <View style={styles.automatedPayoutBox}>
                      <CheckCircle2 size={20} color="#16A34A" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.automatedTitle}>Stripe Automated Payouts</Text>
                        <Text style={styles.automatedSub}>Direct account deposit enabled</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.infoList}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Bank Name</Text>
                        <Text style={styles.infoValue}>{bank.bankName || 'State Bank of India'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Branch Name</Text>
                        <Text style={styles.infoValue}>{bank.branchName || 'MG Road Branch'}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Account Holder</Text>
                        <Text style={styles.infoValue}>{bank.accountHolderName || displayName}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Account Number</Text>
                        <Text style={styles.infoValue}>
                          {bank.accountNumber ? `•••• •••• ${bank.accountNumber.slice(-4)}` : '•••• •••• 4920'}
                        </Text>
                      </View>
                      <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                        <Text style={styles.infoLabel}>IFSC Code</Text>
                        <Text style={styles.infoValue}>{bank.ifscCode || 'SBIN0001824'}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Preferences Card */}
                <View style={[styles.sectionCard, { marginTop: 14 }]}>
                  <Text style={styles.sectionTitle}>Notification Alerts</Text>
                  <View style={styles.infoList}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email Notifications</Text>
                      <View style={[styles.statusBadge, alerts.emailAlerts ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.statusBadgeText, alerts.emailAlerts ? styles.badgeTextActive : styles.badgeTextInactive]}>
                          {alerts.emailAlerts ? 'Enabled' : 'Disabled'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>SMS Alerts</Text>
                      <View style={[styles.statusBadge, alerts.smsAlerts ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.statusBadgeText, alerts.smsAlerts ? styles.badgeTextActive : styles.badgeTextInactive]}>
                          {alerts.smsAlerts ? 'Enabled' : 'Disabled'}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.infoLabel}>WhatsApp Alerts</Text>
                      <View style={[styles.statusBadge, alerts.whatsappAlerts ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.statusBadgeText, alerts.whatsappAlerts ? styles.badgeTextActive : styles.badgeTextInactive]}>
                          {alerts.whatsappAlerts ? 'Enabled' : 'Disabled'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F6',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#DEE6E4',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#3E7874',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#546E68',
  },
  tabBtnTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#657B76',
  },
  profileHeroCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2EAE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#DEE6E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3E7874',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  profileNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#243029',
    textAlign: 'center',
  },
  profileEmailText: {
    fontSize: 13,
    color: '#657B76',
    marginTop: 2,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 10,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#295651',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2EAE7',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F2',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#243029',
  },
  editLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DEE6E4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#295651',
  },
  infoList: {},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8F8',
  },
  infoLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#657B76',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#243029',
  },
  automatedPayoutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 12,
    borderRadius: 10,
  },
  automatedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  automatedSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#16A34A',
  },
  badgeTextInactive: {
    color: '#9CA3AF',
  },
});
