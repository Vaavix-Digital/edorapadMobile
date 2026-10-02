import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  CreditCard,
  Receipt,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  X,
  ArrowRight,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchStudentFullDashboard, fetchStudentPayments } from '../../store/slices/studentSlice';
import { formatCurrency } from '../../shared/utils/calculations';
import { formatDate } from '../../shared/utils/dateHelpers';
import { paymentService } from '../../services/paymentService';
import { Invoice } from '../../shared/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAT_CARD_WIDTH = (SCREEN_WIDTH - THEME.spacing.md * 2 - 10) / 2;

export const StudentPaymentsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { feeSummary, feeCourses, payments, enrolledCourses, loading } = useAppSelector(
    (state) => state.student
  );

  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchStudentFullDashboard());
    dispatch(fetchStudentPayments());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchStudentFullDashboard());
    dispatch(fetchStudentPayments());
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setPayingInvoiceId(invoice.id);
    paymentService.processFeePayment(
      {
        courseId: invoice.courseId || invoice.course?.id || 'c1',
        courseTitle: invoice.course?.title || invoice.courseName || 'Course Enrollment',
        amount: invoice.amount || feeSummary.remaining || 1910,
        userEmail: user?.email || 'student@edorapad.com',
        userName: user?.name || 'Student',
        userPhone: user?.phone,
      },
      (transactionId) => {
        setPayingInvoiceId(null);
        Alert.alert(
          'Payment Successful!',
          `Transaction Reference: ${transactionId}\nYour payment has been recorded.`,
          [
            {
              text: 'View Receipt',
              onPress: () => {
                dispatch(fetchStudentFullDashboard());
                dispatch(fetchStudentPayments());
              },
            },
          ]
        );
      },
      (errorMessage) => {
        setPayingInvoiceId(null);
        Alert.alert('Payment Incomplete', errorMessage);
      }
    );
  };

  const handleViewReceipt = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setReceiptModalOpen(true);
  };

  const courseCount = enrolledCourses?.length || feeCourses?.length || 5;
  const firstCourseTitle =
    enrolledCourses?.[0]?.title || feeCourses?.[0]?.courseTitle || 'Professional Java Development';

  const renderInvoiceItem = ({ item }: { item: Invoice }) => {
    const isCompleted = item.status === 'Completed' || item.status === 'SUCCESS';
    const courseTitle = item.course?.title || item.courseName || item.courseTitle || 'Course Enrollment';
    const invId = (item.id || item._id || 'INV-001').slice(0, 8);
    const dateStr = formatDate(item.createdAt || item.date || item.paidAt);
    const isPaying = payingInvoiceId === item.id;

    return (
      <Card style={styles.invoiceCard}>
        {/* Top Header: Inv ID & Status */}
        <View style={styles.invoiceHeader}>
          <View style={styles.invIdBox}>
            <Text style={styles.invIdText}>Inv ID: {invId}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isCompleted ? styles.badgeCompleted : styles.badgePending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isCompleted ? styles.textCompleted : styles.textPending,
              ]}
            >
              {isCompleted ? 'Completed' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Course Name */}
        <Text style={styles.invoiceCourseTitle} numberOfLines={2}>
          {courseTitle}
        </Text>

        {/* Date & Amount Row */}
        <View style={styles.invoiceMetaRow}>
          <View style={styles.dateCol}>
            <Calendar size={13} color={THEME.colors.textMuted} />
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <Text style={styles.amountText}>
            {formatCurrency(item.amount, item.currency || 'INR')}
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.cardFooter}>
          {isCompleted ? (
            <TouchableOpacity
              style={styles.viewReceiptBtn}
              onPress={() => handleViewReceipt(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewReceiptText}>View Receipt</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => handlePayInvoice(item)}
              activeOpacity={0.85}
              disabled={isPaying}
            >
              {isPaying ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.payBtnText}>Pay Now</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <Header
          title="Payments"
          subtitle="Fee summary & transactions"
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item: any, idx: number) => item.id || item._id || String(idx)}
        renderItem={renderInvoiceItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* 4 Stat Cards in 2x2 Grid */}
            <View style={styles.statsGrid}>
              {/* 1. Total Fees Due */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Fees Due</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(feeSummary?.remaining || 0)}
                </Text>
                {feeSummary?.remaining > 0 ? (
                  <TouchableOpacity
                    style={styles.statBtnPrimary}
                    onPress={() => {
                      if (payments.length > 0) {
                        const firstPending = payments.find((p) => p.status === 'Pending');
                        if (firstPending) handlePayInvoice(firstPending);
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.statBtnPrimaryText}>Pay Now</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.statBtnDisabled}>
                    <Text style={styles.statBtnDisabledText}>No Dues</Text>
                  </View>
                )}
              </View>

              {/* 2. Total Fees Paid */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Fees Paid</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(feeSummary?.paid || 0)}
                </Text>
                <TouchableOpacity
                  style={styles.statBtnPrimary}
                  onPress={() => {
                    const completed = payments.find((p) => p.status === 'Completed');
                    if (completed) handleViewReceipt(completed);
                    else Alert.alert('Receipts', 'No completed receipts found.');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.statBtnPrimaryText}>View Receipts</Text>
                </TouchableOpacity>
              </View>

              {/* 3. Next Due Date */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Next Due Date</Text>
                <Text style={styles.statValueDate}>
                  {formatDate(feeSummary?.nextDueDate)}
                </Text>
                {feeSummary?.remaining > 0 ? (
                  <TouchableOpacity
                    style={styles.statBtnPrimary}
                    onPress={() => {
                      const firstPending = payments.find((p) => p.status === 'Pending');
                      if (firstPending) handlePayInvoice(firstPending);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.statBtnPrimaryText}>Pay Now</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.statBtnDisabled}>
                    <Text style={styles.statBtnDisabledText}>Cleared</Text>
                  </View>
                )}
              </View>

              {/* 4. Enrolled Courses */}
              <View style={styles.statCard}>
                <Text style={styles.statLabel} numberOfLines={1}>
                  {firstCourseTitle}
                </Text>
                <Text style={styles.statValue}>
                  {courseCount} {courseCount === 1 ? 'Course' : 'Courses'}
                </Text>
                <TouchableOpacity
                  style={styles.statBtnOutline}
                  onPress={() => navigation.navigate('Courses')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.statBtnOutlineText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Invoices Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Invoices & Transactions</Text>
              <Text style={styles.sectionCount}>({payments.length})</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <Card variant="flat" style={styles.empty}>
            <Receipt size={40} color={THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptyText}>
              Your upcoming course payment dues and transaction receipts will appear here.
            </Text>
          </Card>
        }
      />

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <Modal
          visible={receiptModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setReceiptModalOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setReceiptModalOpen(false)}
              >
                <X size={20} color={THEME.colors.textPrimary} />
              </TouchableOpacity>

              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalIconBox}>
                  <Receipt size={24} color={THEME.colors.primary} />
                </View>
                <Text style={styles.modalTitle}>Payment Receipt</Text>
                <Text style={styles.modalInstitute}>
                  {selectedInvoice.instituteName || 'EDORAPAD INSTITUTE'}
                </Text>
              </View>

              {/* Receipt Info Rows */}
              <View style={styles.modalBody}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Transaction ID</Text>
                  <Text style={styles.modalVal} numberOfLines={1}>
                    {selectedInvoice.transactionId || selectedInvoice.id}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Date</Text>
                  <Text style={styles.modalVal}>
                    {formatDate(selectedInvoice.createdAt || selectedInvoice.paidAt)}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Course</Text>
                  <Text style={styles.modalVal} numberOfLines={1}>
                    {selectedInvoice.course?.title || selectedInvoice.courseName || 'Course'}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Amount</Text>
                  <Text style={[styles.modalVal, { color: THEME.colors.primary, fontWeight: '800' }]}>
                    {formatCurrency(selectedInvoice.amount, selectedInvoice.currency || 'INR')}
                  </Text>
                </View>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Status</Text>
                  <View style={[styles.statusBadge, styles.badgeCompleted]}>
                    <Text style={[styles.statusText, styles.textCompleted]}>Verified & Paid</Text>
                  </View>
                </View>
              </View>

              {/* Modal Button */}
              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setReceiptModalOpen(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  listContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: 40,
  },

  // ── 4 Stat Cards Grid ──
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: THEME.spacing.md,
    gap: 10,
  },
  statCard: {
    width: STAT_CARD_WIDTH,
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  statValueDate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  statBtnPrimary: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.sm,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  statBtnDisabled: {
    backgroundColor: '#94A3B8',
    borderRadius: THEME.borderRadius.sm,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBtnDisabledText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  statBtnOutline: {
    borderWidth: 1,
    borderColor: '#64748B',
    borderRadius: THEME.borderRadius.sm,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  statBtnOutlineText: {
    color: '#334155',
    fontSize: 11.5,
    fontWeight: '700',
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },

  // ── Invoice Card ──
  invoiceCard: {
    padding: 16,
    marginBottom: 10,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invIdBox: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  invIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeCompleted: {
    backgroundColor: '#DCFCE7',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  textCompleted: {
    color: '#16A34A',
  },
  textPending: {
    color: '#D97706',
  },
  invoiceCourseTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 10,
  },
  invoiceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
  },
  dateCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  payBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 22,
    borderRadius: THEME.borderRadius.md,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  viewReceiptBtn: {
    borderWidth: 1,
    borderColor: '#3D7A73',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#FFFFFF',
  },
  viewReceiptText: {
    color: '#3D7A73',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ── Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 22,
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  modalInstitute: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  modalBody: {
    gap: 12,
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  modalVal: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  modalDoneBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Empty State ──
  empty: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});

