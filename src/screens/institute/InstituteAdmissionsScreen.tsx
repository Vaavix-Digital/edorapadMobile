import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Eye,
  X,
  Check,
  User,
  Mail,
  Phone,
  BookOpen,
  ShieldCheck,
  Calendar,
  DollarSign,
  ChevronRight,
  Home,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { THEME } from '../../shared/constants/theme';
import { RootState, AppDispatch } from '../../store';
import {
  fetchAdmissionRequests,
  updateAdmissionStatus,
} from '../../store/slices/instituteSlice';

export const InstituteAdmissionsScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { admissionRequests, loading } = useSelector(
    (state: RootState) => state.institute
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAdmissionRequests());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAdmissionRequests());
    setRefreshing(false);
  };

  const filteredAdmissions = useMemo(() => {
    if (!admissionRequests || !Array.isArray(admissionRequests)) return [];
    return admissionRequests.filter((adm) => {
      const idStr = (adm.customAdmissionId || adm.id || adm._id || '').toLowerCase();
      const firstName = adm.studentFirstName || adm.student?.firstName || adm.name || '';
      const lastName = adm.studentLastName || adm.student?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
      const courseTitle = (adm.course?.title || adm.courseName || adm.course || '').toLowerCase();
      const status = (adm.status || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      return (
        !q ||
        idStr.includes(q) ||
        fullName.includes(q) ||
        courseTitle.includes(q) ||
        status.includes(q)
      );
    });
  }, [admissionRequests, searchQuery]);

  const handleStatusUpdate = (id: string, status: 'Approved' | 'Rejected') => {
    Alert.alert(
      `${status} Admission`,
      `Are you sure you want to mark this admission as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdatingId(id);
            try {
              await dispatch(updateAdmissionStatus({ id, status })).unwrap();
              if (selectedAdmission && (selectedAdmission.id || selectedAdmission._id) === id) {
                setSelectedAdmission((prev: any) => ({ ...prev, status }));
              }
            } catch (err: any) {
              Alert.alert('Error', err || 'Failed to update admission status');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const renderStatusTag = (status: string) => {
    const s = (status || 'Pending').toLowerCase();
    let bg = '#FEF3C7';
    let text = '#D97706';
    let border = '#FDE68A';

    if (s === 'approved') {
      bg = '#DCFCE7';
      text = '#15803D';
      border = '#BBF7D0';
    } else if (s === 'rejected') {
      bg = '#FEE2E2';
      text = '#B91C1C';
      border = '#FECACA';
    }

    return (
      <View style={[styles.statusTag, { backgroundColor: bg, borderColor: border }]}>
        <Text style={[styles.statusTagText, { color: text }]}>
          {status || 'Pending'}
        </Text>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <Header
        title="Admission"
        subtitle="Manage student enrollment applications"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Breadcrumb */}
      <View style={styles.breadcrumbRow}>
        <Home size={13} color="#64748B" />
        <ChevronRight size={13} color="#94A3B8" />
        <Text style={styles.breadcrumbText}>Admissions</Text>
      </View>

      {/* Web-Style Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color="#94A3B8" style={styles.searchLeftIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search admissions by ID, name, or course..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.85}>
          <Search size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Table / List Container */}
      <View style={styles.tableOuterCard}>
        {/* Table Header Bar */}
        <View style={styles.tableHeaderBar}>
          <Text style={[styles.thText, { flex: 2.2 }]}>Admission ID</Text>
          <Text style={[styles.thText, { flex: 2.2 }]}>Name</Text>
          <Text style={[styles.thText, { flex: 2 }]}>Course</Text>
          <Text style={[styles.thText, { flex: 1.6, textAlign: 'center' }]}>Status</Text>
          <Text style={[styles.thText, { width: 36, textAlign: 'center' }]}>Act</Text>
        </View>

        {loading && !refreshing && admissionRequests.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0F766E" />
            <Text style={styles.loadingText}>Loading admissions from server...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAdmissions}
            keyExtractor={(item, index) => item.id || item._id || item.customAdmissionId || String(index)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No admission requests found</Text>
                <Text style={styles.emptySubtitle}>Try changing your search keywords</Text>
              </View>
            }
            renderItem={({ item }) => {
              const firstName = item.studentFirstName || item.student?.firstName || item.name || '';
              const lastName = item.studentLastName || item.student?.lastName || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'Student Applicant';
              const idDisplay = item.customAdmissionId || item.id || 'Pending ID';
              const courseTitle = item.course?.title || item.courseName || 'Course';

              return (
                <View style={styles.tableRow}>
                  {/* Admission ID */}
                  <View style={{ flex: 2.2 }}>
                    <Text style={styles.cellId} numberOfLines={1}>
                      {idDisplay}
                    </Text>
                  </View>

                  {/* Student Name */}
                  <View style={{ flex: 2.2, paddingHorizontal: 4 }}>
                    <Text style={styles.cellName} numberOfLines={2}>
                      {fullName}
                    </Text>
                  </View>

                  {/* Course Title */}
                  <View style={{ flex: 2, paddingHorizontal: 4 }}>
                    <Text style={styles.cellCourse} numberOfLines={2}>
                      {courseTitle}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View style={{ flex: 1.6, alignItems: 'center' }}>
                    {renderStatusTag(item.status)}
                  </View>

                  {/* Action Eye Button */}
                  <View style={{ width: 36, alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      activeOpacity={0.7}
                      onPress={() => setSelectedAdmission(item)}
                    >
                      <Eye size={15} color="#475569" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Details Modal */}
      <Modal
        visible={!!selectedAdmission}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAdmission(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAdmission && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Admission Details</Text>
                    <Text style={styles.modalSubtitle}>
                      ID: {selectedAdmission.customAdmissionId || selectedAdmission.id || 'N/A'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedAdmission(null)}
                  >
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                  {/* Status Banner */}
                  <View style={styles.modalStatusRow}>
                    <Text style={styles.modalSectionHeading}>Application Status</Text>
                    {renderStatusTag(selectedAdmission.status)}
                  </View>

                  {/* Student Info Card */}
                  <View style={styles.detailSectionCard}>
                    <View style={styles.sectionHeaderRow}>
                      <User size={16} color="#0F766E" />
                      <Text style={styles.sectionHeaderText}>Student Information</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Full Name</Text>
                      <Text style={styles.infoValue}>
                        {selectedAdmission.studentFirstName || selectedAdmission.name || ''}{' '}
                        {selectedAdmission.studentLastName || ''}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={[styles.infoValue, { color: '#0F766E' }]}>
                        {selectedAdmission.studentEmail || selectedAdmission.email || 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Phone</Text>
                      <Text style={styles.infoValue}>
                        {selectedAdmission.studentPhone || selectedAdmission.phone || 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Identity Proof</Text>
                      <Text style={styles.infoValue}>
                        {selectedAdmission.studentIdProofType || 'Aadhaar Card'}
                      </Text>
                    </View>
                  </View>

                  {/* Course Info Card */}
                  <View style={styles.detailSectionCard}>
                    <View style={styles.sectionHeaderRow}>
                      <BookOpen size={16} color="#0F766E" />
                      <Text style={styles.sectionHeaderText}>Course Applied</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Course Title</Text>
                      <Text style={[styles.infoValue, { fontWeight: '700' }]}>
                        {selectedAdmission.course?.title || selectedAdmission.courseName || 'Mern Programming'}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Course Fee</Text>
                      <Text style={[styles.infoValue, { color: '#0F766E', fontWeight: '800' }]}>
                        {selectedAdmission.course?.price || '₹25,000'}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Submitted Date</Text>
                      <Text style={styles.infoValue}>
                        {selectedAdmission.createdAt
                          ? new Date(selectedAdmission.createdAt).toLocaleDateString()
                          : 'Recent'}
                      </Text>
                    </View>
                  </View>

                  {/* Guardian Info Card */}
                  <View style={styles.detailSectionCard}>
                    <View style={styles.sectionHeaderRow}>
                      <ShieldCheck size={16} color="#0F766E" />
                      <Text style={styles.sectionHeaderText}>Guardian Information</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Guardian Name</Text>
                      <Text style={styles.infoValue}>
                        {selectedAdmission.guardianFirstName || 'Guardian'}{' '}
                        {selectedAdmission.guardianLastName || ''}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Relation</Text>
                      <Text style={styles.infoValue}>
                        {selectedAdmission.guardianRelation || 'Parent'}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Guardian Phone</Text>
                      <Text style={styles.infoValue}>
                        {selectedAdmission.guardianPhone || selectedAdmission.studentPhone || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Modal Actions */}
                {selectedAdmission.status === 'Pending' && (
                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={styles.modalRejectBtn}
                      disabled={updatingId === selectedAdmission.id}
                      onPress={() => handleStatusUpdate(selectedAdmission.id || selectedAdmission._id, 'Rejected')}
                    >
                      <X size={16} color="#DC2626" />
                      <Text style={styles.modalRejectText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalApproveBtn}
                      disabled={updatingId === selectedAdmission.id}
                      onPress={() => handleStatusUpdate(selectedAdmission.id || selectedAdmission._id, 'Approved')}
                    >
                      <Check size={16} color="#FFFFFF" />
                      <Text style={styles.modalApproveText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
  },
  searchLeftIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E293B',
    paddingVertical: 0,
  },
  searchBtn: {
    width: 46,
    height: 46,
    backgroundColor: '#0F766E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableOuterCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: 12,
    padding: 8,
    flex: 1,
    marginBottom: 16,
  },
  tableHeaderBar: {
    backgroundColor: '#54A39A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  thText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    minHeight: 180,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cellId: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  cellName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  cellCourse: {
    fontSize: 11.5,
    color: '#475569',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  eyeBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    gap: 14,
    paddingBottom: 20,
  },
  modalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  modalSectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  detailSectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
    maxWidth: '60%',
    textAlign: 'right',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 6,
  },
  modalRejectText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13.5,
  },
  modalApproveBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0F766E',
    gap: 6,
  },
  modalApproveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
});
