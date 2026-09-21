import React, { useState, useEffect } from 'react';
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
  Switch,
  Dimensions,
  Linking,
} from 'react-native';
import {
  User,
  CreditCard,
  Mail,
  Save,
  Upload,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import {
  fetchTutorProfile,
  updateTutorProfile,
  updateTutorBank,
  updateTutorNotifications,
} from '../../store/slices/tutorSlice';

const { width: SCREEN_W } = Dimensions.get('window');

export const TutorSettingsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { profile, profileLoading } = useAppSelector((state) => state.tutor);

  const [activeSection, setActiveSection] = useState<'general' | 'financial' | 'notifications'>('general');
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');

  // Financial states
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  useEffect(() => {
    dispatch(fetchTutorProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      const s = profile.courseCreatorSettings || {};
      setName(profile.name || user?.name || '');
      setEmail(profile.email || user?.email || '');
      setPhoneNumber(profile.phoneNumber || user?.phone || '');
      setGender(s.gender || '');
      setNationality(s.nationality || '');

      setBankName(s.bankName || '');
      setBranchName(s.branchName || '');
      setAccountHolderName(s.accountHolderName || '');
      setAccountNumber(s.accountNumber || '');
      setIfscCode(s.ifscCode || '');

      setEmailAlerts(s.emailAlerts !== false);
      setWhatsappAlerts(s.whatsappAlerts === true);
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await dispatch(
        updateTutorProfile({
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          gender: gender.trim(),
          nationality: nationality.trim(),
        })
      ).unwrap();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBank = async () => {
    setSaving(true);
    try {
      await dispatch(
        updateTutorBank({
          bankName: bankName.trim(),
          branchName: branchName.trim(),
          accountHolderName: accountHolderName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
        })
      ).unwrap();
      Alert.alert('Success', 'Bank details saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to update bank details');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (key: 'email' | 'whatsapp', val: boolean) => {
    if (key === 'email') setEmailAlerts(val);
    if (key === 'whatsapp') setWhatsappAlerts(val);

    try {
      await dispatch(
        updateTutorNotifications({
          emailAlerts: key === 'email' ? val : emailAlerts,
          whatsappAlerts: key === 'whatsapp' ? val : whatsappAlerts,
        })
      ).unwrap();
    } catch {
      // Revert on failure
      if (key === 'email') setEmailAlerts(!val);
      if (key === 'whatsapp') setWhatsappAlerts(!val);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout Session', 'Are you sure you want to log out from Edorapad?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  const navTabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'financial', label: 'Financial', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Mail },
  ] as const;

  const profilePic =
    profile?.profilePicUrl ||
    profile?.courseCreatorSettings?.profilePicUrl ||
    (user as any)?.avatar;

  return (
    <View style={styles.root}>
      <Header
        title="Settings"
        subtitle="Manage your tutor profile and preferences."
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Navigation Tabs matching screenshot 4 */}
        <View style={styles.navCard}>
          {navTabs.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.navBtn, isActive && styles.navBtnActive]}
                onPress={() => setActiveSection(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.navBtnLeft}>
                  <IconComponent size={18} color={isActive ? '#FFFFFF' : '#334155'} />
                  <Text style={[styles.navBtnText, isActive && styles.navBtnTextActive]}>
                    {item.label}
                  </Text>
                </View>
                <ChevronRight size={16} color={isActive ? '#FFFFFF' : '#94A3B8'} />
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => Linking.openURL('https://www.app.edorapad.com/privacy-policy')}
            activeOpacity={0.8}
          >
            <View style={styles.navBtnLeft}>
              <ShieldCheck size={18} color="#3E7B74" />
              <Text style={styles.navBtnText}>Privacy Policy</Text>
            </View>
            <ExternalLink size={15} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={styles.navBtnLeft}>
              <LogOut size={18} color="#EF4444" />
              <Text style={styles.logoutBtnText}>Logout Session</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── SECTION 1: GENERAL (TUTOR PROFILE) ─── */}
        {activeSection === 'general' && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Tutor Profile</Text>
                <Text style={styles.cardSub}>Update your personal information.</Text>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={15} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Save Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Profile Picture Box */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarPreviewBox}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {(name || 'T').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.uploadBadge}>
                  <Upload size={12} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.avatarMeta}>
                <Text style={styles.avatarTitle}>Profile Picture</Text>
                <Text style={styles.avatarSub}>PNG or JPG, max 5MB.</Text>
              </View>
            </View>

            {/* Inputs */}
            <View style={styles.formList}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter full name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL</Text>
                <TextInput
                  style={[styles.textInput, styles.textInputDisabled]}
                  value={email}
                  editable={false}
                  placeholder="Email"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PHONE NUMBER</Text>
                <TextInput
                  style={styles.textInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GENDER</Text>
                <TextInput
                  style={styles.textInput}
                  value={gender}
                  onChangeText={setGender}
                  placeholder="e.g. Male / Female / Other"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NATIONALITY</Text>
                <TextInput
                  style={styles.textInput}
                  value={nationality}
                  onChangeText={setNationality}
                  placeholder="e.g. Indian"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>
        )}

        {/* ─── SECTION 2: FINANCIAL ─── */}
        {activeSection === 'financial' && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Financial Details</Text>
                <Text style={styles.cardSub}>Bank and payout settings.</Text>
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveBank}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Save size={15} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Save Details</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.formList}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BANK NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="e.g. HDFC Bank"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BRANCH NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={branchName}
                  onChangeText={setBranchName}
                  placeholder="e.g. Main Branch"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ACCOUNT HOLDER NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountHolderName}
                  onChangeText={setAccountHolderName}
                  placeholder="Account holder's full name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ACCOUNT NUMBER</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Bank account number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IFSC CODE</Text>
                <TextInput
                  style={styles.textInput}
                  value={ifscCode}
                  onChangeText={setIfscCode}
                  placeholder="e.g. HDFC0001234"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>
        )}

        {/* ─── SECTION 3: NOTIFICATIONS ─── */}
        {activeSection === 'notifications' && (
          <View style={styles.contentCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Notifications</Text>
                <Text style={styles.cardSub}>Manage your communication alerts.</Text>
              </View>
            </View>

            <View style={styles.toggleList}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Email Alerts</Text>
                  <Text style={styles.toggleSub}>Receive class updates and alerts via email.</Text>
                </View>
                <Switch
                  value={emailAlerts}
                  onValueChange={(val) => handleToggleNotification('email', val)}
                  trackColor={{ false: '#CBD5E1', true: '#3E7B74' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>WhatsApp Alerts</Text>
                  <Text style={styles.toggleSub}>Receive urgent notifications on WhatsApp.</Text>
                </View>
                <Switch
                  value={whatsappAlerts}
                  onValueChange={(val) => handleToggleNotification('whatsapp', val)}
                  trackColor={{ false: '#CBD5E1', true: '#3E7B74' }}
                  thumbColor="#FFFFFF"
                />
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
    backgroundColor: '#F8FAFB',
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  navCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    marginBottom: 20,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  navBtnActive: {
    backgroundColor: '#3E7B74',
  },
  navBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  navBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logoutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },

  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 30,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3E7B74',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatarPreviewBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'visible',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: '#334155',
  },
  uploadBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3E7B74',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarMeta: {
    flex: 1,
  },
  avatarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  avatarSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  formList: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  textInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },

  toggleList: {
    gap: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  toggleSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
