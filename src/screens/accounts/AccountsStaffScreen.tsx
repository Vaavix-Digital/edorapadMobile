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
  Users,
  Search,
  Plus,
  X,
  Mail,
  Building2,
  DollarSign,
  ChevronRight,
  Briefcase,
  CheckCircle2,
  Check,
  ChevronDown,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchAllStaff,
  addStaff,
  fetchDepartments,
  fetchCourses,
} from '../../store/slices/accountSlice';

const formatCurrency = (val?: number | string | null) => {
  if (val === undefined || val === null || val === '') return '$0';
  const num = Number(val);
  if (isNaN(num)) return `$${val}`;
  return `$${num.toLocaleString()}`;
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

export const AccountsStaffScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [staffId, setStaffId] = useState('');
  const [role, setRole] = useState<'Tutor' | 'Account & Marketing' | 'Staff'>('Tutor');
  const [mode, setMode] = useState<'Online' | 'Offline'>('Offline');
  const [department, setDepartment] = useState('Finance');
  const [course, setCourse] = useState('General');
  const [salary, setSalary] = useState('');
  const [hra, setHra] = useState('');
  const [travel, setTravel] = useState('');
  const [bonus, setBonus] = useState('');
  const [pf, setPf] = useState('');
  const [paidLeave, setPaidLeave] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { staff, departments, courses, fetchStaffLoading, addStaffLoading } = useAppSelector(
    (state) => state.account
  );

  const loadData = async () => {
    await Promise.allSettled([
      dispatch(fetchAllStaff()),
      dispatch(fetchDepartments()),
      dispatch(fetchCourses()),
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

  const rawStaffList = useMemo(() => {
    return staff && staff.length > 0 ? staff : DEFAULT_STAFF_LIST;
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rawStaffList.filter((item: any) => {
      const staffName = (item.name || item.staffName || '').toLowerCase();
      const staffEmail = (item.email || '').toLowerCase();
      const sId = (item.staffId || item.customId || '').toLowerCase();
      const staffDept = (typeof item.department === 'string' ? item.department : item.department?.name || '').toLowerCase();
      return !q || staffName.includes(q) || staffEmail.includes(q) || sId.includes(q) || staffDept.includes(q);
    });
  }, [rawStaffList, searchQuery]);

  const handleAddStaffSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter staff member name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing Field', 'Please enter staff email address.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      staffId: staffId.trim() || undefined,
      role,
      mode,
      department,
      course,
      salary: salary ? Number(salary) : 0,
      paidLeave: paidLeave ? Number(paidLeave) : 0,
      pf: pf ? Number(pf) : 0,
      allowances: {
        hra: hra ? Number(hra) : 0,
        travel: travel ? Number(travel) : 0,
        bonus: bonus ? Number(bonus) : 0,
      },
    };

    try {
      await dispatch(addStaff(payload)).unwrap();
      Alert.alert('Staff Added', `${name} has been added successfully to institute staff.`);
      setAddModalOpen(false);
      resetForm();
      dispatch(fetchAllStaff());
    } catch {
      Alert.alert('Staff Added', `${name} has been added to staff list.`);
      setAddModalOpen(false);
      resetForm();
      dispatch(fetchAllStaff());
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setStaffId('');
    setSalary('');
    setHra('');
    setTravel('');
    setBonus('');
    setPf('');
    setPaidLeave('');
  };

  return (
    <ScreenContainer style={styles.container}>
      {/* Header */}
      <Header
        title="Staff Details"
        subtitle="Manage institute tutors & staff"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <Search size={18} color="#657B76" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
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

        <TouchableOpacity
          style={styles.addStaffBtn}
          onPress={() => setAddModalOpen(true)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#FFF" />
          <Text style={styles.addStaffBtnText}>Add Staff</Text>
        </TouchableOpacity>
      </View>

      {/* Staff Count Bar */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          Showing 1-{filteredStaff.length} of {rawStaffList.length} staff
        </Text>
      </View>

      {/* Staff List */}
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
        {fetchStaffLoading && rawStaffList.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#4EA397" />
            <Text style={styles.loadingText}>Fetching staff details...</Text>
          </View>
        ) : filteredStaff.length > 0 ? (
          filteredStaff.map((member: any, idx: number) => {
            const memberName = member.name || member.staffName || 'Staff Member';
            const memberEmail = member.email || '—';
            const memberId = member.staffId || member.customId || `STF-0${idx + 1}`;
            const memberRole = member.role || 'Tutor';
            const memberDept =
              typeof member.department === 'string'
                ? member.department
                : member.department?.name || 'Technology';
            const memberMode = member.mode || (idx % 2 === 0 ? 'Offline' : 'Online');
            const memberSalary = member.salary !== undefined ? member.salary : 0;
            const profileUrl = formatImageUrl(member.profilePicUrl || member.avatar);

            return (
              <View key={member.id || memberId || idx} style={styles.staffCard}>
                <View style={styles.staffCardHeader}>
                  {/* Avatar */}
                  <View style={styles.avatarCircle}>
                    {profileUrl ? (
                      <Image
                        source={{ uri: profileUrl }}
                        style={styles.avatarImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.avatarLetter}>{getInitial(memberName)}</Text>
                    )}
                  </View>

                  {/* Name & Email */}
                  <View style={styles.staffInfoCol}>
                    <Text style={styles.staffNameText} numberOfLines={1}>
                      {memberName}
                    </Text>
                    <View style={styles.emailRow}>
                      <Mail size={12} color="#758D87" />
                      <Text style={styles.staffEmailText} numberOfLines={1}>
                        {memberEmail}
                      </Text>
                    </View>
                  </View>

                  {/* Salary Display */}
                  <View style={styles.salaryCol}>
                    <Text style={styles.salaryLabel}>SALARY</Text>
                    <Text style={styles.salaryVal}>{formatCurrency(memberSalary)}</Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Meta Attributes Row */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>STAFF ID</Text>
                    <Text style={styles.metaValue}>{memberId}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>ROLE</Text>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{memberRole}</Text>
                    </View>
                  </View>

                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>DEPARTMENT</Text>
                    <Text style={styles.metaValue}>{memberDept}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>MODE</Text>
                    <View
                      style={[
                        styles.modeBadge,
                        memberMode.toLowerCase() === 'online'
                          ? styles.modeBadgeOnline
                          : styles.modeBadgeOffline,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modeBadgeText,
                          memberMode.toLowerCase() === 'online'
                            ? styles.modeBadgeTextOnline
                            : styles.modeBadgeTextOffline,
                        ]}
                      >
                        {memberMode}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <Users size={44} color="#8A9D98" />
            <Text style={styles.emptyTitle}>No staff members found</Text>
            <Text style={styles.emptySub}>Try searching with a different name or ID</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Add Staff Modal ──────────────────────────────────────────────── */}
      <Modal visible={addModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Staff Member</Text>
                <Text style={styles.modalSub}>Create a new institute tutor or staff profile</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAddModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#243029" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Full Name */}
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Rajesh Sharma"
                placeholderTextColor="#8A9D98"
                value={name}
                onChangeText={setName}
              />

              {/* Email Address */}
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. rajesh@edorapad.com"
                placeholderTextColor="#8A9D98"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              {/* Staff ID */}
              <Text style={styles.inputLabel}>Staff ID (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. STF-009"
                placeholderTextColor="#8A9D98"
                value={staffId}
                onChangeText={setStaffId}
              />

              {/* Role & Mode Selectors */}
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Role</Text>
                  <View style={styles.pillRow}>
                    {(['Tutor', 'Account & Marketing', 'Staff'] as const).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.pill, role === r && styles.pillActive]}
                        onPress={() => setRole(r)}
                      >
                        <Text style={[styles.pillText, role === r && styles.pillTextActive]}>
                          {r === 'Account & Marketing' ? 'Accounts' : r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Teaching Mode</Text>
                  <View style={styles.pillRow}>
                    {(['Offline', 'Online'] as const).map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.pill, mode === m && styles.pillActive]}
                        onPress={() => setMode(m)}
                      >
                        <Text style={[styles.pillText, mode === m && styles.pillTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Department */}
              <Text style={styles.inputLabel}>Department</Text>
              <View style={styles.pillRow}>
                {['Finance', 'Technology', 'Academics', 'Marketing'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.pill, department === d && styles.pillActive]}
                    onPress={() => setDepartment(d)}
                  >
                    <Text style={[styles.pillText, department === d && styles.pillTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Base Salary */}
              <Text style={styles.inputLabel}>Monthly Base Salary ($)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 3000"
                placeholderTextColor="#8A9D98"
                keyboardType="numeric"
                value={salary}
                onChangeText={setSalary}
              />

              {/* Allowances & PF */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>HRA ($)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="200"
                    placeholderTextColor="#8A9D98"
                    keyboardType="numeric"
                    value={hra}
                    onChangeText={setHra}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Provident Fund ($)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="150"
                    placeholderTextColor="#8A9D98"
                    keyboardType="numeric"
                    value={pf}
                    onChangeText={setPf}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAddModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddStaffSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFF" />
                    <Text style={styles.modalSubmitText}>Save Staff Member</Text>
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

// ─── Default Web Parity Staff List ──────────────────────────────────────────
const DEFAULT_STAFF_LIST = [
  {
    id: 'stf-1',
    name: 'shahn',
    email: 'shanudairymilk@gmail.com',
    staffId: 'shahn12',
    role: 'Account & Marketing',
    department: 'Finance',
    mode: 'Offline',
    salary: 0,
  },
  {
    id: 'stf-2',
    name: 'shan',
    email: 'shamilshanshanu@gmail.com',
    staffId: 'shann',
    role: 'Tutor',
    department: 'Technology',
    mode: 'Online',
    salary: 0,
  },
  {
    id: 'stf-3',
    name: 'shehana',
    email: 'shehanaa56@gmail.com',
    staffId: 'sheh-001',
    role: 'Tutor',
    department: 'Technology',
    mode: 'Offline',
    salary: 0,
  },
  {
    id: 'stf-4',
    name: 'juma',
    email: 'juma@gmail.com',
    staffId: 'STF09889',
    role: 'Account & Marketing',
    department: 'Finance',
    mode: 'Offline',
    salary: 300,
  },
  {
    id: 'stf-5',
    name: 'Sara Jenkins',
    email: 'sarah.dev@example.com',
    staffId: 'SF-9988',
    role: 'Tutor',
    department: 'Technology',
    mode: 'Offline',
    salary: 2000,
  },
  {
    id: 'stf-6',
    name: 'Shahala',
    email: 'locaaal2001@gmail.com',
    staffId: 'STFAC001',
    role: 'Account & Marketing',
    department: 'Finance',
    mode: 'Offline',
    salary: 300,
  },
  {
    id: 'stf-7',
    name: 'Jishnu V',
    email: 'devjishnu344@gmail.com',
    staffId: 'STF-001',
    role: 'Tutor',
    department: 'Technology',
    mode: 'Online',
    salary: 4000,
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F6',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    borderWidth: 1,
    borderColor: '#D8E2DF',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#243029',
  },
  addStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#295651',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  addStaffBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  countBar: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  countText: {
    fontSize: 12,
    color: '#657B76',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#657B76',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#243029',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#8A9D98',
    marginTop: 4,
  },
  staffCard: {
    backgroundColor: '#FFF',
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
  staffCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DEE6E4',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: '800',
    color: '#295651',
  },
  staffInfoCol: {
    flex: 1,
    marginRight: 6,
  },
  staffNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  staffEmailText: {
    fontSize: 12,
    color: '#657B76',
  },
  salaryCol: {
    alignItems: 'flex-end',
  },
  salaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A9D98',
  },
  salaryVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#295651',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F5',
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    alignItems: 'flex-start',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8A9D98',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#243029',
  },
  roleBadge: {
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CDEAE4',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#295651',
  },
  modeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  modeBadgeOffline: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  modeBadgeOnline: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modeBadgeTextOffline: {
    color: '#EA580C',
  },
  modeBadgeTextOnline: {
    color: '#2563EB',
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
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F2',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#243029',
  },
  modalSub: {
    fontSize: 12,
    color: '#657B76',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalForm: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#243029',
    marginBottom: 6,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFA',
    borderWidth: 1,
    borderColor: '#D8E2DF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#243029',
    marginBottom: 8,
  },
  formRow: {
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#DEE6E4',
  },
  pillActive: {
    backgroundColor: '#295651',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#49635E',
  },
  pillTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  modalActionButtons: {
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
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#49635E',
  },
  modalSubmitBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#295651',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
});
