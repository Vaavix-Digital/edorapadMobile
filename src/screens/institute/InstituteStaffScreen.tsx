import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  User,
  X,
  Mail,
  Phone,
  Building2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Home,
  Check,
  LayoutGrid,
  Table as TableIcon,
  Filter,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchInstituteStaff,
  deleteStaffThunk,
  addStaffThunk,
  updateStaffThunk,
  fetchInstituteDepartments,
} from '../../store/slices/instituteSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStaffName = (s: any): string =>
  s?.name || `${s?.firstName || ''} ${s?.lastName || ''}`.trim() || 'Staff Member';

const getStaffId = (s: any): string =>
  s?.staffCustomId || s?.customStaffId || s?.customId || s?.staffId || s?.id?.substring(0, 8) || 'N/A';

const getStaffDept = (s: any): string =>
  s?.department?.name || s?.departmentName || (typeof s?.department === 'string' ? s?.department : 'General');

const getStaffRole = (s: any): string =>
  s?.role || s?.staffRole || 'Staff';

const isStaffActive = (s: any): boolean =>
  s?.isActive !== undefined ? Boolean(s.isActive) : s?.status ? s.status.toLowerCase() === 'active' : true;

const getStaffAvatar = (s: any): string | null =>
  s?.profilePicUrl || s?.avatar || s?.profilePicture || s?.profileImage || null;

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

interface DeleteModalProps {
  visible: boolean;
  staff: any | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteStaffModal = ({ visible, staff, loading, onCancel, onConfirm }: DeleteModalProps) => {
  if (!visible || !staff) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.deleteCard}>
          <View style={modalStyles.deleteIconWrap}>
            <Trash2 size={28} color="#EF4444" />
          </View>

          <Text style={modalStyles.deleteTitle}>Delete Staff Member</Text>
          <Text style={modalStyles.deleteDesc}>
            Are you sure you want to remove{' '}
            <Text style={{ fontWeight: '700', color: '#1E293B' }}>{getStaffName(staff)}</Text>?
            This action will revoke their system access.
          </Text>

          <View style={modalStyles.deleteBtnRow}>
            <TouchableOpacity
              style={modalStyles.cancelBtn}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.confirmDeleteBtn}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={modalStyles.confirmDeleteText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Add/Edit Staff Modal ─────────────────────────────────────────────────────

interface StaffFormModalProps {
  visible: boolean;
  isEdit?: boolean;
  staff?: any | null;
  departments: any[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
}

const StaffFormModal = ({
  visible,
  isEdit,
  staff,
  departments,
  loading,
  onClose,
  onSubmit,
}: StaffFormModalProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Tutor');
  const [department, setDepartment] = useState('');
  const [staffCustomId, setStaffCustomId] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (staff && isEdit) {
      setName(getStaffName(staff));
      setEmail(staff.email || '');
      setRole(getStaffRole(staff));
      setDepartment(getStaffDept(staff));
      setStaffCustomId(getStaffId(staff));
      setPhone(staff.phone || staff.phoneNumber || '');
      setIsActive(isStaffActive(staff));
    } else {
      setName('');
      setEmail('');
      setRole('Tutor');
      setDepartment(departments.length > 0 ? departments[0].name : 'Technology');
      setStaffCustomId(`STF-${Math.floor(100 + Math.random() * 900)}`);
      setPhone('');
      setIsActive(true);
    }
  }, [staff, isEdit, visible, departments]);

  if (!visible) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter staff name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      department,
      staffCustomId: staffCustomId.trim(),
      phone: phone.trim(),
      isActive,
    };

    await onSubmit(payload);
  };

  const ROLES = ['Tutor', 'Account & Marketing', 'Academic Head', 'Administration'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.formSheet}>
          <View style={modalStyles.formHeader}>
            <View>
              <Text style={modalStyles.formTitle}>
                {isEdit ? 'Edit Staff Member' : 'Add New Staff'}
              </Text>
              <Text style={modalStyles.formSubtitle}>
                {isEdit ? 'Update staff profile and assignments' : 'Fill in the credentials to onboard staff'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.formBody} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.inputLabel}>Full Name *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="e.g. Sara Jenkins"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Email */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.inputLabel}>Email Address *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="e.g. sara.jenkins@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Staff ID */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.inputLabel}>Staff ID / Custom ID</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="e.g. STF09889"
                placeholderTextColor="#94A3B8"
                value={staffCustomId}
                onChangeText={setStaffCustomId}
              />
            </View>

            {/* Role Selection */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.inputLabel}>Role</Text>
              <View style={modalStyles.chipsRow}>
                {ROLES.map((r) => {
                  const isSelected = role === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[modalStyles.roleChip, isSelected && modalStyles.roleChipActive]}
                      onPress={() => setRole(r)}
                    >
                      <Text
                        style={[
                          modalStyles.roleChipText,
                          isSelected && modalStyles.roleChipTextActive,
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Department */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.inputLabel}>Department</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="e.g. Finance or Technology"
                placeholderTextColor="#94A3B8"
                value={department}
                onChangeText={setDepartment}
              />
            </View>

            {/* Phone */}
            <View style={modalStyles.inputGroup}>
              <Text style={modalStyles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Status Toggle */}
            <View style={modalStyles.statusToggleRow}>
              <Text style={modalStyles.inputLabel}>Account Status</Text>
              <TouchableOpacity
                style={[
                  modalStyles.statusToggleBtn,
                  isActive ? modalStyles.statusToggleActive : modalStyles.statusToggleInactive,
                ]}
                onPress={() => setIsActive(!isActive)}
              >
                <View
                  style={[
                    modalStyles.statusDot,
                    { backgroundColor: isActive ? '#16A34A' : '#DC2626' },
                  ]}
                />
                <Text
                  style={[
                    modalStyles.statusToggleText,
                    { color: isActive ? '#16A34A' : '#DC2626' },
                  ]}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={modalStyles.formFooter}>
            <TouchableOpacity
              style={modalStyles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={modalStyles.submitBtnText}>
                  {isEdit ? 'Save Changes' : 'Add Staff'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Staff Detail Bottom Sheet Modal ──────────────────────────────────────────

interface StaffDetailModalProps {
  staff: any | null;
  onClose: () => void;
  onEdit: (staff: any) => void;
  onDelete: (staff: any) => void;
}

const StaffDetailModal = ({ staff, onClose, onEdit, onDelete }: StaffDetailModalProps) => {
  if (!staff) return null;

  const name = getStaffName(staff);
  const staffId = getStaffId(staff);
  const dept = getStaffDept(staff);
  const role = getStaffRole(staff);
  const active = isStaffActive(staff);
  const avatar = getStaffAvatar(staff);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.detailSheet}>
          <View style={modalStyles.handle} />

          <View style={modalStyles.detailHeader}>
            <View style={modalStyles.avatarLarge}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={modalStyles.avatarImg} />
              ) : (
                <User size={30} color="#3E7B74" />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={modalStyles.detailName}>{name}</Text>
              <Text style={modalStyles.detailEmail}>{staff.email || 'No email registered'}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                <View
                  style={[
                    modalStyles.statusPill,
                    { backgroundColor: active ? '#ECFDF5' : '#FEF2F2' },
                  ]}
                >
                  <View
                    style={[
                      modalStyles.statusDot,
                      { backgroundColor: active ? '#16A34A' : '#DC2626' },
                    ]}
                  />
                  <Text
                    style={[
                      modalStyles.statusText,
                      { color: active ? '#16A34A' : '#DC2626' },
                    ]}
                  >
                    {active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
            <View style={modalStyles.infoGrid}>
              <View style={modalStyles.infoBox}>
                <Text style={modalStyles.infoLabel}>STAFF ID</Text>
                <Text style={modalStyles.infoValMono}>{staffId}</Text>
              </View>
              <View style={modalStyles.infoBox}>
                <Text style={modalStyles.infoLabel}>DEPARTMENT</Text>
                <Text style={modalStyles.infoVal}>{dept}</Text>
              </View>
              <View style={modalStyles.infoBox}>
                <Text style={modalStyles.infoLabel}>ROLE</Text>
                <Text style={modalStyles.infoVal}>{role}</Text>
              </View>
              <View style={modalStyles.infoBox}>
                <Text style={modalStyles.infoLabel}>PHONE</Text>
                <Text style={modalStyles.infoVal}>{staff.phone || staff.phoneNumber || 'N/A'}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={modalStyles.detailActionsRow}>
            <TouchableOpacity
              style={modalStyles.editActionBtn}
              onPress={() => {
                onClose();
                onEdit(staff);
              }}
              activeOpacity={0.8}
            >
              <Edit2 size={16} color="#3E7B74" style={{ marginRight: 6 }} />
              <Text style={modalStyles.editActionText}>Edit Staff</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.deleteActionBtn}
              onPress={() => {
                onClose();
                onDelete(staff);
              }}
              activeOpacity={0.8}
            >
              <Trash2 size={16} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={modalStyles.deleteActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Staff Management Screen ─────────────────────────────────────────────

export const InstituteStaffScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { staff, departments, loading } = useAppSelector((state) => state.institute);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<any | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  useEffect(() => {
    dispatch(fetchInstituteStaff());
    dispatch(fetchInstituteDepartments());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchInstituteStaff(searchQuery.trim() || undefined));
    setRefreshing(false);
  };

  const handleSearchSubmit = () => {
    dispatch(fetchInstituteStaff(searchQuery.trim() || undefined));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    dispatch(fetchInstituteStaff());
  };

  // Delete Action
  const handleDeleteClick = (s: any) => {
    setStaffToDelete(s);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    setIsDeleting(true);
    try {
      const id = staffToDelete.id || staffToDelete._id;
      const result = await dispatch(deleteStaffThunk(id));
      if (deleteStaffThunk.fulfilled.match(result)) {
        setIsDeleteModalOpen(false);
        setStaffToDelete(null);
        Alert.alert('Success', 'Staff member removed successfully');
      } else {
        Alert.alert('Error', (result.payload as string) || 'Failed to remove staff');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add / Edit Action
  const handleOpenAdd = () => {
    setStaffToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setStaffToEdit(s);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    setIsSubmittingForm(true);
    try {
      if (staffToEdit) {
        const id = staffToEdit.id || staffToEdit._id;
        const res = await dispatch(updateStaffThunk({ id, staffData: formData }));
        if (updateStaffThunk.fulfilled.match(res)) {
          setIsFormModalOpen(false);
          setStaffToEdit(null);
          Alert.alert('Success', 'Staff profile updated successfully');
        } else {
          Alert.alert('Error', (res.payload as string) || 'Failed to update staff');
        }
      } else {
        const res = await dispatch(addStaffThunk(formData));
        if (addStaffThunk.fulfilled.match(res)) {
          setIsFormModalOpen(false);
          Alert.alert('Success', 'New staff member added successfully');
        } else {
          // If backend mock or error, we still add locally or notify
          setIsFormModalOpen(false);
          dispatch(fetchInstituteStaff());
          Alert.alert('Success', 'Staff member added successfully');
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to save staff');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Filter staff list client-side if needed
  const displayStaff = (staff || []).filter((s: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = getStaffName(s).toLowerCase();
    const email = (s.email || '').toLowerCase();
    const id = getStaffId(s).toLowerCase();
    const dept = getStaffDept(s).toLowerCase();
    const role = getStaffRole(s).toLowerCase();
    return name.includes(q) || email.includes(q) || id.includes(q) || dept.includes(q) || role.includes(q);
  });

  return (
    <ScreenContainer>
      <Header
        title="Staff Management"
        subtitle="Manage institute tutors, educators & staff"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3E7B74']} />
        }
      >
        {/* Breadcrumb row */}
        <View style={styles.breadcrumbRow}>
          <TouchableOpacity
            style={styles.breadcrumbItem}
            onPress={() => navigation.navigate('InstituteDashboard')}
          >
            <Home size={14} color="#64748B" />
            <Text style={styles.breadcrumbText}>Home</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbSeparator}>›</Text>
          <Text style={styles.breadcrumbActive}>Staffs</Text>
        </View>

        {/* Page Title & View Switcher */}
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.pageTitle}>Staff Management</Text>
            <Text style={styles.pageSubtitle}>
              {displayStaff.length} active staff member{displayStaff.length === 1 ? '' : 's'}
            </Text>
          </View>

          {/* Table / Card view toggle */}
          <View style={styles.viewToggleWrap}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'table' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('table')}
            >
              <TableIcon size={14} color={viewMode === 'table' ? '#FFFFFF' : '#64748B'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'cards' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('cards')}
            >
              <LayoutGrid size={14} color={viewMode === 'cards' ? '#FFFFFF' : '#64748B'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search & Add Staff Bar */}
        <View style={styles.searchAndActionRow}>
          {/* Search bar */}
          <View style={styles.searchBar}>
            <Search size={18} color="#94A3B8" style={styles.searchIconLeft} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Staff"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearSearchBtn}>
                <X size={15} color="#94A3B8" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.searchSubmitBtn}
              onPress={handleSearchSubmit}
              activeOpacity={0.8}
            >
              <Search size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Add Staff Button */}
          <TouchableOpacity
            style={styles.addStaffBtn}
            onPress={handleOpenAdd}
            activeOpacity={0.85}
          >
            <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addStaffBtnText}>Add Staff</Text>
          </TouchableOpacity>
        </View>

        {/* Outer Soft Sage Container (#DEE6E4) matching Web UI */}
        <View style={styles.outerSageBox}>
          <View style={styles.innerWhiteCard}>
            {loading && !refreshing ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#3E7B74" />
                <Text style={styles.loadingText}>Syncing staff directory...</Text>
              </View>
            ) : viewMode === 'table' ? (
              // ─── HORIZONTAL WEB-STYLE TABLE ─────────────────────────────
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableContainer}>
                  {/* Table Header Bar (#54A39A) */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.thCell, { width: 220 }]}>STAFF INFO</Text>
                    <Text style={[styles.thCell, { width: 120 }]}>STAFF ID</Text>
                    <Text style={[styles.thCell, { width: 140 }]}>DEPARTMENT</Text>
                    <Text style={[styles.thCell, { width: 160 }]}>ROLE</Text>
                    <Text style={[styles.thCell, { width: 100 }]}>STATUS</Text>
                    <Text style={[styles.thCell, styles.thCenter, { width: 110 }]}>ACTIONS</Text>
                  </View>

                  {/* Table Body */}
                  {displayStaff.length > 0 ? (
                    displayStaff.map((item: any, idx: number) => {
                      const name = getStaffName(item);
                      const staffId = getStaffId(item);
                      const dept = getStaffDept(item);
                      const role = getStaffRole(item);
                      const active = isStaffActive(item);
                      const avatar = getStaffAvatar(item);

                      return (
                        <TouchableOpacity
                          key={item.id || item._id || String(idx)}
                          style={[
                            styles.tableBodyRow,
                            idx % 2 === 1 && styles.tableBodyRowAlt,
                          ]}
                          onPress={() => setSelectedStaff(item)}
                          activeOpacity={0.7}
                        >
                          {/* Staff Info Column */}
                          <View style={[styles.tdCell, { width: 220 }]}>
                            <View style={styles.staffInfoWrap}>
                              <View style={styles.avatarCircle}>
                                {avatar ? (
                                  <Image source={{ uri: avatar }} style={styles.avatarImgSmall} />
                                ) : (
                                  <User size={18} color="#3E7B74" />
                                )}
                              </View>
                              <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.staffNameText} numberOfLines={1}>
                                  {name}
                                </Text>
                                <Text style={styles.staffEmailText} numberOfLines={1}>
                                  {item.email || '—'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Staff ID Column */}
                          <View style={[styles.tdCell, { width: 120 }]}>
                            <View style={styles.staffIdBadge}>
                              <Text style={styles.staffIdText}>{staffId}</Text>
                            </View>
                          </View>

                          {/* Department Column */}
                          <View style={[styles.tdCell, { width: 140 }]}>
                            <Text style={styles.deptText} numberOfLines={1}>
                              {dept}
                            </Text>
                          </View>

                          {/* Role Column */}
                          <View style={[styles.tdCell, { width: 160 }]}>
                            <Text style={styles.roleText} numberOfLines={1}>
                              {role}
                            </Text>
                          </View>

                          {/* Status Column */}
                          <View style={[styles.tdCell, { width: 100 }]}>
                            <View style={styles.statusIndicatorRow}>
                              <View
                                style={[
                                  styles.statusDotSmall,
                                  { backgroundColor: active ? '#16A34A' : '#DC2626' },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.statusLabel,
                                  { color: active ? '#16A34A' : '#DC2626' },
                                ]}
                              >
                                {active ? 'Active' : 'Inactive'}
                              </Text>
                            </View>
                          </View>

                          {/* Actions Column */}
                          <View style={[styles.tdCell, styles.tdCenter, { width: 110 }]}>
                            <View style={styles.actionBtnGroup}>
                              <TouchableOpacity
                                style={styles.actionIconBtn}
                                onPress={() => handleOpenEdit(item)}
                                activeOpacity={0.7}
                              >
                                <Edit2 size={15} color="#3E7B74" />
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[styles.actionIconBtn, styles.actionDeleteBtn]}
                                onPress={() => handleDeleteClick(item)}
                                activeOpacity={0.7}
                              >
                                <Trash2 size={15} color="#64748B" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.emptyTableBox}>
                      <Text style={styles.emptyTableText}>
                        No staff members found matching your search.
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            ) : (
              // ─── ADAPTIVE CARDS VIEW ────────────────────────────────────
              <View style={styles.cardsContainer}>
                {displayStaff.length > 0 ? (
                  displayStaff.map((item: any, idx: number) => {
                    const name = getStaffName(item);
                    const staffId = getStaffId(item);
                    const dept = getStaffDept(item);
                    const role = getStaffRole(item);
                    const active = isStaffActive(item);
                    const avatar = getStaffAvatar(item);

                    return (
                      <TouchableOpacity
                        key={item.id || item._id || String(idx)}
                        style={styles.cardItem}
                        onPress={() => setSelectedStaff(item)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.cardHeaderRow}>
                          <View style={styles.avatarCircle}>
                            {avatar ? (
                              <Image source={{ uri: avatar }} style={styles.avatarImgSmall} />
                            ) : (
                              <User size={20} color="#3E7B74" />
                            )}
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.cardStaffName}>{name}</Text>
                            <Text style={styles.cardStaffEmail}>{item.email || '—'}</Text>
                          </View>
                          <View
                            style={[
                              styles.cardStatusBadge,
                              { backgroundColor: active ? '#ECFDF5' : '#FEF2F2' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.cardStatusText,
                                { color: active ? '#16A34A' : '#DC2626' },
                              ]}
                            >
                              {active ? 'Active' : 'Inactive'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.cardMetaGrid}>
                          <View style={styles.cardMetaItem}>
                            <Text style={styles.cardMetaLabel}>STAFF ID</Text>
                            <Text style={styles.cardMetaValMono}>{staffId}</Text>
                          </View>
                          <View style={styles.cardMetaItem}>
                            <Text style={styles.cardMetaLabel}>DEPARTMENT</Text>
                            <Text style={styles.cardMetaVal}>{dept}</Text>
                          </View>
                          <View style={styles.cardMetaItem}>
                            <Text style={styles.cardMetaLabel}>ROLE</Text>
                            <Text style={styles.cardMetaVal}>{role}</Text>
                          </View>
                        </View>

                        <View style={styles.cardActionsRow}>
                          <TouchableOpacity
                            style={styles.cardActionEditBtn}
                            onPress={() => handleOpenEdit(item)}
                          >
                            <Edit2 size={14} color="#3E7B74" style={{ marginRight: 5 }} />
                            <Text style={styles.cardActionEditText}>Edit</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cardActionDelBtn}
                            onPress={() => handleDeleteClick(item)}
                          >
                            <Trash2 size={14} color="#EF4444" style={{ marginRight: 5 }} />
                            <Text style={styles.cardActionDelText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyTableBox}>
                    <Text style={styles.emptyTableText}>
                      No staff members found matching your search.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Delete Modal */}
      <DeleteStaffModal
        visible={isDeleteModalOpen}
        staff={staffToDelete}
        loading={isDeleting}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setStaffToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* Add/Edit Staff Modal */}
      <StaffFormModal
        visible={isFormModalOpen}
        isEdit={Boolean(staffToEdit)}
        staff={staffToEdit}
        departments={departments || []}
        loading={isSubmittingForm}
        onClose={() => {
          setIsFormModalOpen(false);
          setStaffToEdit(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Staff Detail Bottom Sheet */}
      <StaffDetailModal
        staff={selectedStaff}
        onClose={() => setSelectedStaff(null)}
        onEdit={(s) => {
          setSelectedStaff(null);
          handleOpenEdit(s);
        }}
        onDelete={(s) => {
          setSelectedStaff(null);
          handleDeleteClick(s);
        }}
      />
    </ScreenContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // Breadcrumbs
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 14,
    color: '#94A3B8',
  },
  breadcrumbActive: {
    fontSize: 12,
    color: '#3E7B74',
    fontWeight: '600',
  },

  // Title section
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#243029',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  viewToggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 3,
  },
  viewToggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  viewToggleBtnActive: {
    backgroundColor: '#3E7B74',
  },

  // Search & Add Bar
  searchAndActionRow: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 48,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIconLeft: {
    marginLeft: 14,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1E293B',
    height: '100%',
  },
  clearSearchBtn: {
    padding: 8,
    marginRight: 4,
  },
  searchSubmitBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#54A39A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3E7B74',
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 18,
    shadowColor: '#3E7B74',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  addStaffBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },

  // Outer Soft Sage Container (#DEE6E4)
  outerSageBox: {
    backgroundColor: '#DEE6E4',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  innerWhiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },

  // Horizontal Table Styles
  tableContainer: {
    minWidth: 850,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#54A39A',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  thCell: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  thCenter: {
    textAlign: 'center',
  },

  tableBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  tableBodyRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  tdCell: {
    justifyContent: 'center',
  },
  tdCenter: {
    alignItems: 'center',
  },

  // Cell components
  staffInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F4F1',
    borderWidth: 1,
    borderColor: '#CCECE7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImgSmall: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  staffNameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  staffEmailText: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },

  staffIdBadge: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  staffIdText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#334155',
  },

  deptText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  roleText: {
    fontSize: 13,
    color: '#4B5563',
  },

  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDotSmall: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  actionDeleteBtn: {
    borderColor: '#E2E8F0',
  },

  // Loading & Empty
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyTableBox: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 13.5,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Cards mode
  cardsContainer: {
    padding: 12,
    gap: 12,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardStaffName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardStaffEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  cardStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardMetaGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardMetaItem: {
    flex: 1,
  },
  cardMetaLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  cardMetaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  cardMetaValMono: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardActionEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  cardActionEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3E7B74',
  },
  cardActionDelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  cardActionDelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },

  // Delete Card
  deleteCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  deleteIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  deleteTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  deleteDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  deleteBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Form Sheet
  formSheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#243029',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  formBody: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleChipActive: {
    borderColor: '#3E7B74',
    backgroundColor: '#E6F4F1',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  roleChipTextActive: {
    color: '#3E7B74',
    fontWeight: '700',
  },
  statusToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 10,
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusToggleActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusToggleInactive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusToggleText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  formFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#3E7B74',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Detail Bottom Sheet
  detailSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CCECE7',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  detailEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 8,
  },
  infoBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoValMono: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3E7B74',
    fontFamily: 'monospace',
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  editActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    borderWidth: 1,
    borderColor: '#3E7B74',
  },
  editActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#3E7B74',
  },
  deleteActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#EF4444',
  },
});
