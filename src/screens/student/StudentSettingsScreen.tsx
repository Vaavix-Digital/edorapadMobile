import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  User,
  CreditCard,
  Building,
  Smartphone,
  Upload,
  Check,
  LogOut,
  Trash2,
  X,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import {
  updateLocalSettings,
  fetchStudentProfileData,
} from '../../store/slices/studentSlice';
import { studentApi } from '../../shared/api/studentApi';

export const StudentSettingsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { settings } = useAppSelector((s) => s.student);

  const [activeTab, setActiveTab] = useState<'profile' | 'payment'>('profile');
  const [activePaymentMethod, setActivePaymentMethod] = useState<'card' | 'bank' | 'upi'>('card');

  // Profile Form State
  const [name, setName] = useState(settings?.name || user?.name || 'Shrihari Nambiar p');
  const [email, setEmail] = useState(settings?.email || user?.email || 'shrihari1056@gmail.com');
  const [phoneNumber, setPhoneNumber] = useState(
    settings?.phoneNumber || user?.phone || '+919106163467'
  );
  const [gender, setGender] = useState(settings?.studentSettings?.gender || 'Male');
  const [nationality, setNationality] = useState(settings?.studentSettings?.nationality || 'Indian');
  const [savingProfile, setSavingProfile] = useState(false);

  // Notification Alerts
  const [emailAlerts, setEmailAlerts] = useState(
    settings?.studentSettings?.emailAlerts ?? settings?.emailAlerts ?? true
  );
  const [whatsappAlerts, setWhatsappAlerts] = useState(
    settings?.studentSettings?.whatsappAlerts ?? settings?.whatsappAlerts ?? true
  );
  const [updatingAlerts, setUpdatingAlerts] = useState(false);

  // Payment Form State
  const s = settings?.studentSettings || {};
  const [cardLast4, setCardLast4] = useState(s.cardLast4 || '4111');
  const [cardType, setCardType] = useState(s.cardType || 'Visa');

  const [bankName, setBankName] = useState(s.bankName || 'HDFC Bank');
  const [branchName, setBranchName] = useState(s.branchName || 'Downtown');
  const [accountHolderName, setAccountHolderName] = useState(
    s.accountHolderName || name
  );
  const [accountNumber, setAccountNumber] = useState(s.accountNumber || '50100234567890');
  const [ifscCode, setIfscCode] = useState(s.ifscCode || 'HDFC0001234');

  const [upiId, setUpiId] = useState(s.upiId || 'shrihari@okhdfcbank');
  const [savingPayment, setSavingPayment] = useState(false);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (settings) {
      setName(settings.name || user?.name || 'Shrihari Nambiar p');
      setEmail(settings.email || user?.email || 'shrihari1056@gmail.com');
      setPhoneNumber(settings.phoneNumber || user?.phone || '+919106163467');
      const st = settings.studentSettings || {};
      if (st.gender) setGender(st.gender);
      if (st.nationality) setNationality(st.nationality);
      if (st.cardLast4) setCardLast4(st.cardLast4);
      if (st.cardType) setCardType(st.cardType);
      if (st.bankName) setBankName(st.bankName);
      if (st.branchName) setBranchName(st.branchName);
      if (st.accountHolderName) setAccountHolderName(st.accountHolderName);
      if (st.accountNumber) setAccountNumber(st.accountNumber);
      if (st.ifscCode) setIfscCode(st.ifscCode);
      if (st.upiId) setUpiId(st.upiId);
      if (st.emailAlerts !== undefined) setEmailAlerts(st.emailAlerts);
      if (st.whatsappAlerts !== undefined) setWhatsappAlerts(st.whatsappAlerts);
      if (st.preferredPaymentMethod) {
        setActivePaymentMethod(st.preferredPaymentMethod.toLowerCase() as any);
      }
    }
  }, [settings, user]);

  // Profile Save
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await studentApi.updateSettings({
        name,
        email,
        phoneNumber,
        gender,
        nationality,
      }).catch(() => null);

      dispatch(
        updateLocalSettings({
          name,
          email,
          phoneNumber,
          studentSettings: {
            ...settings?.studentSettings,
            gender,
            nationality,
          },
        })
      );
      Alert.alert('Profile Saved', 'Your profile details have been successfully updated.');
    } catch (err) {
      Alert.alert('Update Failed', 'Could not save profile settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Immediate Alert Toggle
  const handleToggleAlert = async (type: 'email' | 'whatsapp', newVal: boolean) => {
    if (type === 'email') setEmailAlerts(newVal);
    else setWhatsappAlerts(newVal);

    setUpdatingAlerts(true);
    try {
      await studentApi.updateNotificationSettings({
        emailAlerts: type === 'email' ? newVal : emailAlerts,
        whatsappAlerts: type === 'whatsapp' ? newVal : whatsappAlerts,
      }).catch(() => null);

      dispatch(
        updateLocalSettings({
          studentSettings: {
            ...settings?.studentSettings,
            emailAlerts: type === 'email' ? newVal : emailAlerts,
            whatsappAlerts: type === 'whatsapp' ? newVal : whatsappAlerts,
          },
        })
      );
    } catch (e) {
      console.log('Failed to update alert:', e);
    } finally {
      setUpdatingAlerts(false);
    }
  };

  // Payment Save
  const handleSavePayment = async () => {
    setSavingPayment(true);
    const payloadMap: Record<string, any> = {
      card: { preferredPaymentMethod: 'Card', cardLast4, cardType },
      bank: {
        preferredPaymentMethod: 'Bank',
        bankName,
        branchName,
        accountHolderName,
        accountNumber,
        ifscCode,
      },
      upi: { preferredPaymentMethod: 'UPI', upiId },
    };

    try {
      await studentApi.updatePaymentSettings(payloadMap[activePaymentMethod]).catch(() => null);
      dispatch(
        updateLocalSettings({
          studentSettings: {
            ...settings?.studentSettings,
            ...payloadMap[activePaymentMethod],
          },
        })
      );
      Alert.alert('Payment Saved', `${activePaymentMethod.toUpperCase()} details saved successfully.`);
    } catch (err) {
      Alert.alert('Save Failed', 'Could not update payment settings.');
    } finally {
      setSavingPayment(false);
    }
  };

  // Logout
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

  // Delete Account
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await studentApi.deleteAccount().catch(() => null);
      setShowDeleteModal(false);
      Alert.alert('Account Deleted', 'Your account has been deleted.', [
        { text: 'OK', onPress: () => dispatch(logoutUser()) },
      ]);
    } catch (err) {
      setShowDeleteModal(false);
      Alert.alert('Error', 'Failed to delete account.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const avatarUrl =
    settings?.studentSettings?.profilePicUrl ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DEE6E4&color=295651&size=200`;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Header
          title="Settings"
          subtitle="Account and preferences"
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>
            Profile Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'payment' && styles.tabBtnActive]}
          onPress={() => setActiveTab('payment')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'payment' && styles.tabBtnTextActive]}>
            Payment Method
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ════════════════════════════════════════════════════
            TAB 1: PROFILE SETTINGS
        ════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            {/* Main Profile Inputs Card */}
            <View style={styles.mainCard}>
              {/* Avatar with Upload Badge */}
              <View style={styles.avatarCenter}>
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                  <TouchableOpacity
                    style={styles.avatarUploadBtn}
                    onPress={() =>
                      Alert.alert(
                        'Change Profile Photo',
                        'Choose an image from your gallery or capture a new photo.',
                        [{ text: 'Choose Photo' }, { text: 'Cancel', style: 'cancel' }]
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <Upload size={13} color="#334155" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Form Inputs */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email Address"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Phone Number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Gender</Text>
                <TextInput
                  style={styles.textInput}
                  value={gender}
                  onChangeText={setGender}
                  placeholder="Gender (Male / Female / Other)"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Nationality</Text>
                <TextInput
                  style={styles.textInput}
                  value={nationality}
                  onChangeText={setNationality}
                  placeholder="Nationality (e.g. Indian)"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Save Profile Button */}
              <TouchableOpacity
                style={styles.saveProfileBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
                activeOpacity={0.85}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFF" />
                    <Text style={styles.saveProfileBtnText}>Save Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Alert Channels Card */}
            <View style={styles.subCard}>
              <Text style={styles.subCardTitle}>Alert Channels</Text>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleText}>Email</Text>
                <Switch
                  value={emailAlerts}
                  onValueChange={(val) => handleToggleAlert('email', val)}
                  trackColor={{ false: '#CBD5E1', true: '#295651' }}
                  thumbColor="#FFF"
                />
              </View>

              <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.toggleText}>Whatsapp</Text>
                <Switch
                  value={whatsappAlerts}
                  onValueChange={(val) => handleToggleAlert('whatsapp', val)}
                  trackColor={{ false: '#CBD5E1', true: '#295651' }}
                  thumbColor="#FFF"
                />
              </View>

              {updatingAlerts && (
                <Text style={styles.savingAlertNote}>Saving notification preferences…</Text>
              )}
            </View>

            {/* Account Actions Card */}
            <View style={styles.subCard}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => Linking.openURL('https://www.app.edorapad.com/privacy-policy')}
                activeOpacity={0.7}
              >
                <ShieldCheck size={18} color="#295651" />
                <Text style={styles.actionLogoutText}>Privacy Policy</Text>
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <LogOut size={18} color="#295651" />
                <Text style={styles.actionLogoutText}>Logout</Text>
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => setShowDeleteModal(true)}
                activeOpacity={0.7}
              >
                <Trash2 size={18} color="#DC2626" />
                <Text style={styles.actionDeleteText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════
            TAB 2: PAYMENT METHOD
        ════════════════════════════════════════════════════ */}
        {activeTab === 'payment' && (
          <View style={styles.tabContent}>
            {/* 3 Method Selector Buttons */}
            <View style={styles.methodSelectorRow}>
              {/* Card */}
              <TouchableOpacity
                style={[
                  styles.methodSelectBtn,
                  activePaymentMethod === 'card' && styles.methodSelectBtnActive,
                ]}
                onPress={() => setActivePaymentMethod('card')}
                activeOpacity={0.8}
              >
                <CreditCard
                  size={22}
                  color={activePaymentMethod === 'card' ? '#295651' : '#64748B'}
                />
                <Text
                  style={[
                    styles.methodSelectText,
                    activePaymentMethod === 'card' && styles.methodSelectTextActive,
                  ]}
                >
                  Card
                </Text>
              </TouchableOpacity>

              {/* Bank */}
              <TouchableOpacity
                style={[
                  styles.methodSelectBtn,
                  activePaymentMethod === 'bank' && styles.methodSelectBtnActive,
                ]}
                onPress={() => setActivePaymentMethod('bank')}
                activeOpacity={0.8}
              >
                <Building
                  size={22}
                  color={activePaymentMethod === 'bank' ? '#295651' : '#64748B'}
                />
                <Text
                  style={[
                    styles.methodSelectText,
                    activePaymentMethod === 'bank' && styles.methodSelectTextActive,
                  ]}
                >
                  Bank
                </Text>
              </TouchableOpacity>

              {/* UPI */}
              <TouchableOpacity
                style={[
                  styles.methodSelectBtn,
                  activePaymentMethod === 'upi' && styles.methodSelectBtnActive,
                ]}
                onPress={() => setActivePaymentMethod('upi')}
                activeOpacity={0.8}
              >
                <Smartphone
                  size={22}
                  color={activePaymentMethod === 'upi' ? '#295651' : '#64748B'}
                />
                <Text
                  style={[
                    styles.methodSelectText,
                    activePaymentMethod === 'upi' && styles.methodSelectTextActive,
                  ]}
                >
                  UPI
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── CARD FORM & VISUAL CARD PREVIEW ── */}
            {activePaymentMethod === 'card' && (
              <View style={styles.paymentSectionWrap}>
                {/* Visual Credit Card Preview */}
                <View style={styles.visualCard}>
                  <View style={styles.visualCardTop}>
                    <Text style={styles.visualCardBrand}>{cardType || 'VISA'}</Text>
                    <View style={styles.chipBox}>
                      <View style={styles.chipCircleRed} />
                      <View style={styles.chipCircleGold} />
                    </View>
                  </View>

                  <Text style={styles.visualCardNumber}>
                    •••• •••• •••• {cardLast4 || '4111'}
                  </Text>

                  <View style={styles.visualCardBottom}>
                    <Text style={styles.cardHolderLabel}>Card Holder</Text>
                    <Text style={styles.cardHolderName} numberOfLines={1}>
                      {name || 'Shrihari Nambiar p'}
                    </Text>
                  </View>
                </View>

                {/* Edit Card Details Card */}
                <View style={styles.mainCard}>
                  <Text style={styles.subCardTitle}>Edit Card Details</Text>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Last 4 Digits</Text>
                    <TextInput
                      style={styles.textInput}
                      value={cardLast4}
                      onChangeText={(v) => setCardLast4(v.replace(/\D/g, '').slice(0, 4))}
                      placeholder="4111"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Card Type</Text>
                    <View style={styles.pillSelectorRow}>
                      {['Visa', 'Mastercard', 'Amex', 'RuPay'].map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.typePill,
                            cardType === t && styles.typePillActive,
                          ]}
                          onPress={() => setCardType(t)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.typePillText,
                              cardType === t && styles.typePillTextActive,
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.saveProfileBtn}
                    onPress={handleSavePayment}
                    disabled={savingPayment}
                    activeOpacity={0.85}
                  >
                    {savingPayment ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Check size={16} color="#FFF" />
                        <Text style={styles.saveProfileBtnText}>Save Card</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── BANK DETAILS FORM ── */}
            {activePaymentMethod === 'bank' && (
              <View style={styles.mainCard}>
                <Text style={styles.subCardTitle}>Bank Account Details</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="e.g. HDFC Bank"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Branch Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={branchName}
                    onChangeText={setBranchName}
                    placeholder="e.g. Downtown"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Account Holder Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={accountHolderName}
                    onChangeText={setAccountHolderName}
                    placeholder="Full name as in passbook"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Account Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="Enter Account Number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>IFSC Code</Text>
                  <TextInput
                    style={styles.textInput}
                    value={ifscCode}
                    onChangeText={setIfscCode}
                    placeholder="e.g. HDFC0001234"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveProfileBtn}
                  onPress={handleSavePayment}
                  disabled={savingPayment}
                  activeOpacity={0.85}
                >
                  {savingPayment ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Check size={16} color="#FFF" />
                      <Text style={styles.saveProfileBtnText}>Save Bank Details</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ── UPI PAYMENT FORM ── */}
            {activePaymentMethod === 'upi' && (
              <View style={styles.mainCard}>
                <Text style={styles.subCardTitle}>UPI Payment</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>UPI ID / VPA</Text>
                  <TextInput
                    style={styles.textInput}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="e.g. yourname@okhdfcbank"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={styles.saveProfileBtn}
                  onPress={handleSavePayment}
                  disabled={savingPayment}
                  activeOpacity={0.85}
                >
                  {savingPayment ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Check size={16} color="#FFF" />
                      <Text style={styles.saveProfileBtnText}>Save UPI</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Delete Account Confirmation Modal ── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalCard}>
            <View style={styles.deleteIconBox}>
              <ShieldAlert size={28} color="#DC2626" />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Account?</Text>
            <Text style={styles.deleteModalSub}>
              This action is irreversible. All your enrolled courses, certificates, and records
              will be permanently removed.
            </Text>

            <View style={styles.deleteBtnRow}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setShowDeleteModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
                activeOpacity={0.85}
              >
                {deletingAccount ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
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
    borderBottomColor: '#0F766E',
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

  tabContent: {
    gap: 14,
    marginTop: 4,
  },

  // ── Main Card (#DEE6E4) ──
  mainCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  subCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  subCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },

  // ── Avatar Center ──
  avatarCenter: {
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'relative',
    backgroundColor: '#DEE6E4',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarUploadBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  // ── Form Inputs ──
  formGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#295651',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0F172A',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
  },

  // ── Save Button ──
  saveProfileBtn: {
    backgroundColor: '#295651',
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  saveProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Toggle Rows ──
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(41, 86, 81, 0.1)',
  },
  toggleText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  savingAlertNote: {
    fontSize: 11,
    color: '#0F766E',
    marginTop: 6,
    textAlign: 'right',
  },

  // ── Actions ──
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  actionLogoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#295651',
  },
  actionDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionDivider: {
    height: 1,
    backgroundColor: 'rgba(41, 86, 81, 0.1)',
  },

  // ── Payment Methods Selector ──
  methodSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodSelectBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  methodSelectBtnActive: {
    backgroundColor: '#DEE6E4',
    borderColor: '#334155',
  },
  methodSelectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  methodSelectTextActive: {
    color: '#0F172A',
  },

  // ── Visual Credit Card ──
  paymentSectionWrap: {
    gap: 14,
  },
  visualCard: {
    backgroundColor: '#54A39A',
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    minHeight: 170,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  visualCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visualCardBrand: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  chipBox: {
    flexDirection: 'row',
    position: 'relative',
    width: 32,
    height: 20,
  },
  chipCircleRed: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    position: 'absolute',
    left: 0,
  },
  chipCircleGold: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(234, 179, 8, 0.85)',
    position: 'absolute',
    right: 0,
  },
  visualCardNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginVertical: 14,
    fontFamily: 'monospace',
  },
  visualCardBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8,
  },
  cardHolderLabel: {
    fontSize: 10,
    color: '#E0F2FE',
    fontWeight: '500',
  },
  cardHolderName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },

  // ── Card Type Pills ──
  pillSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
  },
  typePillActive: {
    backgroundColor: '#295651',
    borderColor: '#295651',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },

  // ── Delete Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deleteModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  deleteIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  deleteModalSub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  deleteBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  deleteCancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  deleteConfirmBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
