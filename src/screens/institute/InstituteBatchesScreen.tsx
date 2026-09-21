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
} from 'react-native';
import {
  Layers,
  Clock,
  Users,
  BookOpen,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  X,
  Check,
  Calendar,
  User,
  AlertCircle,
  ChevronDown,
  ArrowRight,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchInstituteBatches,
  createBatchThunk,
  updateBatchThunk,
  deleteBatchThunk,
  fetchInstituteCourses,
  fetchInstituteStaff,
} from '../../store/slices/instituteSlice';
import { Batch } from '../../shared/types';
import { instituteApi } from '../../shared/api/instituteApi';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COMMON_START_TIMES = ['08:00 AM', '09:00 AM', '10:00 AM', '02:00 PM', '06:00 PM'];
const COMMON_END_TIMES = ['10:00 AM', '11:00 AM', '12:00 PM', '04:00 PM', '08:00 PM'];

export const InstituteBatchesScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { batches, courses, staff, loading } = useAppSelector((state) => state.institute);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Selected / Active Batch
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchDetails, setBatchDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form States (Create & Edit)
  const [formName, setFormName] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formTutorId, setFormTutorId] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00 AM');
  const [formEndTime, setFormEndTime] = useState('11:00 AM');
  const [formDays, setFormDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [submitting, setSubmitting] = useState(false);

  // Dropdown Picker Modals
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);
  const [tutorPickerOpen, setTutorPickerOpen] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.all([
      dispatch(fetchInstituteBatches()),
      dispatch(fetchInstituteCourses()),
      dispatch(fetchInstituteStaff(undefined)),
    ]);
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filtered tutors from staff directory
  const tutors = useMemo(() => {
    return (staff || []).filter((s: any) => {
      const role = (s.role || s.staffRole || '').toLowerCase();
      return role.includes('tutor') || role.includes('teacher');
    });
  }, [staff]);

  // Filtered batches by search query
  const filteredBatches = useMemo(() => {
    return (batches || []).filter((b: Batch) => {
      const name = b.name || '';
      const courseTitle = b.course?.title || b.courseName || '';
      const tutorName = b.tutor?.name || b.tutorName || '';
      const id = b.id || b._id || '';

      const q = searchQuery.toLowerCase();
      return (
        name.toLowerCase().includes(q) ||
        courseTitle.toLowerCase().includes(q) ||
        tutorName.toLowerCase().includes(q) ||
        id.toLowerCase().includes(q)
      );
    });
  }, [batches, searchQuery]);

  // ─── Open Create Modal ───────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setFormName('');
    setFormCourseId(courses && courses.length > 0 ? courses[0].id || courses[0]._id : '');
    setFormTutorId(tutors && tutors.length > 0 ? tutors[0].id || tutors[0]._id : '');
    setFormStartTime('09:00 AM');
    setFormEndTime('11:00 AM');
    setFormDays(['Mon', 'Wed', 'Fri']);
    setCreateModalVisible(true);
  };

  // ─── Open Edit Modal ─────────────────────────────────────────────────────────
  const handleOpenEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setFormName(batch.name || '');
    setFormCourseId(batch.courseId || batch.course?.id || '');
    setFormTutorId(batch.tutorId || batch.tutor?.id || '');
    setFormStartTime(batch.startTime || '09:00 AM');
    setFormEndTime(batch.endTime || '11:00 AM');

    const days = batch.daysOfWeek
      ? batch.daysOfWeek.split(',').map((d) => d.trim())
      : ['Mon', 'Wed', 'Fri'];
    setFormDays(days);
    setEditModalVisible(true);
  };

  // ─── Open Details Modal ──────────────────────────────────────────────────────
  const handleOpenDetails = async (batch: Batch) => {
    setSelectedBatch(batch);
    setDetailsModalVisible(true);
    setDetailsLoading(true);

    try {
      const batchId = (batch.id || batch._id || '') as string;
      if (batchId) {
        const res = await instituteApi.getBatchById(batchId);
        if (res.success) {
          setBatchDetails(res.data);
        } else {
          setBatchDetails(batch);
        }
      } else {
        setBatchDetails(batch);
      }
    } catch {
      setBatchDetails(batch);
    } finally {
      setDetailsLoading(false);
    }
  };

  // ─── Toggle Day in Selection ─────────────────────────────────────────────────
  const toggleDay = (day: string) => {
    if (formDays.includes(day)) {
      if (formDays.length > 1) {
        setFormDays(formDays.filter((d) => d !== day));
      }
    } else {
      setFormDays([...formDays, day]);
    }
  };

  // ─── Submit Create Batch ─────────────────────────────────────────────────────
  const handleCreateSubmit = async () => {
    if (!formName.trim()) {
      Alert.alert('Missing Field', 'Please enter a batch name.');
      return;
    }
    if (!formCourseId) {
      Alert.alert('Missing Field', 'Please select a course.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        courseId: formCourseId,
        tutorId: formTutorId || undefined,
        startTime: formStartTime,
        endTime: formEndTime,
        daysOfWeek: formDays.join(', '),
      };

      const res = await dispatch(createBatchThunk(payload));
      if (createBatchThunk.fulfilled.match(res)) {
        Alert.alert('Success', 'Batch created successfully!');
        setCreateModalVisible(false);
      } else {
        Alert.alert('Error', (res.payload as string) || 'Failed to create batch.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Submit Edit Batch ───────────────────────────────────────────────────────
  const handleEditSubmit = async () => {
    if (!selectedBatch) return;
    if (!formName.trim()) {
      Alert.alert('Missing Field', 'Please enter a batch name.');
      return;
    }

    setSubmitting(true);
    try {
      const batchId = (selectedBatch.id || selectedBatch._id || '') as string;
      if (!batchId) {
        Alert.alert('Error', 'Invalid batch identifier.');
        return;
      }
      const payload = {
        name: formName.trim(),
        courseId: formCourseId,
        tutorId: formTutorId || undefined,
        startTime: formStartTime,
        endTime: formEndTime,
        daysOfWeek: formDays.join(', '),
      };

      const res = await dispatch(updateBatchThunk({ id: batchId, batchData: payload }));
      if (updateBatchThunk.fulfilled.match(res)) {
        Alert.alert('Success', 'Batch updated successfully!');
        setEditModalVisible(false);
        setSelectedBatch(null);
      } else {
        Alert.alert('Error', (res.payload as string) || 'Failed to update batch.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Submit Delete Batch ─────────────────────────────────────────────────────
  const handleDeleteSubmit = async () => {
    if (!selectedBatch) return;
    const batchId = (selectedBatch.id || selectedBatch._id || '') as string;
    if (!batchId) {
      Alert.alert('Error', 'Invalid batch identifier.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await dispatch(deleteBatchThunk(batchId));
      if (deleteBatchThunk.fulfilled.match(res)) {
        Alert.alert('Deleted', 'Batch deleted successfully.');
        setDeleteModalVisible(false);
        setSelectedBatch(null);
      } else {
        Alert.alert('Error', (res.payload as string) || 'Failed to delete batch.');
      }
    } catch {
      Alert.alert('Error', 'An error occurred while deleting.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render Batch Card ───────────────────────────────────────────────────────
  const renderBatchCard = ({ item }: { item: Batch }) => {
    const batchId = item.id || item._id || '';
    const courseTitle = item.course?.title || item.courseName || 'General Course';
    const tutorName = item.tutor?.name || item.tutorName || 'Unassigned';
    const tutorInitial = tutorName.charAt(0).toUpperCase() || 'U';
    const studentCount = item._count?.students ?? item.totalStudents ?? 0;
    const timing = item.startTime && item.endTime ? `${item.startTime} → ${item.endTime}` : item.timing || 'Schedule TBD';

    const daysList = item.daysOfWeek
      ? item.daysOfWeek.split(',').map((d) => d.trim())
      : ['Mon', 'Wed', 'Fri'];

    return (
      <View style={styles.batchCard}>
        {/* Card Header: Batch Name, ID snippet, Status */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.batchTitleBlock}>
            <View style={styles.batchIconWrap}>
              <Layers size={18} color="#0F766E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.batchNameText}>{item.name}</Text>
              <Text style={styles.batchIdSnippetText}>ID: {batchId.substring(0, 11)}</Text>
            </View>
          </View>
          <View style={styles.activeStatusPill}>
            <Text style={styles.activeStatusText}>ACTIVE</Text>
          </View>
        </View>

        {/* Course Info */}
        <View style={styles.courseRow}>
          <BookOpen size={14} color="#64748B" style={{ marginRight: 6 }} />
          <Text style={styles.courseText} numberOfLines={1}>
            {courseTitle}
          </Text>
        </View>

        {/* Tutor & Students Info Row */}
        <View style={styles.tutorAndStudentsRow}>
          {/* Tutor info */}
          <View style={styles.tutorBlock}>
            <View style={styles.tutorAvatar}>
              <Text style={styles.tutorAvatarText}>{tutorInitial}</Text>
            </View>
            <Text style={styles.tutorNameText} numberOfLines={1}>
              {tutorName}
            </Text>
          </View>

          {/* Student count pill */}
          <View style={styles.studentsCountPill}>
            <Users size={12} color="#0F766E" style={{ marginRight: 4 }} />
            <Text style={styles.studentsCountText}>
              {studentCount} {studentCount === 1 ? 'Student' : 'Students'}
            </Text>
          </View>
        </View>

        {/* Timing & Days of Week Row */}
        <View style={styles.scheduleRow}>
          <View style={styles.timingLeft}>
            <Clock size={13} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.timingText}>{timing}</Text>
          </View>

          <View style={styles.daysWrap}>
            {daysList.slice(0, 4).map((day, idx) => (
              <View key={idx} style={styles.dayChip}>
                <Text style={styles.dayChipText}>{day}</Text>
              </View>
            ))}
            {daysList.length > 4 && (
              <View style={[styles.dayChip, { backgroundColor: '#E6F4F1' }]}>
                <Text style={[styles.dayChipText, { color: '#0F766E' }]}>+{daysList.length - 4}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons Row (View Details, Edit, Delete) */}
        <View style={styles.cardActionsRow}>
          {/* View Details */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenDetails(item)}
            activeOpacity={0.7}
          >
            <Eye size={15} color="#0F766E" style={{ marginRight: 4 }} />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>

          {/* Edit */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenEdit(item)}
            activeOpacity={0.7}
          >
            <Edit2 size={14} color="#3B82F6" style={{ marginRight: 4 }} />
            <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Edit</Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteActionBtn]}
            onPress={() => {
              setSelectedBatch(item);
              setDeleteModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={14} color="#EF4444" style={{ marginRight: 4 }} />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const selectedCourseName = courses.find((c: any) => (c.id || c._id) === formCourseId)?.title || 'Select Course';
  const selectedTutorName = tutors.find((t: any) => (t.id || t._id) === formTutorId)?.name || 'Select Tutor';

  return (
    <ScreenContainer>
      {/* Header */}
      <Header
        title="Batches"
        subtitle="Manage academic schedules and cohorts"
        showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
        onBack={() => navigation?.goBack?.()}
        rightAction={
          <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
            <RefreshCw size={18} color="#1E293B" />
          </TouchableOpacity>
        }
      />

      {/* ─── Search Bar & Create Button ─── */}
      <View style={styles.topControlBar}>
        <View style={styles.searchInputWrap}>
          <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by batch name or course..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.newBatchBtn}
          onPress={handleOpenCreate}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={styles.newBatchBtnText}>New Batch</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Batches FlatList ─── */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading Batches...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBatches}
          keyExtractor={(item, index) => item.id || item._id || String(index)}
          renderItem={renderBatchCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Layers size={32} color="#64748B" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Matching Batches' : 'No Batches Found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try searching with a different keyword.'
                  : 'Tap "+ New Batch" above to create your first batch.'}
              </Text>
            </View>
          }
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ─── CREATE / EDIT BATCH MODAL ─── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={createModalVisible || editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCreateModalVisible(false);
          setEditModalVisible(false);
        }}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.modalCard}>
            <View style={modalStyles.modalHeader}>
              <View>
                <Text style={modalStyles.modalTitle}>
                  {editModalVisible ? 'Edit Batch' : 'Create New Batch'}
                </Text>
                <Text style={modalStyles.modalSubtitle}>
                  Configure schedule, course, and assigned tutor
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setCreateModalVisible(false);
                  setEditModalVisible(false);
                }}
                style={modalStyles.closeBtn}
              >
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              {/* Batch Name */}
              <Text style={modalStyles.inputLabel}>BATCH NAME *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="e.g. TC-MAR-01"
                placeholderTextColor="#94A3B8"
                value={formName}
                onChangeText={setFormName}
              />

              {/* Course Selection */}
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

              {/* Tutor Selection */}
              <Text style={modalStyles.inputLabel}>ASSIGNED TUTOR</Text>
              <TouchableOpacity
                style={modalStyles.dropdownSelector}
                onPress={() => setTutorPickerOpen(true)}
              >
                <Text style={modalStyles.dropdownSelectorText} numberOfLines={1}>
                  {selectedTutorName}
                </Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>

              {/* Timings */}
              <View style={modalStyles.timeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.inputLabel}>START TIME</Text>
                  <TextInput
                    style={modalStyles.textInput}
                    placeholder="09:00 AM"
                    placeholderTextColor="#94A3B8"
                    value={formStartTime}
                    onChangeText={setFormStartTime}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                    {COMMON_START_TIMES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setFormStartTime(t)}
                        style={[
                          modalStyles.quickTimeChip,
                          formStartTime === t && modalStyles.quickTimeChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            modalStyles.quickTimeText,
                            formStartTime === t && modalStyles.quickTimeTextActive,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.inputLabel}>END TIME</Text>
                  <TextInput
                    style={modalStyles.textInput}
                    placeholder="11:00 AM"
                    placeholderTextColor="#94A3B8"
                    value={formEndTime}
                    onChangeText={setFormEndTime}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                    {COMMON_END_TIMES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setFormEndTime(t)}
                        style={[
                          modalStyles.quickTimeChip,
                          formEndTime === t && modalStyles.quickTimeChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            modalStyles.quickTimeText,
                            formEndTime === t && modalStyles.quickTimeTextActive,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Days of Week Selection */}
              <Text style={modalStyles.inputLabel}>DAYS OF THE WEEK *</Text>
              <View style={modalStyles.daysRow}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = formDays.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => toggleDay(day)}
                      style={[modalStyles.dayToggleBtn, isSelected && modalStyles.dayToggleBtnActive]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          modalStyles.dayToggleText,
                          isSelected && modalStyles.dayToggleTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={modalStyles.formButtonsRow}>
                <TouchableOpacity
                  style={modalStyles.cancelBtn}
                  onPress={() => {
                    setCreateModalVisible(false);
                    setEditModalVisible(false);
                  }}
                >
                  <Text style={modalStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[modalStyles.submitBtn, submitting && { opacity: 0.6 }]}
                  onPress={editModalVisible ? handleEditSubmit : handleCreateSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={modalStyles.submitBtnText}>
                      {editModalVisible ? 'Save Changes' : 'Create Batch'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Course Picker Modal ─── */}
      <Modal visible={coursePickerOpen} transparent animationType="fade">
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.pickerCard}>
            <Text style={modalStyles.pickerTitle}>Select Course</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {(courses || []).map((c: any) => {
                const cId = c.id || c._id;
                const isSelected = formCourseId === cId;
                return (
                  <TouchableOpacity
                    key={cId}
                    style={[modalStyles.pickerItem, isSelected && modalStyles.pickerItemActive]}
                    onPress={() => {
                      setFormCourseId(cId);
                      setCoursePickerOpen(false);
                    }}
                  >
                    <Text style={[modalStyles.pickerItemText, isSelected && { color: THEME.colors.primary, fontWeight: '800' }]}>
                      {c.title}
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

      {/* ─── Tutor Picker Modal ─── */}
      <Modal visible={tutorPickerOpen} transparent animationType="fade">
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.pickerCard}>
            <Text style={modalStyles.pickerTitle}>Select Tutor</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {(tutors || []).map((t: any) => {
                const tId = t.id || t._id;
                const isSelected = formTutorId === tId;
                return (
                  <TouchableOpacity
                    key={tId}
                    style={[modalStyles.pickerItem, isSelected && modalStyles.pickerItemActive]}
                    onPress={() => {
                      setFormTutorId(tId);
                      setTutorPickerOpen(false);
                    }}
                  >
                    <Text style={[modalStyles.pickerItemText, isSelected && { color: THEME.colors.primary, fontWeight: '800' }]}>
                      {t.name}
                    </Text>
                    {isSelected && <Check size={16} color={THEME.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={() => setTutorPickerOpen(false)} style={modalStyles.pickerCloseBtn}>
              <Text style={modalStyles.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── BATCH DETAILS MODAL ─── */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.modalCard}>
            <View style={modalStyles.modalHeader}>
              <View>
                <Text style={modalStyles.modalTitle}>{selectedBatch?.name || 'Batch Details'}</Text>
                <Text style={modalStyles.modalSubtitle}>ID: {selectedBatch?.id?.substring(0, 12)}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={modalStyles.closeBtn}>
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {detailsLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
                <Text style={{ marginTop: 10, color: '#64748B', fontSize: 12 }}>Loading details...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Course & Tutor */}
                <View style={modalStyles.detailSection}>
                  <Text style={modalStyles.detailLabel}>COURSE</Text>
                  <Text style={modalStyles.detailVal}>
                    {batchDetails?.course?.title || selectedBatch?.course?.title || selectedBatch?.courseName || 'General Course'}
                  </Text>
                </View>

                <View style={modalStyles.detailSection}>
                  <Text style={modalStyles.detailLabel}>TUTOR</Text>
                  <Text style={modalStyles.detailVal}>
                    {batchDetails?.tutor?.name || selectedBatch?.tutor?.name || selectedBatch?.tutorName || 'Unassigned'}
                  </Text>
                </View>

                <View style={modalStyles.detailSection}>
                  <Text style={modalStyles.detailLabel}>TIMING & SCHEDULE</Text>
                  <Text style={modalStyles.detailVal}>
                    {batchDetails?.startTime || selectedBatch?.startTime} - {batchDetails?.endTime || selectedBatch?.endTime}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    Days: {batchDetails?.daysOfWeek || selectedBatch?.daysOfWeek || 'Mon, Wed, Fri'}
                  </Text>
                </View>

                {/* Enrolled Students */}
                <View style={modalStyles.detailSection}>
                  <Text style={modalStyles.detailLabel}>
                    ENROLLED STUDENTS ({batchDetails?.students?.length || batchDetails?._count?.students || 0})
                  </Text>
                  {batchDetails?.students && batchDetails.students.length > 0 ? (
                    batchDetails.students.map((st: any, idx: number) => (
                      <View key={st.id || idx} style={modalStyles.studentRow}>
                        <User size={14} color="#0F766E" style={{ marginRight: 6 }} />
                        <Text style={modalStyles.studentNameText}>{st.name || st.firstName || 'Student'}</Text>
                        <Text style={modalStyles.studentIdText}>{st.studentCustomId || ''}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginTop: 4 }}>
                      No students enrolled in this batch yet.
                    </Text>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
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
            <Text style={modalStyles.deleteTitle}>Delete Batch?</Text>
            <Text style={modalStyles.deleteDesc}>
              Are you sure you want to permanently delete{' '}
              <Text style={{ fontWeight: '800', color: '#0F172A' }}>{selectedBatch?.name}</Text>?
              This action cannot be undone.
            </Text>

            <View style={modalStyles.formButtonsRow}>
              <TouchableOpacity
                style={modalStyles.cancelBtn}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setSelectedBatch(null);
                }}
              >
                <Text style={modalStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.deleteSubmitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleDeleteSubmit}
                disabled={submitting}
              >
                {submitting ? (
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

// ─── Screen Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  refreshBtn: {
    padding: 8,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    paddingVertical: 0,
  },
  newBatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E7B74',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    shadowColor: '#3E7B74',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  newBatchBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 40,
  },
  batchCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  batchTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  batchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  batchIdSnippetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },
  activeStatusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  activeStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  courseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  tutorAndStudentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  tutorBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  tutorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorAvatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  tutorNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  studentsCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentsCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  timingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  daysWrap: {
    flexDirection: 'row',
    gap: 4,
  },
  dayChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  deleteActionBtn: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF',
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
    paddingHorizontal: 16,
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
    marginBottom: 14,
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
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickTimeChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 4,
  },
  quickTimeChipActive: {
    backgroundColor: THEME.colors.primary,
  },
  quickTimeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  quickTimeTextActive: {
    color: '#FFF',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  dayToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayToggleBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  dayToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  dayToggleTextActive: {
    color: '#FFF',
  },
  formButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  submitBtn: {
    flex: 1.5,
    backgroundColor: '#3E7B74',
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 13,
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
    fontSize: 13,
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
  detailSection: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  studentNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  studentIdText: {
    fontSize: 10,
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
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
});
