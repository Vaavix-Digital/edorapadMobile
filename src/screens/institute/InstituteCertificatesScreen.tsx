import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Linking,
} from 'react-native';
import {
  Award,
  Clock,
  CheckCircle2,
  FileText,
  GraduationCap,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Check,
  Calendar,
  BookOpen,
  Layers,
  ChevronDown,
  Download,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchCertificateStats,
  fetchCertificateRequests,
  approveCertificateRequestThunk,
  bulkApproveCertificateRequestsThunk,
  fetchCertificateTemplates,
  createCertificateTemplateThunk,
  deleteCertificateTemplateThunk,
  fetchIssuedCertificates,
  generateCertificateThunk,
  deleteIssuedCertificateThunk,
} from '../../store/slices/certificateSlice';
import {
  fetchInstituteCourses,
  fetchInstituteBatches,
} from '../../store/slices/instituteSlice';
import {
  CertificateRequest,
  CertificateTemplate,
  IssuedCertificate,
} from '../../shared/types';
import { instituteApi } from '../../shared/api/instituteApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d?: string) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
};

const CERT_TYPES = [
  { id: 'completion', label: 'Completion' },
  { id: 'participation', label: 'Participation' },
  { id: 'excellence', label: 'Excellence' },
  { id: 'achievement', label: 'Achievement' },
];

const PRESET_COLORS = [
  '#0F766E',
  '#14B8A6',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#0F172A',
  '#FFFEF7',
];

export const InstituteCertificatesScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { stats, requests, templates, certificates, loading } = useAppSelector(
    (state) => state.certificate
  );
  const { courses, batches } = useAppSelector((state) => state.institute);

  const [activeTab, setActiveTab] = useState<'requests' | 'templates' | 'certificates'>(
    'requests'
  );
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'all'
  );
  const [certSearchQuery, setCertSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Selection for bulk actions
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);

  // Students list for issuing certificate dropdown
  const [studentsList, setStudentsList] = useState<any[]>([]);

  // Modals
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Issue Certificate Modal
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [issueStudentId, setIssueStudentId] = useState('');
  const [issueCourseId, setIssueCourseId] = useState('');
  const [issueBatchId, setIssueBatchId] = useState('');
  const [issueTemplateId, setIssueTemplateId] = useState('');
  const [issueType, setIssueType] = useState('completion');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [issueIssuedBy, setIssueIssuedBy] = useState('Principal / Administrator');
  const [issueSubmitting, setIssueSubmitting] = useState(false);

  // Pickers inside Issue Modal
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  const [batchPickerOpen, setBatchPickerOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // Create Template Modal
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempTitle, setTempTitle] = useState('Certificate of Completion');
  const [tempInstitute, setTempInstitute] = useState('Edorapad Academy');
  const [tempFooter, setTempFooter] = useState('with dedication and excellence');
  const [tempPrimaryColor, setTempPrimaryColor] = useState('#0F766E');
  const [tempSecondaryColor, setTempSecondaryColor] = useState('#14B8A6');
  const [tempBgColor, setTempBgColor] = useState('#FFFEF7');
  const [tempIsDefault, setTempIsDefault] = useState(false);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    type: 'template' | 'certificate';
    id: string;
    name: string;
  } | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // ─── Data Loader ────────────────────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchCertificateStats()),
      dispatch(fetchCertificateRequests(null)),
      dispatch(fetchCertificateTemplates(null)),
      dispatch(fetchIssuedCertificates(undefined)),
      dispatch(fetchInstituteCourses()),
      dispatch(fetchInstituteBatches()),
    ]);
    try {
      const stdRes = await instituteApi.getAllStudents();
      if (stdRes.success && stdRes.data) {
        setStudentsList(stdRes.data);
      }
    } catch {
      // Ignored fallback
    }
  }, [dispatch]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  // ─── Stat Counts ────────────────────────────────────────────────────────────
  const pendingCount =
    stats?.pendingRequests ??
    requests.filter((r) => (r.status || '').toLowerCase() === 'pending').length;
  const approvedCount =
    stats?.approvedRequests ??
    requests.filter((r) => (r.status || '').toLowerCase() === 'approved').length;
  const generatedCount =
    stats?.generatedCertificates ?? certificates.length;
  const templatesCount =
    stats?.templatesCount ?? templates.length;

  // ─── Filtered Requests ──────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (requestFilter === 'all') return true;
      return (r.status || '').toLowerCase() === requestFilter.toLowerCase();
    });
  }, [requests, requestFilter]);

  // ─── Filtered Certificates ──────────────────────────────────────────────────
  const filteredCertificates = useMemo(() => {
    if (!certSearchQuery.trim()) return certificates;
    const q = certSearchQuery.toLowerCase();
    return certificates.filter((c) => {
      const stName = c.student?.name || '';
      const courseTitle = c.course?.title || c.course?.name || '';
      const batchName = c.batch?.name || '';
      const certNo = c.certificateNumber || '';
      return (
        stName.toLowerCase().includes(q) ||
        courseTitle.toLowerCase().includes(q) ||
        batchName.toLowerCase().includes(q) ||
        certNo.toLowerCase().includes(q)
      );
    });
  }, [certificates, certSearchQuery]);

  // ─── Request Selection Handlers ─────────────────────────────────────────────
  const toggleSelectRequest = (id: string) => {
    if (selectedRequestIds.includes(id)) {
      setSelectedRequestIds(selectedRequestIds.filter((x) => x !== id));
    } else {
      setSelectedRequestIds([...selectedRequestIds, id]);
    }
  };

  const selectAllPending = () => {
    const pendingIds = requests
      .filter((r) => (r.status || '').toLowerCase() === 'pending')
      .map((r) => r.id || r._id || '');
    setSelectedRequestIds(pendingIds.filter(Boolean));
  };

  const clearSelection = () => {
    setSelectedRequestIds([]);
  };

  const handleBulkAction = async (status: 'approved' | 'rejected') => {
    if (selectedRequestIds.length === 0) return;
    try {
      const res = await dispatch(
        bulkApproveCertificateRequestsThunk({
          requestIds: selectedRequestIds,
          status,
        })
      );
      if (bulkApproveCertificateRequestsThunk.fulfilled.match(res)) {
        Alert.alert('Success', `Bulk ${status} completed.`);
        setSelectedRequestIds([]);
      } else {
        Alert.alert('Error', (res.payload as string) || 'Bulk action failed.');
      }
    } catch {
      Alert.alert('Error', 'An error occurred during bulk action.');
    }
  };

  // ─── Review Single Request Handlers ─────────────────────────────────────────
  const openReviewModal = (req: CertificateRequest) => {
    setSelectedRequest(req);
    setReviewDecision('approved');
    setReviewReason('');
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!selectedRequest) return;
    const reqId = selectedRequest.id || selectedRequest._id || '';
    if (!reqId) return;

    setReviewSubmitting(true);
    try {
      const res = await dispatch(
        approveCertificateRequestThunk({
          requestId: reqId,
          data: {
            status: reviewDecision,
            statusReason: reviewReason.trim() || undefined,
          },
        })
      );
      if (approveCertificateRequestThunk.fulfilled.match(res)) {
        Alert.alert(
          'Success',
          `Request ${reviewDecision === 'approved' ? 'approved' : 'rejected'} successfully!`
        );
        setReviewModalVisible(false);
        setSelectedRequest(null);
      } else {
        Alert.alert('Error', (res.payload as string) || 'Failed to update request.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ─── Issue Certificate Handlers ─────────────────────────────────────────────
  const openIssueModal = (prefill?: {
    studentId?: string;
    courseId?: string;
    batchId?: string;
  }) => {
    setIssueStudentId(prefill?.studentId || (studentsList[0]?.id || studentsList[0]?._id || ''));
    setIssueCourseId(prefill?.courseId || (courses[0]?.id || courses[0]?._id || ''));
    setIssueBatchId(prefill?.batchId || (batches[0]?.id || batches[0]?._id || ''));
    setIssueTemplateId(templates[0]?.id || templates[0]?._id || '');
    setIssueType('completion');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setIssueIssuedBy('Principal / Administrator');
    setIssueModalVisible(true);
  };

  const submitIssueCertificate = async () => {
    if (!issueStudentId) {
      Alert.alert('Missing Field', 'Please select a student.');
      return;
    }
    if (!issueCourseId) {
      Alert.alert('Missing Field', 'Please select a course.');
      return;
    }
    if (!issueBatchId) {
      Alert.alert('Missing Field', 'Please select a batch.');
      return;
    }
    if (!issueTemplateId) {
      Alert.alert('Missing Field', 'Please select a certificate template.');
      return;
    }

    setIssueSubmitting(true);
    try {
      const payload = {
        studentId: issueStudentId,
        courseId: issueCourseId,
        batchId: issueBatchId,
        templateId: issueTemplateId,
        certificateType: issueType,
        issueDate: issueDate,
        issuedBy: issueIssuedBy.trim() || 'Principal / Administrator',
      };

      const res = await dispatch(generateCertificateThunk(payload));
      if (generateCertificateThunk.fulfilled.match(res)) {
        Alert.alert('Success', 'Certificate generated and issued successfully!');
        setIssueModalVisible(false);
        setActiveTab('certificates');
      } else {
        Alert.alert('Error', (res.payload as string) || 'Failed to generate certificate.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIssueSubmitting(false);
    }
  };

  // ─── Template Creation Handlers ─────────────────────────────────────────────
  const openCreateTemplateModal = () => {
    setTempName('');
    setTempTitle('Certificate of Completion');
    setTempInstitute('Edorapad Academy');
    setTempFooter('with dedication and excellence');
    setTempPrimaryColor('#0F766E');
    setTempSecondaryColor('#14B8A6');
    setTempBgColor('#FFFEF7');
    setTempIsDefault(false);
    setTemplateModalVisible(true);
  };

  const submitCreateTemplate = async () => {
    if (!tempName.trim()) {
      Alert.alert('Missing Field', 'Please enter a template name.');
      return;
    }

    setTemplateSubmitting(true);
    try {
      const payload = {
        name: tempName.trim(),
        certificateTitle: tempTitle.trim(),
        instituteName: tempInstitute.trim(),
        footerText: tempFooter.trim(),
        primaryColor: tempPrimaryColor,
        secondaryColor: tempSecondaryColor,
        backgroundColor: tempBgColor,
        isDefault: tempIsDefault,
        fontFamily: 'Inter',
        borderStyle: 'classic',
      };

      const res = await dispatch(createCertificateTemplateThunk(payload));
      if (createCertificateTemplateThunk.fulfilled.match(res)) {
        Alert.alert('Success', 'Template created successfully!');
        setTemplateModalVisible(false);
      } else {
        Alert.alert('Error', (res.payload as string) || 'Failed to create template.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setTemplateSubmitting(false);
    }
  };

  // ─── Delete Item Handlers ───────────────────────────────────────────────────
  const confirmDeleteItem = async () => {
    if (!deleteItem) return;
    setDeleteSubmitting(true);
    try {
      if (deleteItem.type === 'template') {
        const res = await dispatch(deleteCertificateTemplateThunk(deleteItem.id));
        if (deleteCertificateTemplateThunk.fulfilled.match(res)) {
          Alert.alert('Deleted', 'Template deleted successfully.');
        } else {
          Alert.alert('Error', (res.payload as string) || 'Failed to delete template.');
        }
      } else {
        const res = await dispatch(deleteIssuedCertificateThunk(deleteItem.id));
        if (deleteIssuedCertificateThunk.fulfilled.match(res)) {
          Alert.alert('Deleted', 'Certificate deleted successfully.');
        } else {
          Alert.alert('Error', (res.payload as string) || 'Failed to delete certificate.');
        }
      }
      setDeleteModalVisible(false);
      setDeleteItem(null);
    } catch {
      Alert.alert('Error', 'An error occurred while deleting.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // ─── Status Badge Colors ────────────────────────────────────────────────────
  const renderStatusBadge = (status?: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'approved') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeApproved]}>
          <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.statusBadgeText, { color: '#065F46' }]}>Approved</Text>
        </View>
      );
    }
    if (s === 'rejected') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeRejected]}>
          <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.statusBadgeText, { color: '#991B1B' }]}>Rejected</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusBadgePending]}>
        <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
        <Text style={[styles.statusBadgeText, { color: '#92400E' }]}>Pending</Text>
      </View>
    );
  };

  // ─── Render Request Item ────────────────────────────────────────────────────
  const renderRequestItem = ({ item }: { item: CertificateRequest }) => {
    const reqId = item.id || item._id || '';
    const isPending = (item.status || '').toLowerCase() === 'pending';
    const isApproved = (item.status || '').toLowerCase() === 'approved';
    const isSelected = selectedRequestIds.includes(reqId);

    const studentName = item.student?.name || 'Student';
    const studentEmail = item.student?.email || item.student?.studentCustomId || '';
    const courseTitle = item.course?.title || item.course?.name || 'General Course';
    const batchName = item.batch?.name || 'Batch';

    return (
      <View style={styles.cardItem}>
        {/* Card Header */}
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
            {isPending && (
              <TouchableOpacity
                onPress={() => toggleSelectRequest(reqId)}
                style={[styles.checkboxWrap, isSelected && styles.checkboxWrapActive]}
                activeOpacity={0.8}
              >
                {isSelected && <Check size={12} color="#FFF" />}
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleText}>{studentName}</Text>
              {studentEmail ? <Text style={styles.cardSubtitleText}>{studentEmail}</Text> : null}
            </View>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        {/* Course & Batch Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <BookOpen size={13} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.infoBlockText} numberOfLines={1}>
              {courseTitle}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Layers size={13} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.infoBlockText} numberOfLines={1}>
              {batchName}
            </Text>
          </View>
        </View>

        {/* Remarks if present */}
        {item.tutorRemarks ? (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksLabel}>REMARKS:</Text>
            <Text style={styles.remarksText}>{item.tutorRemarks}</Text>
          </View>
        ) : null}

        {/* Footer: Date & Actions */}
        <View style={styles.cardFooterRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Calendar size={12} color="#94A3B8" style={{ marginRight: 4 }} />
            <Text style={styles.dateLabel}>{formatDate(item.createdAt)}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isPending && (
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => openReviewModal(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.reviewBtnText}>Review</Text>
              </TouchableOpacity>
            )}

            {isApproved && (
              <TouchableOpacity
                style={styles.issueBtn}
                onPress={() =>
                  openIssueModal({
                    studentId: item.studentId || item.student?.id || item.student?._id,
                    courseId: item.courseId || item.course?.id || item.course?._id,
                    batchId: item.batchId || item.batch?.id || item.batch?._id,
                  })
                }
                activeOpacity={0.8}
              >
                <Award size={13} color="#0F766E" style={{ marginRight: 4 }} />
                <Text style={styles.issueBtnText}>Issue Certificate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─── Render Template Item ───────────────────────────────────────────────────
  const renderTemplateItem = ({ item }: { item: CertificateTemplate }) => {
    const tempId = item.id || item._id || '';

    return (
      <View style={styles.cardItem}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitleText}>{item.name}</Text>
            <Text style={styles.cardSubtitleText}>
              {item.certificateTitle || 'Certificate of Completion'}
            </Text>
          </View>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>DEFAULT</Text>
            </View>
          )}
        </View>

        {/* Swatches & Institute Info */}
        <View style={styles.templateMetaRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.metaLabel}>INSTITUTE: {item.instituteName || 'Edorapad'}</Text>
            <Text style={styles.dateLabel}>Created: {formatDate(item.createdAt)}</Text>
          </View>

          {/* Color Palettes */}
          <View style={styles.colorPaletteWrap}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: item.primaryColor || '#0F766E' },
              ]}
            />
            <View
              style={[
                styles.colorDot,
                { backgroundColor: item.secondaryColor || '#14B8A6' },
              ]}
            />
            <View
              style={[
                styles.colorDot,
                {
                  backgroundColor: item.backgroundColor || '#FFFEF7',
                  borderColor: '#CBD5E1',
                  borderWidth: 1,
                },
              ]}
            />
          </View>
        </View>

        {/* Template Actions */}
        <View style={styles.cardFooterRow}>
          <View />
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              setDeleteItem({ type: 'template', id: tempId, name: item.name });
              setDeleteModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Trash2 size={13} color="#EF4444" style={{ marginRight: 4 }} />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Render Generated Certificate Item ──────────────────────────────────────
  const renderCertificateItem = ({ item }: { item: IssuedCertificate }) => {
    const certId = item.id || item._id || '';
    const studentName = item.student?.name || 'Student';
    const studentEmail = item.student?.email || '';
    const courseTitle = item.course?.title || item.course?.name || 'General Course';
    const batchName = item.batch?.name || 'Batch';
    const certNumber = item.certificateNumber || `EDR-${certId.substring(0, 8).toUpperCase()}`;

    const isUploaded = item.certificateUrl === null;
    const hasDownloadUrl = Boolean(item.certificateUrl);

    return (
      <View style={styles.cardItem}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitleText}>{studentName}</Text>
            {studentEmail ? <Text style={styles.cardSubtitleText}>{studentEmail}</Text> : null}
          </View>
          <View style={styles.certNumberBadge}>
            <Text style={styles.certNumberText}>{certNumber}</Text>
          </View>
        </View>

        {/* Course & Batch */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <BookOpen size={13} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.infoBlockText} numberOfLines={1}>
              {courseTitle}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Layers size={13} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.infoBlockText} numberOfLines={1}>
              {batchName}
            </Text>
          </View>
        </View>

        {/* Type & Issuer */}
        <View style={styles.metaRowWithPill}>
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>
              {isUploaded ? 'Uploaded' : hasDownloadUrl ? 'Generated' : item.certificateType || 'Standard'}
            </Text>
          </View>
          <Text style={styles.issuerText}>By: {item.issuedBy || 'Admin'}</Text>
          <Text style={styles.dateLabel}>{formatDate(item.createdAt || item.generatedAt)}</Text>
        </View>

        {/* Footer Actions */}
        <View style={styles.cardFooterRow}>
          <View />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {hasDownloadUrl && (
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => {
                  if (item.certificateUrl) {
                    Linking.openURL(item.certificateUrl).catch(() => {
                      Alert.alert('Error', 'Unable to open certificate link.');
                    });
                  }
                }}
                activeOpacity={0.8}
              >
                <Download size={13} color="#0F766E" style={{ marginRight: 4 }} />
                <Text style={styles.downloadBtnText}>View / PDF</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => {
                setDeleteItem({
                  type: 'certificate',
                  id: certId,
                  name: `${studentName}'s Certificate`,
                });
                setDeleteModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Trash2 size={13} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Selected names for Issue Modal
  const selectedStudentName =
    studentsList.find((s) => (s.id || s._id) === issueStudentId)?.name || 'Select Student';
  const selectedCourseName =
    courses.find((c) => (c.id || c._id) === issueCourseId)?.title || 'Select Course';
  const selectedBatchName =
    batches.find((b) => (b.id || b._id) === issueBatchId)?.name || 'Select Batch';
  const selectedTemplateName =
    templates.find((t) => (t.id || t._id) === issueTemplateId)?.name || 'Select Template';

  return (
    <ScreenContainer>
      {/* Header */}
      <Header
        title="Certificate Management"
        subtitle="Manage certificate requests, templates, and issued certificates"
        showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
        onBack={() => navigation?.goBack?.()}
        rightAction={
          <TouchableOpacity onPress={loadAllData} style={styles.refreshHeaderBtn}>
            <RefreshCw size={18} color="#1E293B" />
          </TouchableOpacity>
        }
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          {/* Pending Card */}
          <View style={[styles.statCard, styles.statCardAmber]}>
            <View style={styles.statTopRow}>
              <Text style={styles.statLabel}>PENDING</Text>
              <View style={[styles.statIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Clock size={16} color="#D97706" />
              </View>
            </View>
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statSub}>Awaiting approval</Text>
          </View>

          {/* Approved Card */}
          <View style={[styles.statCard, styles.statCardEmerald]}>
            <View style={styles.statTopRow}>
              <Text style={styles.statLabel}>APPROVED</Text>
              <View style={[styles.statIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <CheckCircle2 size={16} color="#16A34A" />
              </View>
            </View>
            <Text style={styles.statValue}>{approvedCount}</Text>
            <Text style={styles.statSub}>Ready to generate</Text>
          </View>

          {/* Generated Card */}
          <View style={[styles.statCard, styles.statCardViolet]}>
            <View style={styles.statTopRow}>
              <Text style={styles.statLabel}>GENERATED</Text>
              <View style={[styles.statIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <GraduationCap size={16} color="#7C3AED" />
              </View>
            </View>
            <Text style={styles.statValue}>{generatedCount}</Text>
            <Text style={styles.statSub}>Certificates issued</Text>
          </View>

          {/* Templates Card */}
          <View style={[styles.statCard, styles.statCardTeal]}>
            <View style={styles.statTopRow}>
              <Text style={styles.statLabel}>TEMPLATES</Text>
              <View style={[styles.statIconCircle, { backgroundColor: '#CCFBF1' }]}>
                <FileText size={16} color="#0D9488" />
              </View>
            </View>
            <Text style={styles.statValue}>{templatesCount}</Text>
            <Text style={styles.statSub}>Available layouts</Text>
          </View>
        </ScrollView>
      </View>

      {/* ─── 3 Segmented Tabs ─── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'requests' && styles.tabButtonActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'requests' && styles.tabButtonTextActive,
            ]}
          >
            Requests
          </Text>
          {pendingCount > 0 ? (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'templates' && styles.tabButtonActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'templates' && styles.tabButtonTextActive,
            ]}
          >
            Templates
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'certificates' && styles.tabButtonActive]}
          onPress={() => setActiveTab('certificates')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'certificates' && styles.tabButtonTextActive,
            ]}
          >
            Certificates
          </Text>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 1: REQUESTS CONTENT ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <View style={{ flex: 1 }}>
          {/* Sub Header & Bulk Toolbar */}
          <View style={styles.toolbarRow}>
            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => {
                const isActive = requestFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setRequestFilter(f)}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      {f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Bulk Action Buttons Row */}
          {selectedRequestIds.length > 0 ? (
            <View style={styles.bulkActionBar}>
              <TouchableOpacity
                style={[styles.bulkBtn, { backgroundColor: '#10B981' }]}
                onPress={() => handleBulkAction('approved')}
              >
                <Text style={styles.bulkBtnText}>✓ Approve ({selectedRequestIds.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => handleBulkAction('rejected')}
              >
                <Text style={styles.bulkBtnText}>✕ Reject ({selectedRequestIds.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bulkClearBtn} onPress={clearSelection}>
                <Text style={styles.bulkClearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : pendingCount > 0 ? (
            <View style={styles.selectPendingBar}>
              <TouchableOpacity onPress={selectAllPending}>
                <Text style={styles.selectPendingText}>Select All Pending ({pendingCount})</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Requests List */}
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>Loading Requests...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRequests}
              keyExtractor={(item, idx) => item.id || item._id || String(idx)}
              renderItem={renderRequestItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Award size={32} color="#64748B" />
                  </View>
                  <Text style={styles.emptyTitle}>No Requests Found</Text>
                  <Text style={styles.emptySubtitle}>
                    Requests submitted by tutors will appear here for review.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 2: TEMPLATES CONTENT ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <View style={{ flex: 1 }}>
          <View style={styles.topControlBar}>
            <Text style={styles.tabSectionTitle}>Available Templates ({templates.length})</Text>
            <TouchableOpacity
              style={styles.newTemplateBtn}
              onPress={openCreateTemplateModal}
              activeOpacity={0.8}
            >
              <Plus size={15} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.newTemplateBtnText}>New Template</Text>
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>Loading Templates...</Text>
            </View>
          ) : (
            <FlatList
              data={templates}
              keyExtractor={(item, idx) => item.id || item._id || String(idx)}
              renderItem={renderTemplateItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <FileText size={32} color="#64748B" />
                  </View>
                  <Text style={styles.emptyTitle}>No Templates Found</Text>
                  <Text style={styles.emptySubtitle}>
                    Tap "+ New Template" to create your first certificate layout.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ─── TAB 3: CERTIFICATES CONTENT ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'certificates' && (
        <View style={{ flex: 1 }}>
          {/* Search bar */}
          <View style={styles.searchBarWrap}>
            <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by student, course, or batch..."
              placeholderTextColor="#94A3B8"
              value={certSearchQuery}
              onChangeText={setCertSearchQuery}
            />
            {certSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setCertSearchQuery('')}>
                <X size={14} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>Loading Certificates...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCertificates}
              keyExtractor={(item, idx) => item.id || item._id || String(idx)}
              renderItem={renderCertificateItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <GraduationCap size={32} color="#64748B" />
                  </View>
                  <Text style={styles.emptyTitle}>No Certificates Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {certSearchQuery
                      ? 'No certificates match your search query.'
                      : 'Certificates will appear here once generated.'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 1: REVIEW REQUEST MODAL ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.modalCard}>
            <View style={modalStyles.modalHeader}>
              <View>
                <Text style={modalStyles.modalTitle}>Review Certificate Request</Text>
                <Text style={modalStyles.modalSubtitle}>
                  {selectedRequest?.student?.name} · {selectedRequest?.course?.title || selectedRequest?.course?.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
                style={modalStyles.closeBtn}
              >
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Decision Toggle */}
            <Text style={modalStyles.inputLabel}>DECISION *</Text>
            <View style={modalStyles.decisionRow}>
              <TouchableOpacity
                style={[
                  modalStyles.decisionBtn,
                  reviewDecision === 'approved' && modalStyles.decisionBtnApproved,
                ]}
                onPress={() => setReviewDecision('approved')}
              >
                <Text
                  style={[
                    modalStyles.decisionBtnText,
                    reviewDecision === 'approved' && modalStyles.decisionBtnTextActive,
                  ]}
                >
                  ✓ Approve
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modalStyles.decisionBtn,
                  reviewDecision === 'rejected' && modalStyles.decisionBtnRejected,
                ]}
                onPress={() => setReviewDecision('rejected')}
              >
                <Text
                  style={[
                    modalStyles.decisionBtnText,
                    reviewDecision === 'rejected' && modalStyles.decisionBtnTextActive,
                  ]}
                >
                  ✕ Reject
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reason / Remarks */}
            <Text style={modalStyles.inputLabel}>REASON / REMARKS (OPTIONAL)</Text>
            <TextInput
              style={modalStyles.textArea}
              placeholder="Add review notes or reason..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={reviewReason}
              onChangeText={setReviewReason}
            />

            {/* Modal Actions */}
            <View style={modalStyles.formButtonsRow}>
              <TouchableOpacity
                style={modalStyles.cancelBtn}
                onPress={() => setReviewModalVisible(false)}
              >
                <Text style={modalStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modalStyles.submitBtn,
                  reviewDecision === 'rejected' && { backgroundColor: '#EF4444' },
                  reviewSubmitting && { opacity: 0.6 },
                ]}
                onPress={submitReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={modalStyles.submitBtnText}>
                    Confirm {reviewDecision === 'approved' ? 'Approval' : 'Rejection'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 2: ISSUE CERTIFICATE MODAL ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={issueModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIssueModalVisible(false)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.modalCard}>
            <View style={modalStyles.modalHeader}>
              <View>
                <Text style={modalStyles.modalTitle}>Issue Certificate</Text>
                <Text style={modalStyles.modalSubtitle}>Generate official certificate for student</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIssueModalVisible(false)}
                style={modalStyles.closeBtn}
              >
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Select Student */}
              <Text style={modalStyles.inputLabel}>STUDENT *</Text>
              <TouchableOpacity
                style={modalStyles.dropdownSelector}
                onPress={() => setStudentPickerOpen(true)}
              >
                <Text style={modalStyles.dropdownSelectorText} numberOfLines={1}>
                  {selectedStudentName}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>

              {/* Select Course */}
              <Text style={modalStyles.inputLabel}>COURSE *</Text>
              <TouchableOpacity
                style={modalStyles.dropdownSelector}
                onPress={() => setCoursePickerOpen(true)}
              >
                <Text style={modalStyles.dropdownSelectorText} numberOfLines={1}>
                  {selectedCourseName}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>

              {/* Select Batch */}
              <Text style={modalStyles.inputLabel}>BATCH *</Text>
              <TouchableOpacity
                style={modalStyles.dropdownSelector}
                onPress={() => setBatchPickerOpen(true)}
              >
                <Text style={modalStyles.dropdownSelectorText} numberOfLines={1}>
                  {selectedBatchName}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>

              {/* Select Template */}
              <Text style={modalStyles.inputLabel}>CERTIFICATE TEMPLATE *</Text>
              <TouchableOpacity
                style={modalStyles.dropdownSelector}
                onPress={() => setTemplatePickerOpen(true)}
              >
                <Text style={modalStyles.dropdownSelectorText} numberOfLines={1}>
                  {selectedTemplateName}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>

              {/* Certificate Type */}
              <Text style={modalStyles.inputLabel}>CERTIFICATE TYPE</Text>
              <View style={modalStyles.typeRow}>
                {CERT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setIssueType(t.id)}
                    style={[
                      modalStyles.typeChip,
                      issueType === t.id && modalStyles.typeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        modalStyles.typeChipText,
                        issueType === t.id && modalStyles.typeChipTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Issue Date & Issued By */}
              <Text style={modalStyles.inputLabel}>ISSUE DATE</Text>
              <TextInput
                style={modalStyles.textInput}
                value={issueDate}
                onChangeText={setIssueDate}
                placeholder="YYYY-MM-DD"
              />

              <Text style={modalStyles.inputLabel}>ISSUED BY</Text>
              <TextInput
                style={modalStyles.textInput}
                value={issueIssuedBy}
                onChangeText={setIssueIssuedBy}
                placeholder="Principal / Administrator"
              />

              {/* Action Buttons */}
              <View style={modalStyles.formButtonsRow}>
                <TouchableOpacity
                  style={modalStyles.cancelBtn}
                  onPress={() => setIssueModalVisible(false)}
                >
                  <Text style={modalStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[modalStyles.submitBtn, issueSubmitting && { opacity: 0.6 }]}
                  onPress={submitIssueCertificate}
                  disabled={issueSubmitting}
                >
                  {issueSubmitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={modalStyles.submitBtnText}>Generate Certificate</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 3: CREATE TEMPLATE MODAL ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={templateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTemplateModalVisible(false)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.modalCard}>
            <View style={modalStyles.modalHeader}>
              <View>
                <Text style={modalStyles.modalTitle}>New Certificate Template</Text>
                <Text style={modalStyles.modalSubtitle}>Design template layout and branding</Text>
              </View>
              <TouchableOpacity
                onPress={() => setTemplateModalVisible(false)}
                style={modalStyles.closeBtn}
              >
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              <Text style={modalStyles.inputLabel}>TEMPLATE NAME *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="e.g. Course Completion 2026"
                placeholderTextColor="#94A3B8"
                value={tempName}
                onChangeText={setTempName}
              />

              <Text style={modalStyles.inputLabel}>CERTIFICATE TITLE</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="Certificate of Completion"
                placeholderTextColor="#94A3B8"
                value={tempTitle}
                onChangeText={setTempTitle}
              />

              <Text style={modalStyles.inputLabel}>INSTITUTE NAME</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="Edorapad Academy"
                placeholderTextColor="#94A3B8"
                value={tempInstitute}
                onChangeText={setTempInstitute}
              />

              <Text style={modalStyles.inputLabel}>FOOTER TEXT</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="with dedication and excellence"
                placeholderTextColor="#94A3B8"
                value={tempFooter}
                onChangeText={setTempFooter}
              />

              {/* Primary Color */}
              <Text style={modalStyles.inputLabel}>PRIMARY COLOR</Text>
              <View style={modalStyles.colorRow}>
                {PRESET_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      modalStyles.presetColorCircle,
                      { backgroundColor: c },
                      tempPrimaryColor === c && modalStyles.presetColorCircleActive,
                    ]}
                    onPress={() => setTempPrimaryColor(c)}
                  />
                ))}
              </View>

              {/* Default Toggle */}
              <TouchableOpacity
                style={modalStyles.checkboxRow}
                onPress={() => setTempIsDefault(!tempIsDefault)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkboxWrap,
                    tempIsDefault && styles.checkboxWrapActive,
                  ]}
                >
                  {tempIsDefault && <Check size={12} color="#FFF" />}
                </View>
                <Text style={modalStyles.checkboxText}>Set as Default Template</Text>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={modalStyles.formButtonsRow}>
                <TouchableOpacity
                  style={modalStyles.cancelBtn}
                  onPress={() => setTemplateModalVisible(false)}
                >
                  <Text style={modalStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[modalStyles.submitBtn, templateSubmitting && { opacity: 0.6 }]}
                  onPress={submitCreateTemplate}
                  disabled={templateSubmitting}
                >
                  {templateSubmitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={modalStyles.submitBtnText}>Create Template</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── DROPDOWNS PICKER MODALS ─── */}
      {/* Student Picker */}
      <Modal visible={studentPickerOpen} transparent animationType="fade">
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.pickerCard}>
            <Text style={modalStyles.pickerTitle}>Select Student</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {studentsList.map((st) => {
                const sId = (st.id || st._id || '') as string;
                const isSelected = issueStudentId === sId;
                return (
                  <TouchableOpacity
                    key={sId}
                    style={[modalStyles.pickerItem, isSelected && modalStyles.pickerItemActive]}
                    onPress={() => {
                      setIssueStudentId(sId);
                      setStudentPickerOpen(false);
                    }}
                  >
                    <Text style={[modalStyles.pickerItemText, isSelected && { color: THEME.colors.primary, fontWeight: '800' }]}>
                      {st.name} ({st.email || st.studentCustomId || ''})
                    </Text>
                    {isSelected && <Check size={16} color={THEME.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={() => setStudentPickerOpen(false)} style={modalStyles.pickerCloseBtn}>
              <Text style={modalStyles.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Course Picker */}
      <Modal visible={coursePickerOpen} transparent animationType="fade">
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.pickerCard}>
            <Text style={modalStyles.pickerTitle}>Select Course</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {courses.map((c) => {
                const cId = (c.id || c._id || '') as string;
                const isSelected = issueCourseId === cId;
                return (
                  <TouchableOpacity
                    key={cId}
                    style={[modalStyles.pickerItem, isSelected && modalStyles.pickerItemActive]}
                    onPress={() => {
                      setIssueCourseId(cId);
                      setCoursePickerOpen(false);
                    }}
                  >
                    <Text style={[modalStyles.pickerItemText, isSelected && { color: THEME.colors.primary, fontWeight: '800' }]}>
                      {c.title || c.name}
                    </Text>
                    {isSelected && <Check size={16} color={THEME.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={() => setCoursePickerOpen(false)} style={modalStyles.pickerCloseBtn}>
              <Text style={modalStyles.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Batch Picker */}
      <Modal visible={batchPickerOpen} transparent animationType="fade">
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.pickerCard}>
            <Text style={modalStyles.pickerTitle}>Select Batch</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {batches.map((b) => {
                const bId = (b.id || b._id || '') as string;
                const isSelected = issueBatchId === bId;
                return (
                  <TouchableOpacity
                    key={bId}
                    style={[modalStyles.pickerItem, isSelected && modalStyles.pickerItemActive]}
                    onPress={() => {
                      setIssueBatchId(bId);
                      setBatchPickerOpen(false);
                    }}
                  >
                    <Text style={[modalStyles.pickerItemText, isSelected && { color: THEME.colors.primary, fontWeight: '800' }]}>
                      {b.name}
                    </Text>
                    {isSelected && <Check size={16} color={THEME.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={() => setBatchPickerOpen(false)} style={modalStyles.pickerCloseBtn}>
              <Text style={modalStyles.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Template Picker */}
      <Modal visible={templatePickerOpen} transparent animationType="fade">
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.pickerCard}>
            <Text style={modalStyles.pickerTitle}>Select Template</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {templates.map((t) => {
                const tId = (t.id || t._id || '') as string;
                const isSelected = issueTemplateId === tId;
                return (
                  <TouchableOpacity
                    key={tId}
                    style={[modalStyles.pickerItem, isSelected && modalStyles.pickerItemActive]}
                    onPress={() => {
                      setIssueTemplateId(tId);
                      setTemplatePickerOpen(false);
                    }}
                  >
                    <Text style={[modalStyles.pickerItemText, isSelected && { color: THEME.colors.primary, fontWeight: '800' }]}>
                      {t.name} {t.isDefault ? '(Default)' : ''}
                    </Text>
                    {isSelected && <Check size={16} color={THEME.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={() => setTemplatePickerOpen(false)} style={modalStyles.pickerCloseBtn}>
              <Text style={modalStyles.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: DELETE CONFIRMATION MODAL ─── */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.deleteCard}>
            <View style={modalStyles.deleteIconWrap}>
              <Trash2 size={24} color="#EF4444" />
            </View>
            <Text style={modalStyles.deleteTitle}>
              Delete {deleteItem?.type === 'template' ? 'Template' : 'Certificate'}?
            </Text>
            <Text style={modalStyles.deleteDesc}>
              Are you sure you want to permanently delete{' '}
              <Text style={{ fontWeight: '800', color: '#0F172A' }}>{deleteItem?.name}</Text>?
              This action cannot be undone.
            </Text>

            <View style={modalStyles.formButtonsRow}>
              <TouchableOpacity
                style={modalStyles.cancelBtn}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeleteItem(null);
                }}
              >
                <Text style={modalStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.deleteSubmitBtn, deleteSubmitting && { opacity: 0.6 }]}
                onPress={confirmDeleteItem}
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={modalStyles.deleteSubmitBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  refreshHeaderBtn: {
    padding: 8,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statsScroll: {
    paddingHorizontal: 12,
    gap: 10,
  },
  statCard: {
    width: 140,
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
    borderWidth: 1,
  },
  statCardAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  statCardEmerald: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  statCardViolet: {
    backgroundColor: '#F5F3FF',
    borderColor: '#EDE9FE',
  },
  statCardTeal: {
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  statIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  statSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabButtonActive: {
    borderBottomColor: '#0F766E',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#0F766E',
  },
  tabBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  toolbarRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  bulkActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bulkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bulkBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  bulkClearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  bulkClearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  selectPendingBar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectPendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  newTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newTemplateBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 40,
  },
  cardItem: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  checkboxWrap: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  checkboxWrapActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusBadgeApproved: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusBadgeRejected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoBlockText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  remarksBox: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  remarksLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 11,
    color: '#78350F',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
  },
  dateLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  reviewBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  issueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  issueBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  templateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  colorPaletteWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  defaultBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  certNumberBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  certNumberText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  metaRowWithPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typePill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6D28D9',
  },
  issuerText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  downloadBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.xl,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 18,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94A3B8',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 10,
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  decisionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  decisionBtnApproved: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  decisionBtnRejected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  decisionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  decisionBtnTextActive: {
    color: '#FFF',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dropdownSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  typeChipTextActive: {
    color: '#FFF',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  presetColorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  presetColorCircleActive: {
    borderWidth: 2,
    borderColor: '#000',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  checkboxText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  formButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    flex: 1.5,
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  pickerCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 18,
    width: '100%',
    maxWidth: 340,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemActive: {
    backgroundColor: '#F0FDF4',
  },
  pickerItemText: {
    fontSize: 12,
    color: '#334155',
  },
  pickerCloseBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pickerCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  deleteCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  deleteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  deleteDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  deleteSubmitBtn: {
    flex: 1.5,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSubmitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
});
