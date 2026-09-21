import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  User,
  CreditCard,
  Mail,
  Phone,
  Calendar,
  Globe,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTutorProfile } from '../../store/slices/tutorSlice';

const { width: SCREEN_W } = Dimensions.get('window');

export const TutorProfileScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { profile, profileLoading } = useAppSelector((state) => state.tutor);

  const [activeTab, setActiveTab] = useState<'personal' | 'info'>('personal');

  useEffect(() => {
    dispatch(fetchTutorProfile());
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchTutorProfile());
  };

  const s = profile?.courseCreatorSettings;

  const tutorName = profile?.name || user?.name || 'Tutor';
  const tutorEmail = profile?.email || user?.email || 'tutor@edorapad.com';
  const profilePic = profile?.profilePicUrl || s?.profilePicUrl || (user as any)?.avatar;

  const basicInfo = {
    'Full Name': tutorName,
    'Email': tutorEmail,
    'Phone Number': profile?.phoneNumber || user?.phone || 'N/A',
    'Staff ID': profile?.staffId || (profile as any)?.customId || 'N/A',
    'Role': profile?.role || user?.role || 'Tutor',
  };

  const personalDetails = {
    'Gender': s?.gender || 'N/A',
    'Nationality': s?.nationality || 'N/A',
    'Date of Birth': s?.dob ? new Date(s.dob).toLocaleDateString() : 'N/A',
  };

  const preferences = {
    'Email Alerts': s?.emailAlerts !== false ? 'Enabled' : 'Disabled',
    'SMS Alerts': s?.smsAlerts ? 'Enabled' : 'Disabled',
    'WhatsApp Alerts': s?.whatsappAlerts ? 'Enabled' : 'Disabled',
  };

  const bankDetails = {
    'Bank Name': s?.bankName || 'N/A',
    'Branch Name': s?.branchName || 'N/A',
    'Account Holder': s?.accountHolderName || 'N/A',
    'Account Number': s?.accountNumber || 'N/A',
    'IFSC Code': s?.ifscCode || 'N/A',
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <Header
        title="Profile"
        subtitle="Home > Profile"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Tabs matching web screenshot 3 */}
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
          style={[styles.tabBtn, activeTab === 'info' && styles.tabBtnActive]}
          onPress={() => setActiveTab('info')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'info' && styles.tabBtnTextActive]}>
            Payment Info
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={profileLoading}
            onRefresh={onRefresh}
            tintColor="#3E7B74"
          />
        }
      >
        {profileLoading && !profile ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#3E7B74" />
            <Text style={styles.loadingText}>Loading profile data from server...</Text>
          </View>
        ) : (
          <View style={styles.profileCard}>
            {/* Top Avatar & Name Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrap}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {tutorName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.profileName}>{tutorName}</Text>
              <Text style={styles.profileEmail}>{tutorEmail}</Text>
            </View>

            {/* Tab: Personal Details */}
            {activeTab === 'personal' ? (
              <View style={styles.detailsContainer}>
                {/* Basic Information Card */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Basic Information</Text>
                  <View style={styles.infoList}>
                    {Object.entries(basicInfo).map(([label, val]) => (
                      <View key={label} style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{label} :</Text>
                        <Text style={styles.infoVal}>{val}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Personal Details Card */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Personal Details</Text>
                  <View style={styles.infoList}>
                    {Object.entries(personalDetails).map(([label, val]) => (
                      <View key={label} style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{label} :</Text>
                        <Text style={styles.infoVal}>{val}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Preferences Card */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Preferences</Text>
                  <View style={styles.infoList}>
                    {Object.entries(preferences).map(([label, val]) => {
                      const isEnabled = val === 'Enabled';
                      return (
                        <View key={label} style={styles.infoRow}>
                          <Text style={styles.infoLabel}>{label}</Text>
                          <Text
                            style={[
                              styles.prefVal,
                              isEnabled ? { color: '#16A34A' } : { color: '#64748B' },
                            ]}
                          >
                            {val}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : (
              /* Tab: Payment Info */
              <View style={styles.detailsContainer}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Bank Details</Text>
                  <View style={styles.infoList}>
                    {Object.entries(bankDetails).map(([label, val]) => (
                      <View key={label} style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{label} :</Text>
                        <Text style={styles.infoVal}>{val}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  tabBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#54A39A',
  },
  tabBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    backgroundColor: '#DEE6E4',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3E7B74',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: '#295651',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
  },
  detailsContainer: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: 12,
    padding: 18,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 14,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#295651',
  },
  infoVal: {
    fontSize: 13,
    color: '#295651',
    fontWeight: '500',
  },
  prefVal: {
    fontSize: 13,
    fontWeight: '700',
  },
});
