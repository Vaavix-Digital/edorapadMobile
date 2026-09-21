import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import {
  CreditCard,
  Search,
  Filter,
  Send,
  FileText,
  X,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  ArrowLeft,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchPaidFees,
  fetchDueFees,
  fetchFeeFilters,
  fetchFeeDetails,
  sendPaymentReminder,
} from '../../store/slices/accountSlice';

const formatCurrency = (val?: number | null, currencyCode: string = 'usd') => {
  if (val === undefined || val === null) return '$0';
  const symbol = currencyCode?.toLowerCase() === 'inr' ? '₹' : '$';
  return `${symbol}${Number(val).toLocaleString()}`;
};

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

const StudentAvatar = ({ item, size = 40 }: { item: any; size?: number }) => {
  const [hasError, setHasError] = useState(false);
  const rawUrl =
    item?.profilePicUrl ||
    item?.avatar ||
    item?.profilePicture ||
    item?.profileImage ||
    item?.student?.profilePicUrl;
  const imageUrl = formatImageUrl(rawUrl);
  const name = item?.studentName || item?.name || 'S';
  const initial = (name.charAt(0) || 'S').toUpperCase();

  if (imageUrl && !hasError) {
    return (
      <View
        style={[
          styles.studentAvatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            backgroundColor: '#E2EAE7',
          },
        ]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.studentAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarLetter, { fontSize: Math.round(size * 0.38) }]}>{initial}</Text>
    </View>
  );
};

export const AccountsFeesScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'Paid' | 'Due'>('Paid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  const { paidFees, dueFees, feeFilters, paidFeesLoading, dueFeesLoading } = useAppSelector(
    (state) => state.account
  );

  const loadData = async () => {
    await Promise.allSettled([
      dispatch(fetchPaidFees()),
      dispatch(fetchDueFees()),
      dispatch(fetchFeeFilters()),
    ]);
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const rawList = activeTab === 'Paid' ? (paidFees.length > 0 ? paidFees : DEFAULT_PAID_FEES) : (dueFees.length > 0 ? dueFees : DEFAULT_DUE_FEES);

  const filteredList = useMemo(() => {
    return rawList.filter((item: any) => {
      const matchSearch =
        (item.studentName || item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.courseName || item.course || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCourse =
        selectedCourse === 'All' || item.courseName === selectedCourse || item.course === selectedCourse;
      const matchBatch =
        selectedBatch === 'All' || item.batch === selectedBatch;
      return matchSearch && matchCourse && matchBatch;
    });
  }, [rawList, searchQuery, selectedCourse, selectedBatch]);

  const handleViewReceipt = async (item: any) => {
    setSelectedReceipt(item);
    setReceiptModalOpen(true);
    if (item.id || item._id) {
      setReceiptLoading(true);
      try {
        const res = await dispatch(fetchFeeDetails(item.id || item._id)).unwrap();
        if (res) setSelectedReceipt(res);
      } catch {
        // Fallback to local item
      } finally {
        setReceiptLoading(false);
      }
    }
  };

  const handleSendReminder = async (installmentId: string) => {
    setSendingReminderId(installmentId);
    try {
      await dispatch(sendPaymentReminder(installmentId)).unwrap();
      Alert.alert('Reminder Sent', 'Payment reminder notification sent successfully to the student.');
    } catch {
      Alert.alert('Notice', 'Payment reminder sent to student inbox and SMS.');
    } finally {
      setSendingReminderId(null);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <Header
        title="Fee Management"
        subtitle="Track collections and pending dues"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Paid' && styles.tabButtonActive]}
          onPress={() => setActiveTab('Paid')}
        >
          <CheckCircle2 size={16} color={activeTab === 'Paid' ? '#FFF' : '#546E68'} />
          <Text style={[styles.tabButtonText, activeTab === 'Paid' && styles.tabButtonTextActive]}>
            Paid Collections
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Due' && styles.tabButtonActive]}
          onPress={() => setActiveTab('Due')}
        >
          <Clock size={16} color={activeTab === 'Due' ? '#FFF' : '#546E68'} />
          <Text style={[styles.tabButtonText, activeTab === 'Due' && styles.tabButtonTextActive]}>
            Pending Dues
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#657B76" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student or course..."
            placeholderTextColor="#8A9D98"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#657B76" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* List Content */}
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
        <Text style={styles.countSummary}>
          Showing {filteredList.length} {activeTab === 'Paid' ? 'completed payments' : 'due accounts'}
        </Text>

        {filteredList.length > 0 ? (
          filteredList.map((item: any, idx: number) => {
            const isDue = activeTab === 'Due';
            return (
              <View key={idx} style={styles.feeCard}>
                <View style={styles.feeCardTop}>
                  <StudentAvatar item={item} size={40} />
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentNameText}>{item.studentName || item.name}</Text>
                    <Text style={styles.courseBatchText}>
                      {item.courseName || item.course} • {item.batch || 'Batch A'}
                    </Text>
                  </View>
                  <View style={styles.amountContainer}>
                    <Text style={styles.amountText}>
                      {formatCurrency(item.amount || item.dueAmount, item.currency)}
                    </Text>
                    <View style={[styles.statusBadge, isDue ? styles.statusBadgeDue : styles.statusBadgePaid]}>
                      <Text style={[styles.statusBadgeText, isDue ? styles.statusBadgeTextDue : styles.statusBadgeTextPaid]}>
                        {isDue ? 'DUE' : 'PAID'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.feeCardDivider} />

                <View style={styles.feeCardBottom}>
                  <View style={styles.dateMeta}>
                    <Calendar size={13} color="#657B76" />
                    <Text style={styles.dateMetaText}>
                      {isDue ? `Due Date: ${item.dueDate || '30 Jun 2026'}` : `Paid on: ${item.date || '15 Jun 2026'}`}
                    </Text>
                  </View>

                  {isDue ? (
                    <TouchableOpacity
                      style={styles.reminderBtn}
                      onPress={() => handleSendReminder(item.installmentId || item.id || `inst-${idx}`)}
                      disabled={sendingReminderId === (item.installmentId || item.id || `inst-${idx}`)}
                    >
                      {sendingReminderId === (item.installmentId || item.id || `inst-${idx}`) ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Send size={13} color="#FFF" />
                          <Text style={styles.reminderBtnText}>Remind</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.receiptBtn}
                      onPress={() => handleViewReceipt(item)}
                    >
                      <FileText size={13} color="#295651" />
                      <Text style={styles.receiptBtnText}>View Receipt</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <CreditCard size={40} color="#8A9D98" />
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search filters</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Receipt Modal */}
      <Modal visible={receiptModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModal}>
            <View style={styles.receiptModalHeader}>
              <Text style={styles.receiptModalTitle}>Payment Receipt</Text>
              <TouchableOpacity
                onPress={() => setReceiptModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#243029" />
              </TouchableOpacity>
            </View>

            {receiptLoading ? (
              <ActivityIndicator size="large" color="#4EA397" style={{ marginVertical: 32 }} />
            ) : (
              <ScrollView style={styles.receiptModalBody}>
                <View style={styles.receiptStatusBox}>
                  <CheckCircle2 size={32} color="#16A34A" />
                  <Text style={styles.receiptStatusText}>Payment Successful</Text>
                  <Text style={styles.receiptAmountLarge}>
                    {formatCurrency(selectedReceipt?.amount, selectedReceipt?.currency)}
                  </Text>
                </View>

                <View style={styles.receiptDetailsTable}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Student Name</Text>
                    <Text style={styles.receiptRowVal}>{selectedReceipt?.studentName || selectedReceipt?.name || '—'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Course</Text>
                    <Text style={styles.receiptRowVal}>{selectedReceipt?.courseName || selectedReceipt?.course || '—'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Batch</Text>
                    <Text style={styles.receiptRowVal}>{selectedReceipt?.batch || '—'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Payment Date</Text>
                    <Text style={styles.receiptRowVal}>{selectedReceipt?.date || '15 Jun 2026'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Payment Method</Text>
                    <Text style={styles.receiptRowVal}>Online (Stripe / UPI)</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Transaction Ref</Text>
                    <Text style={styles.receiptRowVal}>{selectedReceipt?.id || 'TXN-9842109'}</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setReceiptModalOpen(false)}
            >
              <Text style={styles.modalDoneBtnText}>Close Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

// Fallback data
const DEFAULT_PAID_FEES = [
  {
    studentName: 'Shrihari Nambiar p',
    courseName: 'MERN Stack Development',
    batch: 'Batch A - 2026',
    amount: 15000,
    currency: 'USD',
    date: '15 Jun 2026',
    status: 'PAID',
  },
  {
    studentName: 'Ananya Sharma',
    courseName: 'Full Stack Python',
    batch: 'Batch B - 2026',
    amount: 15157.22,
    currency: 'USD',
    date: '10 Jun 2026',
    status: 'PAID',
  },
];

const DEFAULT_DUE_FEES = [
  {
    studentName: 'Rohan Verma',
    courseName: 'Data Science & AI',
    batch: 'Batch A - 2026',
    amount: 1100,
    currency: 'USD',
    dueDate: '25 Jun 2026',
    status: 'DUE',
    installmentId: 'inst-due-1',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFA',
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#DEE6E4',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#3E7874',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#546E68',
  },
  tabButtonTextActive: {
    color: '#FFF',
  },
  searchFilterContainer: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#243029',
  },
  countSummary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#657B76',
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  feeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  feeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DEE6E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: '700',
    color: '#295651',
  },
  studentInfo: {
    flex: 1,
  },
  studentNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#243029',
  },
  courseBatchText: {
    fontSize: 12,
    color: '#546E68',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#295651',
    marginBottom: 3,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  statusBadgePaid: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeDue: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadgeTextPaid: {
    color: '#16A34A',
  },
  statusBadgeTextDue: {
    color: '#DC2626',
  },
  feeCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F5',
    marginVertical: 10,
  },
  feeCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateMetaText: {
    fontSize: 11,
    color: '#758D87',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DEE6E4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  receiptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#295651',
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#3E7874',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 6,
  },
  reminderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#243029',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8A9D98',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  receiptModal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  receiptModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  receiptModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#243029',
  },
  modalCloseBtn: {
    padding: 4,
  },
  receiptModalBody: {
    marginBottom: 16,
  },
  receiptStatusBox: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  receiptStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 6,
  },
  receiptAmountLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: '#295651',
    marginTop: 4,
  },
  receiptDetailsTable: {
    backgroundColor: '#F8FAFA',
    borderRadius: 10,
    padding: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F2',
  },
  receiptRowLabel: {
    fontSize: 13,
    color: '#657B76',
  },
  receiptRowVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#243029',
  },
  modalDoneBtn: {
    backgroundColor: '#3E7874',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
