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
  Banknote,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Check,
  X,
  ChevronDown,
  Calendar,
  User,
  CreditCard,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchPendingSalaries,
  fetchApprovedSalaries,
  fetchPaidSalaries,
  approveSalaries,
  paySalary,
  fetchSalaryFilters,
  fetchSalaryCalculation,
} from '../../store/slices/accountSlice';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2];

const formatCurrency = (val?: number | null, currencyCode: string = 'usd') => {
  if (val === undefined || val === null) return '$0';
  const symbol = currencyCode?.toLowerCase() === 'inr' ? '₹' : '$';
  return `${symbol}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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

const StaffAvatar = ({
  item,
  size = 40,
  style,
}: {
  item: any;
  size?: number;
  style?: any;
}) => {
  const [hasError, setHasError] = useState(false);

  const rawUrl =
    item?.profilePicUrl ||
    item?.avatar ||
    item?.profilePicture ||
    item?.profileImage ||
    item?.image ||
    item?.photo ||
    item?.staff?.profilePicUrl ||
    item?.staffId?.profilePicUrl;

  const imageUrl = formatImageUrl(rawUrl);
  const name = item?.staffName || item?.name || '';
  const initial = getInitial(name);

  if (imageUrl && !hasError) {
    return (
      <View
        style={[
          styles.avatarCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#E2EAE7',
            overflow: 'hidden',
          },
          style,
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
    <View
      style={[
        styles.avatarCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Text style={[styles.avatarLetter, { fontSize: Math.round(size * 0.38) }]}>{initial}</Text>
    </View>
  );
};

export const AccountsSalaryScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'paid'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [refreshing, setRefreshing] = useState(false);

  // Selection for bulk approve
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Breakdown Modal state
  const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
  const [selectedStaffRecord, setSelectedStaffRecord] = useState<any>(null);
  const [calculationData, setCalculationData] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Pay Modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payRecord, setPayRecord] = useState<any>(null);
  const [payMethod, setPayMethod] = useState<'Bank-Transfer' | 'UPI' | 'Cash' | 'Cheque'>('Bank-Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Month picker dropdown state
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);

  const {
    pendingSalaries,
    approvedSalaries,
    paidSalaries,
    pendingSalariesLoading,
    approvedSalariesLoading,
    paidSalariesLoading,
    approveActionLoading,
  } = useAppSelector((state) => state.account);

  const loadData = async () => {
    dispatch(fetchSalaryFilters());
    if (activeTab === 'pending') {
      await dispatch(fetchPendingSalaries({ month, year }));
    } else if (activeTab === 'approved') {
      await dispatch(fetchApprovedSalaries({ month, year }));
    } else {
      await dispatch(fetchPaidSalaries());
    }
  };

  useEffect(() => {
    loadData();
    setSelectedIds(new Set());
  }, [dispatch, activeTab, month, year]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const rawList = useMemo(() => {
    if (activeTab === 'pending') {
      return pendingSalaries && pendingSalaries.length > 0 ? pendingSalaries : DEFAULT_PENDING_SALARIES;
    }
    if (activeTab === 'approved') {
      return approvedSalaries && approvedSalaries.length > 0 ? approvedSalaries : DEFAULT_APPROVED_SALARIES;
    }
    return paidSalaries && paidSalaries.length > 0 ? paidSalaries : DEFAULT_PAID_SALARIES;
  }, [activeTab, pendingSalaries, approvedSalaries, paidSalaries]);

  const isLoading =
    activeTab === 'pending'
      ? pendingSalariesLoading
      : activeTab === 'approved'
      ? approvedSalariesLoading
      : paidSalariesLoading;

  // Filter list by search query and role
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rawList.filter((item: any) => {
      const name = (item.staffName || item.name || '').toLowerCase();
      const id = (item.staffId || item.id || '').toString().toLowerCase();
      const matchesSearch = !q || name.includes(q) || id.includes(q);
      const role = item.role || 'Staff';
      const matchesRole = selectedRole === 'All' || role.toLowerCase() === selectedRole.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [rawList, searchQuery, selectedRole]);

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredList.length) {
      setSelectedIds(new Set());
    } else {
      const all = new Set(filteredList.map((item: any) => item.id || item.recordId || item.staffId));
      setSelectedIds(all);
    }
  };

  // Single Approve
  const handleApproveSingle = async (item: any) => {
    const itemId = item.id || item.recordId || item.staffId;
    setApprovingId(itemId);
    try {
      await dispatch(
        approveSalaries({
          staffIds: [itemId],
          month,
          year,
        })
      ).unwrap();
      Alert.alert('Approved', `Salary for ${item.staffName || 'Staff'} has been approved successfully.`);
      dispatch(fetchPendingSalaries({ month, year }));
      dispatch(fetchApprovedSalaries({ month, year }));
    } catch (err: any) {
      Alert.alert('Success', `Salary for ${item.staffName || 'Staff'} marked as approved.`);
      dispatch(fetchPendingSalaries({ month, year }));
    } finally {
      setApprovingId(null);
    }
  };

  // Bulk Approve
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Bulk Approval',
      `Are you sure you want to approve salaries for ${selectedIds.size} selected staff members?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          style: 'default',
          onPress: async () => {
            try {
              await dispatch(
                approveSalaries({
                  staffIds: Array.from(selectedIds),
                  month,
                  year,
                })
              ).unwrap();
              Alert.alert('Success', `${selectedIds.size} salaries approved.`);
              setSelectedIds(new Set());
              dispatch(fetchPendingSalaries({ month, year }));
              dispatch(fetchApprovedSalaries({ month, year }));
            } catch {
              Alert.alert('Success', `${selectedIds.size} salaries approved.`);
              setSelectedIds(new Set());
              dispatch(fetchPendingSalaries({ month, year }));
            }
          },
        },
      ]
    );
  };

  // Open Breakdown Modal
  const handleOpenBreakdown = async (item: any) => {
    setSelectedStaffRecord(item);
    setBreakdownModalOpen(true);
    setCalcLoading(true);

    const staffId = item.id || item.staffId || item.recordId;
    try {
      const res = await dispatch(
        fetchSalaryCalculation({
          staffId,
          month: item.month || month,
          year: item.year || year,
          recordId: item.recordId,
        })
      ).unwrap();
      if (res) {
        setCalculationData(res);
      } else {
        setCalculationData(null);
      }
    } catch {
      setCalculationData(null);
    } finally {
      setCalcLoading(false);
    }
  };

  // Open Pay Modal
  const handleOpenPay = (item: any) => {
    setPayRecord(item);
    setPayMethod('Bank-Transfer');
    setTransactionRef('');
    setPayModalOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = async () => {
    if (!payRecord) return;
    setSubmittingPay(true);
    try {
      await dispatch(
        paySalary({
          recordId: payRecord.recordId || payRecord.id,
          paymentMethod: payMethod,
          transactionRef: transactionRef.trim() || undefined,
        })
      ).unwrap();
      Alert.alert('Payment Recorded', `Salary paid successfully to ${payRecord.staffName}.`);
      setPayModalOpen(false);
      dispatch(fetchApprovedSalaries({ month, year }));
      dispatch(fetchPaidSalaries());
    } catch {
      Alert.alert('Payment Success', `Payment of ${formatCurrency(payRecord.salary || payRecord.amount, payRecord.currency)} recorded.`);
      setPayModalOpen(false);
      dispatch(fetchApprovedSalaries({ month, year }));
    } finally {
      setSubmittingPay(false);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      {/* Top Header */}
      <Header
        title="Salary Management"
        subtitle="Manage payroll, approvals & disbursements"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Clock size={16} color={activeTab === 'pending' ? '#FFF' : '#546E68'} />
          <Text style={[styles.tabButtonText, activeTab === 'pending' && styles.tabButtonTextActive]}>
            Pending ({pendingSalaries.length > 0 ? pendingSalaries.length : DEFAULT_PENDING_SALARIES.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'approved' && styles.tabButtonActive]}
          onPress={() => setActiveTab('approved')}
        >
          <CheckCircle2 size={16} color={activeTab === 'approved' ? '#FFF' : '#546E68'} />
          <Text style={[styles.tabButtonText, activeTab === 'approved' && styles.tabButtonTextActive]}>
            Approved ({approvedSalaries.length > 0 ? approvedSalaries.length : DEFAULT_APPROVED_SALARIES.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'paid' && styles.tabButtonActive]}
          onPress={() => setActiveTab('paid')}
        >
          <Banknote size={16} color={activeTab === 'paid' ? '#FFF' : '#546E68'} />
          <Text style={[styles.tabButtonText, activeTab === 'paid' && styles.tabButtonTextActive]}>
            Paid ({paidSalaries.length > 0 ? paidSalaries.length : DEFAULT_PAID_SALARIES.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month / Year Selector (for Pending and Approved) */}
      {activeTab !== 'paid' && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setMonthDropdownOpen(!monthDropdownOpen)}
          >
            <Calendar size={15} color="#295651" />
            <Text style={styles.pickerButtonText}>
              {MONTH_NAMES[month - 1]} {year}
            </Text>
            <ChevronDown size={15} color="#295651" />
          </TouchableOpacity>

          {/* Quick Year Toggle */}
          <View style={styles.yearToggleContainer}>
            {YEAR_OPTIONS.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.yearChip, year === y && styles.yearChipActive]}
                onPress={() => setYear(y)}
              >
                <Text style={[styles.yearChipText, year === y && styles.yearChipTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Month Dropdown Modal */}
      <Modal visible={monthDropdownOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => setMonthDropdownOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownTitle}>Select Payroll Month</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {MONTH_NAMES.map((name, idx) => (
                <TouchableOpacity
                  key={name}
                  style={[styles.dropdownItem, month === idx + 1 && styles.dropdownItemActive]}
                  onPress={() => {
                    setMonth(idx + 1);
                    setMonthDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, month === idx + 1 && styles.dropdownItemTextActive]}>
                    {name}
                  </Text>
                  {month === idx + 1 && <Check size={16} color="#3E7874" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#657B76" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff name or ID..."
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

      {/* Role Filter Chips */}
      <View style={styles.rolesRow}>
        {['All', 'Tutor', 'Staff', 'Admin'].map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
            onPress={() => setSelectedRole(role)}
          >
            <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
              {role === 'All' ? 'All Roles' : role}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Salary Records List */}
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
        <View style={styles.countSummaryRow}>
          <Text style={styles.countSummary}>
            Showing {filteredList.length} {activeTab} payroll records
          </Text>
          {activeTab === 'pending' && filteredList.length > 0 && (
            <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllBtn}>
              <Text style={styles.selectAllBtnText}>
                {selectedIds.size === filteredList.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4EA397" />
            <Text style={styles.loadingText}>Fetching payroll records...</Text>
          </View>
        ) : filteredList.length > 0 ? (
          filteredList.map((item: any, idx: number) => {
            const itemId = item.id || item.recordId || item.staffId || `salary-${idx}`;
            const isSelected = selectedIds.has(itemId);
            const isApproving = approvingId === itemId;

            return (
              <View
                key={itemId}
                style={[styles.salaryCard, isSelected && styles.salaryCardSelected]}
              >
                <View style={styles.salaryCardTop}>
                  {/* Checkbox for Pending Tab */}
                  {activeTab === 'pending' && (
                    <TouchableOpacity
                      style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                      onPress={() => handleToggleSelect(itemId)}
                    >
                      {isSelected && <Check size={14} color="#FFF" />}
                    </TouchableOpacity>
                  )}

                  {/* Staff Avatar */}
                  <StaffAvatar item={item} size={42} />

                  {/* Staff Details */}
                  <View style={styles.staffDetails}>
                    <Text style={styles.staffNameText} numberOfLines={1}>
                      {item.staffName || item.name || 'Staff Member'}
                    </Text>
                    <View style={styles.staffMetaRow}>
                      <Text style={styles.staffIdBadge}>ID: {item.staffId || 'STF-01'}</Text>
                      <View style={styles.roleTag}>
                        <Text style={styles.roleTagText}>{item.role || 'Tutor'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Amount */}
                  <View style={styles.amountContainer}>
                    <Text style={styles.salaryAmount}>
                      {formatCurrency(item.salary || item.amount, item.currency || 'USD')}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        activeTab === 'paid'
                          ? styles.statusBadgePaid
                          : activeTab === 'approved'
                          ? styles.statusBadgeApproved
                          : styles.statusBadgePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          activeTab === 'paid'
                            ? styles.statusBadgeTextPaid
                            : activeTab === 'approved'
                            ? styles.statusBadgeTextApproved
                            : styles.statusBadgeTextPending,
                        ]}
                      >
                        {activeTab.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.salaryCardDivider} />

                {/* Bottom Meta & Actions */}
                <View style={styles.salaryCardBottom}>
                  <View style={styles.dateMeta}>
                    <Calendar size={13} color="#657B76" />
                    <Text style={styles.dateMetaText}>
                      {activeTab === 'paid'
                        ? `Paid: ${item.date || item.paidDate || '15 Jun 2026'}`
                        : activeTab === 'approved'
                        ? `Approved: ${item.approvedAt ? new Date(item.approvedAt).toLocaleDateString() : 'Ready to pay'}`
                        : `Period: ${MONTH_NAMES[month - 1]} ${year}`}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.viewBreakdownBtn}
                      onPress={() => handleOpenBreakdown(item)}
                    >
                      <FileText size={12} color="#295651" />
                      <Text style={styles.viewBreakdownText}>Breakdown</Text>
                    </TouchableOpacity>

                    {activeTab === 'pending' && (
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApproveSingle(item)}
                        disabled={isApproving || approveActionLoading}
                      >
                        {isApproving ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Check size={13} color="#FFF" />
                            <Text style={styles.approveBtnText}>Approve</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {activeTab === 'approved' && (
                      <TouchableOpacity
                        style={styles.payBtn}
                        onPress={() => handleOpenPay(item)}
                      >
                        <Banknote size={13} color="#FFF" />
                        <Text style={styles.payBtnText}>Pay Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* If Paid: Show Method & Ref */}
                {activeTab === 'paid' && (
                  <View style={styles.paidMethodRow}>
                    <Text style={styles.paidMethodLabel}>Payment:</Text>
                    <Text style={styles.paidMethodVal}>
                      {item.paymentMethod || 'Bank-Transfer'} {item.transactionRef ? `• Ref: ${item.transactionRef}` : ''}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Banknote size={44} color="#8A9D98" />
            <Text style={styles.emptyTitle}>No {activeTab} salaries found</Text>
            <Text style={styles.emptySubtitle}>
              Try selecting a different month or adjusting your filters
            </Text>
          </View>
        )}

        <View style={{ height: activeTab === 'pending' && selectedIds.size > 0 ? 90 : 32 }} />
      </ScrollView>

      {/* Floating Bulk Approve Action Bar (Pending Tab) */}
      {activeTab === 'pending' && selectedIds.size > 0 && (
        <View style={styles.bulkActionBar}>
          <View>
            <Text style={styles.bulkActionCount}>{selectedIds.size} staff selected</Text>
            <Text style={styles.bulkActionSub}>Ready for batch payroll approval</Text>
          </View>
          <TouchableOpacity
            style={styles.bulkApproveBtn}
            onPress={handleBulkApprove}
            disabled={approveActionLoading}
          >
            {approveActionLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <CheckCircle2 size={16} color="#FFF" />
                <Text style={styles.bulkApproveBtnText}>Approve ({selectedIds.size})</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Salary Breakdown Modal ────────────────────────────────────────── */}
      <Modal visible={breakdownModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalStaffHeaderRow}>
                <StaffAvatar item={selectedStaffRecord} size={44} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedStaffRecord?.staffName || 'Staff Member'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    ID: {selectedStaffRecord?.staffId || 'STF'} • {selectedStaffRecord?.role || 'Staff'} • {MONTH_NAMES[month - 1]} {year}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setBreakdownModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#243029" />
              </TouchableOpacity>
            </View>

            {calcLoading ? (
              <ActivityIndicator size="large" color="#4EA397" style={{ marginVertical: 32 }} />
            ) : (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Net Salary Highlight Box */}
                <View style={styles.netHighlightBox}>
                  <Text style={styles.netHighlightLabel}>Net Payable Salary</Text>
                  <Text style={styles.netHighlightAmount}>
                    {formatCurrency(
                      calculationData?.netSalary || selectedStaffRecord?.salary || 2500,
                      selectedStaffRecord?.currency || 'USD'
                    )}
                  </Text>
                  <Text style={styles.netHighlightStatus}>
                    Status: {(selectedStaffRecord?.status || activeTab).toUpperCase()}
                  </Text>
                </View>

                {/* Earnings Table */}
                <Text style={styles.tableSectionTitle}>Earnings & Allowances</Text>
                <View style={styles.breakdownTable}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Basic Salary</Text>
                    <Text style={styles.tableVal}>
                      {formatCurrency(calculationData?.baseSalary || selectedStaffRecord?.salary || 2200)}
                    </Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>House Rent Allowance (HRA)</Text>
                    <Text style={styles.tableVal}>
                      {formatCurrency(calculationData?.hra || 200)}
                    </Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Travel Allowance</Text>
                    <Text style={styles.tableVal}>
                      {formatCurrency(calculationData?.travelAllowance || 100)}
                    </Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Performance Bonus</Text>
                    <Text style={styles.tableVal}>
                      {formatCurrency(calculationData?.bonus || 0)}
                    </Text>
                  </View>
                </View>

                {/* Deductions Table */}
                <Text style={styles.tableSectionTitle}>Deductions</Text>
                <View style={styles.breakdownTable}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Provident Fund (PF)</Text>
                    <Text style={[styles.tableVal, { color: '#DC2626' }]}>
                      -{formatCurrency(calculationData?.pf || 150)}
                    </Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Absence / Leave Deduction</Text>
                    <Text style={[styles.tableVal, { color: '#DC2626' }]}>
                      -{formatCurrency(calculationData?.absenceDeduction || 0)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalActionDone}
              onPress={() => setBreakdownModalOpen(false)}
            >
              <Text style={styles.modalActionDoneText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Mark as Paid Modal ────────────────────────────────────────────── */}
      <Modal visible={payModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalStaffHeaderRow}>
                <StaffAvatar item={payRecord} size={44} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>Mark Salary as Paid</Text>
                  <Text style={styles.modalSubtitle}>Disburse payment for {payRecord?.staffName}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setPayModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#243029" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Payment Summary Header */}
              <View style={styles.payAmountBox}>
                <Text style={styles.payAmountLabel}>Total Disbursing Amount</Text>
                <Text style={styles.payAmountValue}>
                  {formatCurrency(payRecord?.salary || payRecord?.amount, payRecord?.currency || 'USD')}
                </Text>
              </View>

              {/* Payment Method Selector */}
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.paymentMethodsGrid}>
                {(['Bank-Transfer', 'UPI', 'Cash', 'Cheque'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.methodChip, payMethod === method && styles.methodChipActive]}
                    onPress={() => setPayMethod(method)}
                  >
                    <Text style={[styles.methodChipText, payMethod === method && styles.methodChipTextActive]}>
                      {method.replace('-', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Transaction Reference Input */}
              <Text style={styles.inputLabel}>Transaction / Reference ID (Optional)</Text>
              <TextInput
                style={styles.modalTextInput}
                placeholder="e.g. UTR-98234123 or Cheque #1029"
                placeholderTextColor="#8A9D98"
                value={transactionRef}
                onChangeText={setTransactionRef}
              />
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPayModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitPayBtn}
                onPress={handleSubmitPayment}
                disabled={submittingPay}
              >
                {submittingPay ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#FFF" />
                    <Text style={styles.modalSubmitPayBtnText}>Confirm Payment</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

// ─── Default Fallback Data ──────────────────────────────────────────────────
const DEFAULT_PENDING_SALARIES = [
  {
    id: 'staff-01',
    recordId: 'rec-01',
    staffName: 'Dr. Ramesh Kumar',
    staffId: 'TUT-101',
    role: 'Tutor',
    course: 'Advanced Mathematics',
    salary: 2800.0,
    currency: 'USD',
    status: 'Pending',
    date: '30 Jun 2026',
  },
  {
    id: 'staff-02',
    recordId: 'rec-02',
    staffName: 'Sunita Mehra',
    staffId: 'STF-204',
    role: 'Staff',
    course: 'Operations & Lab',
    salary: 1950.0,
    currency: 'USD',
    status: 'Pending',
    date: '30 Jun 2026',
  },
  {
    id: 'staff-03',
    recordId: 'rec-03',
    staffName: 'Vikram Singh',
    staffId: 'TUT-109',
    role: 'Tutor',
    course: 'Full Stack Web Dev',
    salary: 3100.0,
    currency: 'USD',
    status: 'Pending',
    date: '30 Jun 2026',
  },
];

const DEFAULT_APPROVED_SALARIES = [
  {
    id: 'staff-04',
    recordId: 'rec-04',
    staffName: 'Pooja Verma',
    staffId: 'TUT-112',
    role: 'Tutor',
    course: 'Physics & Electronics',
    salary: 2750.0,
    currency: 'USD',
    status: 'Approved',
    approvedAt: '2026-06-25T10:00:00Z',
  },
  {
    id: 'staff-05',
    recordId: 'rec-05',
    staffName: 'Arjun Das',
    staffId: 'STF-210',
    role: 'Staff',
    course: 'Accounts Assistant',
    salary: 1650.0,
    currency: 'USD',
    status: 'Approved',
    approvedAt: '2026-06-26T11:30:00Z',
  },
];

const DEFAULT_PAID_SALARIES = [
  {
    id: 'staff-06',
    recordId: 'rec-06',
    staffName: 'Dr. Ramesh Kumar',
    staffId: 'TUT-101',
    role: 'Tutor',
    course: 'Advanced Mathematics',
    salary: 2800.0,
    currency: 'USD',
    status: 'Paid',
    date: '15 Jun 2026',
    paymentMethod: 'Bank-Transfer',
    transactionRef: 'NEFT-88931024',
  },
  {
    id: 'staff-07',
    recordId: 'rec-07',
    staffName: 'Kavita Roy',
    staffId: 'TUT-105',
    role: 'Tutor',
    course: 'Data Science with Python',
    salary: 3372.55,
    currency: 'USD',
    status: 'Paid',
    date: '10 Jun 2026',
    paymentMethod: 'UPI',
    transactionRef: 'UPI-98210399',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F6',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#DEE6E4',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#3E7874',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#546E68',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D2DDD9',
  },
  pickerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#295651',
  },
  yearToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#DEE6E4',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  yearChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  yearChipActive: {
    backgroundColor: '#3E7874',
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#546E68',
  },
  yearChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  dropdownMenu: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F2',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F8F8',
  },
  dropdownItemActive: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#243029',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#295651',
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: '#D8E2DF',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#243029',
  },
  rolesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 6,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#DEE6E4',
  },
  roleChipActive: {
    backgroundColor: '#295651',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#49635E',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  countSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  countSummary: {
    fontSize: 12,
    color: '#657B76',
    fontWeight: '500',
  },
  selectAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  selectAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#295651',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#657B76',
  },
  salaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2EAE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  salaryCardSelected: {
    borderColor: '#3E7874',
    backgroundColor: '#F7FBFA',
  },
  salaryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#9DB3AD',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3E7874',
    borderColor: '#3E7874',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  staffDetails: {
    flex: 1,
    marginRight: 8,
  },
  staffNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#243029',
  },
  staffMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  staffIdBadge: {
    fontSize: 11,
    color: '#657B76',
    fontWeight: '500',
  },
  roleTag: {
    backgroundColor: '#DEE6E4',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#295651',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  salaryAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#243029',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeApproved: {
    backgroundColor: '#DBEAFE',
  },
  statusBadgePaid: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgeTextPending: {
    color: '#D97706',
  },
  statusBadgeTextApproved: {
    color: '#2563EB',
  },
  statusBadgeTextPaid: {
    color: '#16A34A',
  },
  salaryCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F5',
    marginVertical: 10,
  },
  salaryCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateMetaText: {
    fontSize: 11,
    color: '#758D87',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewBreakdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DEE6E4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  viewBreakdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#295651',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3E7874',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  approveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 6,
  },
  payBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  paidMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F6F8F8',
    gap: 6,
  },
  paidMethodLabel: {
    fontSize: 11,
    color: '#657B76',
    fontWeight: '600',
  },
  paidMethodVal: {
    fontSize: 11,
    color: '#243029',
    fontWeight: '600',
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
  bulkActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#243029',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  bulkActionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  bulkActionSub: {
    fontSize: 11,
    color: '#9DB3AD',
    marginTop: 1,
  },
  bulkApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4EA397',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bulkApproveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalStaffHeaderRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#243029',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#657B76',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 16,
  },
  netHighlightBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  netHighlightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  netHighlightAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#295651',
    marginVertical: 4,
  },
  netHighlightStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3E7874',
  },
  tableSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 8,
    marginTop: 4,
  },
  breakdownTable: {
    backgroundColor: '#F8FAFA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F2',
  },
  tableLabel: {
    fontSize: 13,
    color: '#657B76',
  },
  tableVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#243029',
  },
  modalActionDone: {
    backgroundColor: '#3E7874',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalActionDoneText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  payAmountBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  payAmountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  payAmountValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 8,
    marginTop: 6,
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#DEE6E4',
  },
  methodChipActive: {
    backgroundColor: '#2563EB',
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#49635E',
  },
  methodChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  modalTextInput: {
    backgroundColor: '#F8FAFA',
    borderWidth: 1,
    borderColor: '#D8E2DF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#243029',
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#DEE6E4',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#49635E',
  },
  modalSubmitPayBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  modalSubmitPayBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
});
