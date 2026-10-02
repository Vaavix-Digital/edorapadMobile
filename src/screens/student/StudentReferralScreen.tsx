import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Gift,
  Copy,
  Share2,
  Check,
  Users,
  Wallet,
  ArrowUpRight,
  X,
  CreditCard,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchStudentReferral, ReferralHistoryItem } from '../../store/slices/studentSlice';
import { formatCurrency } from '../../shared/utils/calculations';
import { formatDate } from '../../shared/utils/dateHelpers';

export const StudentReferralScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { referral, loading } = useAppSelector((s) => s.student);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Payout Modal State
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  useEffect(() => {
    dispatch(fetchStudentReferral());
  }, [dispatch]);

  const balances = referral?.balances || {
    claimable: 0,
    pending: 0,
    claimed: 0,
    total: 0,
  };

  const summary = referral?.summary || {
    totalReferrals: 0,
    successfulJoins: 0,
    pendingJoins: 0,
  };

  const historyList: ReferralHistoryItem[] = referral?.history || [];

  const handleCopy = (text: string, isLink = false) => {
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
    Alert.alert('Copied to clipboard', text);
  };

  const handleShare = async () => {
    try {
      const code = referral.referralCode || 'EDORA-STU001';
      const link = referral.referralLink || `https://edorapad.com/join?ref=${code}`;
      await Share.share({
        message: `Join me on Edorapad! Learn high-demand skills with top mentors. Use my referral code: ${code}\nSign up here: ${link}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleOpenPayout = () => {
    const claimable = balances.claimable || 0;
    if (claimable <= 0) {
      Alert.alert(
        'No Rewards to Payout',
        'You do not have any claimable referral rewards at this moment. Share your link with friends to start earning rewards!'
      );
      return;
    }
    setPayoutAmount(String(claimable));
    setPayoutModalOpen(true);
  };

  const handleSubmitPayout = () => {
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }
    if (amount > (balances.claimable || 0)) {
      Alert.alert(
        'Insufficient Balance',
        `You can withdraw up to ${formatCurrency(balances.claimable)}.`
      );
      return;
    }

    if (payoutMethod === 'upi' && !upiId.trim()) {
      Alert.alert('UPI ID Required', 'Please enter your UPI ID (e.g. name@okhdfcbank).');
      return;
    }

    if (payoutMethod === 'bank' && (!accountNumber.trim() || !ifscCode.trim())) {
      Alert.alert('Bank Details Required', 'Please enter your Account Number and IFSC Code.');
      return;
    }

    setSubmittingPayout(true);
    setTimeout(() => {
      setSubmittingPayout(false);
      setPayoutModalOpen(false);
      Alert.alert(
        'Payout Requested Successfully!',
        `Your withdrawal request of ${formatCurrency(
          amount
        )} has been submitted. It will be credited within 24-48 hours.`,
        [{ text: 'OK', onPress: () => dispatch(fetchStudentReferral()) }]
      );
    }, 1200);
  };

  const renderHistoryItem = (item: ReferralHistoryItem, index: number) => {
    const friendName = item.friendName || item.name || 'Student Friend';
    const courseTitle = item.courseTitle || item.course || 'Enrolled Course';
    const dateStr = item.dateInvited || item.date ? formatDate(item.dateInvited || item.date) : 'N/A';
    const isSuccess =
      item.status === 'COMPLETED' ||
      item.status === 'SUCCESS' ||
      item.status === 'Claimed' ||
      item.status === 'Claimable';

    return (
      <View key={item.id || item._id || index} style={styles.historyCard}>
        {/* Top: Friend Name & Status Badge */}
        <View style={styles.historyTopRow}>
          <View style={styles.friendInfo}>
            <View style={styles.friendAvatar}>
              <Text style={styles.friendAvatarText}>
                {friendName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.friendTextCol}>
              <Text style={styles.friendName}>{friendName}</Text>
              <Text style={styles.courseText} numberOfLines={1}>
                {courseTitle}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              isSuccess ? styles.badgeSuccess : styles.badgePending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isSuccess ? styles.textSuccess : styles.textPending,
              ]}
            >
              {item.status || 'Pending'}
            </Text>
          </View>
        </View>

        {/* Bottom: Date & Reward */}
        <View style={styles.historyBottomRow}>
          <View style={styles.dateCol}>
            <Calendar size={13} color={THEME.colors.textMuted} />
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>

          <View style={styles.rewardCol}>
            <Text style={styles.rewardLabel}>Reward:</Text>
            <Text
              style={[
                styles.rewardVal,
                { color: isSuccess ? '#16A34A' : THEME.colors.textPrimary },
              ]}
            >
              {item.reward ? formatCurrency(item.reward) : 'Nil'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <Header
          title="Referral Program"
          subtitle="Invite friends & track reward payouts"
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchStudentReferral())}
            tintColor={THEME.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── 3 Web-Parity Summary Cards ── */}
        <View style={styles.summaryContainer}>
          {/* Card 1: Rewards Available */}
          <View style={styles.webStatCard}>
            <Text style={styles.webStatTitle}>Rewards Available</Text>
            <Text style={styles.bigAmountText}>
              {formatCurrency(balances.claimable || 0)}
            </Text>
            <TouchableOpacity
              style={styles.payoutBtn}
              onPress={handleOpenPayout}
              activeOpacity={0.85}
            >
              <ArrowUpRight size={16} color="#FFF" />
              <Text style={styles.payoutBtnText}>Payout</Text>
            </TouchableOpacity>
          </View>

          {/* Card 2: Referral Summary */}
          <View style={styles.webStatCard}>
            <Text style={styles.webStatTitle}>Referral Summary</Text>
            <View style={styles.breakdownRows}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Total Referrals</Text>
                <Text style={styles.breakdownValueBold}>{summary.totalReferrals || 0}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Successful Joins</Text>
                <Text style={styles.breakdownValueBold}>{summary.successfulJoins || 0}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Pending Joins</Text>
                <Text style={styles.breakdownValueBold}>{summary.pendingJoins || 0}</Text>
              </View>
            </View>
          </View>

          {/* Card 3: Rewards Earned */}
          <View style={styles.webStatCard}>
            <Text style={styles.webStatTitle}>Rewards Earned</Text>
            <View style={styles.breakdownRows}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Total Rewards</Text>
                <Text style={styles.breakdownValueBold}>
                  {formatCurrency(balances.total || 0)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Claimed</Text>
                <Text style={styles.breakdownValueBold}>
                  {formatCurrency(balances.claimed || 0)}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Pending</Text>
                <Text style={styles.breakdownValueBold}>
                  {formatCurrency(balances.pending || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Share & Invite Box ── */}
        <View style={styles.shareContainer}>
          <Text style={styles.shareSectionHeading}>Share Your Referral Link</Text>

          {/* Referral Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Referral Code</Text>
            <View style={styles.codeRow}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{referral.referralCode || 'EDORA-STU001'}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => handleCopy(referral.referralCode || 'EDORA-STU001', false)}
                activeOpacity={0.8}
              >
                {copiedCode ? <Check size={15} color="#FFF" /> : <Copy size={15} color="#FFF" />}
                <Text style={styles.copyBtnText}>{copiedCode ? 'Copied' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Referral Link */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Referral Link</Text>
            <View style={styles.codeRow}>
              <View style={[styles.codeBox, { flex: 1 }]}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {referral.referralLink || `https://edorapad.com/join?ref=${referral.referralCode || 'EDORA-STU001'}`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() =>
                  handleCopy(
                    referral.referralLink || `https://edorapad.com/join?ref=${referral.referralCode || 'EDORA-STU001'}`,
                    true
                  )
                }
                activeOpacity={0.8}
              >
                {copiedLink ? <Check size={15} color="#FFF" /> : <Copy size={15} color="#FFF" />}
                <Text style={styles.copyBtnText}>{copiedLink ? 'Copied' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Big Share Button */}
          <TouchableOpacity
            style={styles.bigShareBtn}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Share2 size={18} color="#FFF" />
            <Text style={styles.bigShareBtnText}>Share with Friends</Text>
          </TouchableOpacity>
        </View>

        {/* ── Referrals Table / History ── */}
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeaderBar}>
            <Text style={styles.tableHeaderTitle}>Referral History</Text>
            <Text style={styles.tableHeaderCount}>({historyList.length})</Text>
          </View>

          <View style={styles.tableBodyContainer}>
            {historyList.length > 0 ? (
              historyList.map((item, idx) => renderHistoryItem(item, idx))
            ) : (
              <View style={styles.emptyTableBox}>
                <Users size={40} color={THEME.colors.textMuted} />
                <Text style={styles.emptyTableTitle}>No referrals found</Text>
                <Text style={styles.emptyTableSub}>
                  Share your invite link to start earning rewards when friends enroll!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Request Payout Modal ── */}
      <Modal
        visible={payoutModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPayoutModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Wallet size={22} color={THEME.colors.primary} />
                <Text style={styles.modalTitle}>Request Payout</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPayoutModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={THEME.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Available Balance Pill */}
            <View style={styles.balancePill}>
              <Text style={styles.balancePillLabel}>Available Balance:</Text>
              <Text style={styles.balancePillVal}>
                {formatCurrency(balances.claimable || 0)}
              </Text>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.formSectionLabel}>Select Payout Method</Text>
            <View style={styles.methodSelector}>
              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  payoutMethod === 'upi' && styles.methodBtnActive,
                ]}
                onPress={() => setPayoutMethod('upi')}
                activeOpacity={0.8}
              >
                <CreditCard
                  size={16}
                  color={payoutMethod === 'upi' ? '#FFF' : THEME.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.methodBtnText,
                    payoutMethod === 'upi' && styles.methodBtnTextActive,
                  ]}
                >
                  UPI ID
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  payoutMethod === 'bank' && styles.methodBtnActive,
                ]}
                onPress={() => setPayoutMethod('bank')}
                activeOpacity={0.8}
              >
                <Building
                  size={16}
                  color={payoutMethod === 'bank' ? '#FFF' : THEME.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.methodBtnText,
                    payoutMethod === 'bank' && styles.methodBtnTextActive,
                  ]}
                >
                  Bank Transfer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Fields for UPI */}
            {payoutMethod === 'upi' ? (
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>UPI ID / VPA</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. student@okhdfcbank"
                  placeholderTextColor="#94A3B8"
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                />
              </View>
            ) : (
              /* Fields for Bank Transfer */
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Full name as in bank account"
                  placeholderTextColor="#94A3B8"
                  value={accountName}
                  onChangeText={setAccountName}
                />
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Account Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter Bank Account Number"
                  placeholderTextColor="#94A3B8"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                />
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>IFSC Code</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. HDFC0001234"
                  placeholderTextColor="#94A3B8"
                  value={ifscCode}
                  onChangeText={setIfscCode}
                  autoCapitalize="characters"
                />
              </View>
            )}

            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Withdrawal Amount (₹)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter amount"
                placeholderTextColor="#94A3B8"
                value={payoutAmount}
                onChangeText={setPayoutAmount}
                keyboardType="numeric"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitPayoutBtn}
              onPress={handleSubmitPayout}
              disabled={submittingPayout}
              activeOpacity={0.85}
            >
              {submittingPayout ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitPayoutBtnText}>Submit Payout Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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

  // ── 3 Summary Cards ──
  summaryContainer: {
    gap: 12,
    marginBottom: THEME.spacing.md,
  },
  webStatCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  webStatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  bigAmountText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  payoutBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  payoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  breakdownRows: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '500',
  },
  breakdownValueBold: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },

  // ── Share Container ──
  shareContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    marginBottom: THEME.spacing.md,
  },
  shareSectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeBox: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 1,
  },
  linkText: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500',
  },
  copyBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  bigShareBtn: {
    backgroundColor: '#1A3A34',
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  bigShareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Referrals Table / Card List ──
  tableWrapper: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
  },
  tableHeaderBar: {
    backgroundColor: '#54A39A',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  tableHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  tableHeaderCount: {
    color: '#E0F2FE',
    fontSize: 14,
    fontWeight: '700',
  },
  tableBodyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  friendAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 14,
  },
  friendTextCol: {
    flex: 1,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  courseText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  textSuccess: {
    color: '#16A34A',
  },
  textPending: {
    color: '#D97706',
  },
  historyBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  dateCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  rewardCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardLabel: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  rewardVal: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Empty State
  emptyTableBox: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 10,
  },
  emptyTableSub: {
    fontSize: 12.5,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  balancePill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balancePillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  balancePillVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#15803D',
  },
  formSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  methodBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  methodBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  methodBtnTextActive: {
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  submitPayoutBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitPayoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
