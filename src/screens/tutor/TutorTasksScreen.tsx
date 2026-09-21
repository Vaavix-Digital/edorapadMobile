import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Search,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  Clock,
  Users,
  Check,
  ClipboardList,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  fetchTutorBatches,
} from '../../store/slices/tutorSlice';

const { width: SCREEN_W } = Dimensions.get('window');

const DATE_FILTER_OPTIONS = ['All Time', 'Today', 'Tomorrow', 'This Week', 'This Month'];

export const TutorTasksScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { allTasks, tasksLoading, batches } = useAppSelector((state) => state.tutor);

  const [search, setSearch] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All Time');
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'Today' | 'All'>('Today');

  // Add Task Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  });
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [isBatchPickerOpen, setIsBatchPickerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Delete Modal
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchTasks({}));
    dispatch(fetchTutorBatches());
  }, [dispatch]);

  const handleApplyFilters = () => {
    const filters: any = {};
    if (search.trim()) filters.search = search.trim();
    if (selectedDateFilter === 'Today') {
      const d = new Date();
      filters.date = d.toISOString().split('T')[0];
    }
    dispatch(fetchTasks(filters));
  };

  const handleToggle = (taskId: string, currentStatus: boolean) => {
    dispatch(updateTaskStatus({ taskId, isCompleted: !currentStatus }));
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await dispatch(deleteTask(taskToDelete.id)).unwrap();
      setTaskToDelete(null);
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to delete task');
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskContent.trim()) {
      Alert.alert('Required', 'Please enter task content');
      return;
    }
    if (!selectedBatchId) {
      Alert.alert('Required', 'Please select a batch');
      return;
    }

    setCreating(true);
    try {
      // Parse DD-MM-YYYY to YYYY-MM-DD
      let isoDate = new Date().toISOString().split('T')[0];
      if (newTaskDate.includes('-')) {
        const parts = newTaskDate.split('-');
        if (parts.length === 3 && parts[0].length === 2) {
          isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          isoDate = newTaskDate;
        }
      }

      await dispatch(
        createTask({
          content: newTaskContent.trim(),
          batchId: selectedBatchId,
          date: isoDate,
        })
      ).unwrap();

      setNewTaskContent('');
      setSelectedBatchId('');
      setIsAddModalOpen(false);
      Alert.alert('Success', 'Task created successfully');
    } catch (e: any) {
      Alert.alert('Error', e || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  // Filter tasks for the view
  const todayStr = new Date().toISOString().split('T')[0];
  const displayedTasks = allTasks.filter((t) => {
    if (search.trim() && !t.content?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (sidebarTab === 'Today') {
      const tDate = t.date ? t.date.split('T')[0] : '';
      return tDate === todayStr;
    }
    return true;
  });

  const selectedBatchObj = batches.find((b) => (b.id || (b as any)._id) === selectedBatchId);

  return (
    <View style={styles.root}>
      {/* Header matching web design */}
      <Header
        title="Task Manager"
        subtitle="Home > Tasks"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => setIsAddModalOpen(true)}
            style={styles.addBtn}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Task</Text>
          </TouchableOpacity>
        }
      />

      {/* Filter and Search Bar */}
      <View style={styles.filterBar}>
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Tasks"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleApplyFilters}
          />
          <TouchableOpacity style={styles.searchActionBtn} onPress={handleApplyFilters}>
            <Search size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.dateFilterDropdown}
          onPress={() => setIsDateFilterOpen(true)}
          activeOpacity={0.8}
        >
          <CalendarIcon size={14} color="#64748B" />
          <Text style={styles.dateFilterText} numberOfLines={1}>
            {selectedDateFilter === 'All Time' ? 'Date' : selectedDateFilter}
          </Text>
          <ChevronDown size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tasks Section Card matching web screenshot */}
        <View style={styles.tasksCard}>
          {/* Card Header with Today / All pills */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Tasks</Text>
            <View style={styles.tabPillRow}>
              <TouchableOpacity
                style={[styles.pillBtn, sidebarTab === 'Today' && styles.pillBtnActive]}
                onPress={() => setSidebarTab('Today')}
              >
                <Text style={[styles.pillBtnText, sidebarTab === 'Today' && styles.pillBtnTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pillBtn, sidebarTab === 'All' && styles.pillBtnActive]}
                onPress={() => setSidebarTab('All')}
              >
                <Text style={[styles.pillBtnText, sidebarTab === 'All' && styles.pillBtnTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Task Items List */}
          {tasksLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#3E7B74" />
              <Text style={styles.loadingText}>Loading tasks from server...</Text>
            </View>
          ) : displayedTasks.length === 0 ? (
            <View style={styles.emptyBox}>
              <ClipboardList size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No tasks found</Text>
              <TouchableOpacity
                style={styles.addNewTaskBtn}
                onPress={() => setIsAddModalOpen(true)}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.addNewTaskBtnText}>Add New Task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.taskList}>
              {displayedTasks.map((item) => {
                const batchName = item.batch?.name || (item as any).batchName || 'General';
                const formattedDate = item.date ? item.date.split('T')[0] : '';
                return (
                  <View key={item.id} style={styles.taskCard}>
                    <TouchableOpacity
                      onPress={() => handleToggle(item.id, item.isCompleted)}
                      style={styles.checkboxTouch}
                    >
                      {item.isCompleted ? (
                        <CheckCircle2 size={22} color="#10B981" />
                      ) : (
                        <Circle size={22} color="#94A3B8" />
                      )}
                    </TouchableOpacity>

                    <View style={styles.taskContentBox}>
                      <Text
                        style={[
                          styles.taskTitle,
                          item.isCompleted && styles.taskTitleCompleted,
                        ]}
                      >
                        {item.content}
                      </Text>

                      <View style={styles.taskMetaRow}>
                        <View style={styles.batchTag}>
                          <Users size={11} color="#3E7B74" />
                          <Text style={styles.batchTagText}>{batchName}</Text>
                        </View>
                        {formattedDate ? (
                          <View style={styles.dateTag}>
                            <Clock size={11} color="#64748B" />
                            <Text style={styles.dateTagText}>{formattedDate}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => setTaskToDelete(item)}
                      style={styles.deleteActionBtn}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ─── ADD TASK MODAL (Matches Web Screenshot 1) ─── */}
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Task</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Task Content */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Task Content</Text>
                <TextInput
                  style={[styles.fieldInput, styles.fieldTextarea]}
                  placeholder="Enter task details..."
                  placeholderTextColor="#94A3B8"
                  value={newTaskContent}
                  onChangeText={setNewTaskContent}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Due Date & Batch Row */}
              <View style={styles.formRow}>
                {/* Due Date */}
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Due Date</Text>
                  <View style={styles.dateInputWrap}>
                    <TextInput
                      style={styles.dateTextInput}
                      value={newTaskDate}
                      onChangeText={setNewTaskDate}
                      placeholder="DD-MM-YYYY"
                      placeholderTextColor="#94A3B8"
                    />
                    <CalendarIcon size={16} color="#64748B" />
                  </View>
                </View>

                {/* Batch */}
                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>Batch</Text>
                  <TouchableOpacity
                    style={styles.batchSelectBox}
                    onPress={() => setIsBatchPickerOpen(true)}
                  >
                    <Text style={styles.batchSelectText} numberOfLines={1}>
                      {selectedBatchObj?.name || 'Select Batch'}
                    </Text>
                    <ChevronDown size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddModalOpen(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, creating && { opacity: 0.7 }]}
                onPress={handleCreateTask}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Add Task</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Batch Picker Dropdown Modal */}
      <Modal
        visible={isBatchPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBatchPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setIsBatchPickerOpen(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Batch</Text>
            <ScrollView style={{ maxHeight: 250 }}>
              {batches.map((b) => {
                const bId = b.id || (b as any)._id;
                const isSelected = selectedBatchId === bId;
                return (
                  <TouchableOpacity
                    key={bId}
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => {
                      setSelectedBatchId(bId);
                      setIsBatchPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                      {b.name}
                    </Text>
                    {isSelected && <Check size={16} color="#3E7B74" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Filter Modal */}
      <Modal
        visible={isDateFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDateFilterOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setIsDateFilterOpen(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Filter by Date</Text>
            {DATE_FILTER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.pickerItem, selectedDateFilter === opt && styles.pickerItemActive]}
                onPress={() => {
                  setSelectedDateFilter(opt);
                  setIsDateFilterOpen(false);
                  if (opt === 'Today') {
                    dispatch(fetchTasks({ date: new Date().toISOString().split('T')[0] }));
                  } else {
                    dispatch(fetchTasks({}));
                  }
                }}
              >
                <Text style={[styles.pickerItemText, selectedDateFilter === opt && styles.pickerItemTextActive]}>
                  {opt}
                </Text>
                {selectedDateFilter === opt && <Check size={16} color="#3E7B74" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={Boolean(taskToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setTaskToDelete(null)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.deleteModalTitle}>Delete Task</Text>
            <Text style={styles.deleteModalDesc}>
              Are you sure you want to delete this task? This cannot be undone.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTaskToDelete(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={confirmDelete}
              >
                <Text style={styles.deleteConfirmBtnText}>Delete</Text>
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
    backgroundColor: '#F8FAF9',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3E7B74',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  searchActionBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  dateFilterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dateFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  tasksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  tabPillRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  pillBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  pillBtnTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  addNewTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E3A34',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  addNewTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  taskList: {
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  checkboxTouch: {
    padding: 2,
  },
  taskContentBox: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  batchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F3F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  batchTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3E7B74',
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTagText: {
    fontSize: 11,
    color: '#64748B',
  },
  deleteActionBtn: {
    padding: 6,
  },

  // Modal styles matching web screenshot 1
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalBody: {
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  fieldTextarea: {
    height: 90,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  dateTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    padding: 0,
  },
  batchSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  batchSelectText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  modalSubmitBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemActive: {
    backgroundColor: '#F0FDFA',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  pickerItemText: {
    fontSize: 14,
    color: '#334155',
  },
  pickerItemTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  deleteModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  deleteModalDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  deleteConfirmBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
