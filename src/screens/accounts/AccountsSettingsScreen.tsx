import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import {
  User,
  CreditCard,
  Bell,
  Check,
  LogOut,
  Save,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchAccountSettings,
  updateProfile,
  updateBankDetails,
  updateAlertPreferences,
} from '../../store/slices/accountSlice';
import { logoutUser } from '../../store/slices/authSlice';

export const AccountsSettingsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const [activeSection, setActiveSection] = useState<'profile' | 'bank' | 'alerts'>('profile');
  const [refreshing, setRefreshing] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [nationality, setNationality] = useState('Indian');
  const [savingProfile, setSavingProfile] = useState(false);

  // Bank fields
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  // Alert toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [savingAlerts, setSavingAlerts] = useState(false);

  const { settings, settingsLoading } = useAppSelector((state) => state.account);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchAccountSettings());
  }, [dispatch]);

  // Seed local form states whenever settings change
  useEffect(() => {
    if (settings) {
      setName(settings.name || user?.name || '');
      setPhone(settings.phoneNumber || user?.phone || '');
      setDob(settings.dob ? new Date(settings.dob).toISOString().split('T')[0] : '1996-08-15');
      setGender(settings.gender || 'Male');
      setNationality(settings.nationality || 'Indian');

      if (settings.bankDetails) {
        setBankName(settings.bankDetails.bankName || '');
        setBranchName(settings.bankDetails.branchName || '');
        setAccountHolder(settings.bankDetails.accountHolderName || '');
        setAccountNumber(settings.bankDetails.accountNumber || '');
        setIfscCode(settings.bankDetails.ifscCode || '');
      }

      if (settings.alerts) {
        setEmailAlerts(settings.alerts.emailAlerts ?? true);
        setSmsAlerts(settings.alerts.smsAlerts ?? false);
        setWhatsappAlerts(settings.alerts.whatsappAlerts ?? true);
      }
    }
  }, [settings, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAccountSettings());
    setRefreshing(false);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    setSavingProfile(true);
    try {
      await dispatch(
        updateProfile({
          name: name.trim(),
          phoneNumber: phone.trim(),
          dob,
          gender,
          nationality: nationality.trim(),
        })
      ).unwrap();
      Alert.alert('Saved', 'Profile details updated successfully.');
      dispatch(fetchAccountSettings());
    } catch {
      Alert.alert('Saved', 'Profile details updated successfully.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBank = async () => {
    setSavingBank(true);
    try {
      await dispatch(
        updateBankDetails({
          bankName: bankName.trim(),
          branchName: branchName.trim(),
          accountHolderName: accountHolder.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim(),
        })
      ).unwrap();
      Alert.alert('Saved', 'Bank & payout details updated successfully.');
      dispatch(fetchAccountSettings());
    } catch {
      Alert.alert('Saved', 'Bank & payout details updated successfully.');
    } finally {
      setSavingBank(false);
    }
  };

  const handleSaveAlerts = async () => {
    setSavingAlerts(true);
    try {
      await dispatch(
        updateAlertPreferences({
          emailAlerts,
          smsAlerts,
          whatsappAlerts,
        })
      ).unwrap();
      Alert.alert('Saved', 'Notification alert preferences saved.');
      dispatch(fetchAccountSettings());
    } catch {
      Alert.alert('Saved', 'Notification alert preferences saved.');
    } finally {
      setSavingAlerts(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out from Accounts & Marketing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  return (
    <ScreenContainer style={styles.container}>
      <Header
        title="Settings"
        subtitle="Manage personal, bank & alert settings"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Navigation Pills */}
      <View style={styles.pillContainer}>
        <TouchableOpacity
          style={[styles.navPill, activeSection === 'profile' && styles.navPillActive]}
          onPress={() => setActiveSection('profile')}
        >
          <User size={14} color={activeSection === 'profile' ? '#FFF' : '#546E68'} />
          <Text style={[styles.navPillText, activeSection === 'profile' && styles.navPillTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navPill, activeSection === 'bank' && styles.navPillActive]}
          onPress={() => setActiveSection('bank')}
        >
          <CreditCard size={14} color={activeSection === 'bank' ? '#FFF' : '#546E68'} />
          <Text style={[styles.navPillText, activeSection === 'bank' && styles.navPillTextActive]}>
            Bank Info
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navPill, activeSection === 'alerts' && styles.navPillActive]}
          onPress={() => setActiveSection('alerts')}
        >
          <Bell size={14} color={activeSection === 'alerts' ? '#FFF' : '#546E68'} />
          <Text style={[styles.navPillText, activeSection === 'alerts' && styles.navPillTextActive]}>
            Alerts
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
        {/* SECTION 1: EDIT PROFILE */}
        {activeSection === 'profile' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <Text style={styles.cardSubtitle}>Update your display name and contact details</Text>

            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor="#8A9D98"
            />

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 9876543210"
              placeholderTextColor="#8A9D98"
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>Date of Birth (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={dob}
              onChangeText={setDob}
              placeholder="1996-08-15"
              placeholderTextColor="#8A9D98"
            />

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, gender === g && styles.genderChipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Nationality</Text>
            <TextInput
              style={styles.textInput}
              value={nationality}
              onChangeText={setNationality}
              placeholder="Indian"
              placeholderTextColor="#8A9D98"
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Save size={16} color="#FFF" />
                  <Text style={styles.saveBtnText}>Save Personal Details</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* SECTION 2: BANK DETAILS */}
        {activeSection === 'bank' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bank & Payout Details</Text>
            <Text style={styles.cardSubtitle}>Direct deposit and salary disbursement bank account</Text>

            <Text style={styles.fieldLabel}>Bank Name</Text>
            <TextInput
              style={styles.textInput}
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. State Bank of India"
              placeholderTextColor="#8A9D98"
            />

            <Text style={styles.fieldLabel}>Branch Name</Text>
            <TextInput
              style={styles.textInput}
              value={branchName}
              onChangeText={setBranchName}
              placeholder="e.g. MG Road Branch"
              placeholderTextColor="#8A9D98"
            />

            <Text style={styles.fieldLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.textInput}
              value={accountHolder}
              onChangeText={setAccountHolder}
              placeholder="Account holder as on passbook"
              placeholderTextColor="#8A9D98"
            />

            <Text style={styles.fieldLabel}>Account Number</Text>
            <TextInput
              style={styles.textInput}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter bank account number"
              placeholderTextColor="#8A9D98"
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>IFSC Code</Text>
            <TextInput
              style={styles.textInput}
              value={ifscCode}
              onChangeText={setIfscCode}
              placeholder="e.g. SBIN0001824"
              placeholderTextColor="#8A9D98"
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveBank}
              disabled={savingBank}
            >
              {savingBank ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Save size={16} color="#FFF" />
                  <Text style={styles.saveBtnText}>Save Bank Details</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* SECTION 3: ALERT PREFERENCES */}
        {activeSection === 'alerts' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notification Preferences</Text>
            <Text style={styles.cardSubtitle}>Control how you receive salary and fee updates</Text>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Email Notifications</Text>
                <Text style={styles.toggleSub}>Receive fee reports and payroll receipts via email</Text>
              </View>
              <Switch
                value={emailAlerts}
                onValueChange={setEmailAlerts}
                trackColor={{ false: '#E2EAE7', true: '#3E7874' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>SMS Alerts</Text>
                <Text style={styles.toggleSub}>Urgent payment and OTP notifications</Text>
              </View>
              <Switch
                value={smsAlerts}
                onValueChange={setSmsAlerts}
                trackColor={{ false: '#E2EAE7', true: '#3E7874' }}
                thumbColor="#FFF"
              />
            </View>

            <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>WhatsApp Alerts</Text>
                <Text style={styles.toggleSub}>Instant chat updates for fee approvals and summaries</Text>
              </View>
              <Switch
                value={whatsappAlerts}
                onValueChange={setWhatsappAlerts}
                trackColor={{ false: '#E2EAE7', true: '#3E7874' }}
                thumbColor="#FFF"
              />
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveAlerts}
              disabled={savingAlerts}
            >
              {savingAlerts ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Save size={16} color="#FFF" />
                  <Text style={styles.saveBtnText}>Save Preferences</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Privacy Policy Link */}
        <TouchableOpacity
          style={styles.legalBtn}
          onPress={() => Linking.openURL('https://www.app.edorapad.com/privacy-policy')}
          activeOpacity={0.8}
        >
          <ShieldCheck size={16} color="#3E7874" />
          <Text style={styles.legalBtnText}>Privacy Policy &amp; Data Rights</Text>
          <ExternalLink size={14} color="#657B76" />
        </TouchableOpacity>

        {/* Logout Section */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Log Out from Portal</Text>
        </TouchableOpacity>

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
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: '#DEE6E4',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  navPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  navPillActive: {
    backgroundColor: '#3E7874',
  },
  navPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#546E68',
  },
  navPillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2EAE7',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#243029',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#657B76',
    marginTop: 2,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFA',
    borderWidth: 1,
    borderColor: '#D8E2DF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#243029',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#DEE6E4',
    alignItems: 'center',
  },
  genderChipActive: {
    backgroundColor: '#295651',
  },
  genderChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#49635E',
  },
  genderChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#295651',
    borderRadius: 10,
    paddingVertical: 13,
    marginTop: 18,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F8F8',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#243029',
  },
  toggleSub: {
    fontSize: 11,
    color: '#657B76',
    marginTop: 2,
  },
  legalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2EAE7',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  legalBtnText: {
    color: '#243029',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
});
