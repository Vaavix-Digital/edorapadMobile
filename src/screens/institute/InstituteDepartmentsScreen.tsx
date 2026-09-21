import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Building2,
  Users,
  BookOpen,
  ShieldCheck,
  Search,
  ChevronRight,
  X,
  GraduationCap,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchInstituteDepartments } from '../../store/slices/instituteSlice';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDeptHead = (dept: any): string => {
  if (dept.head?.name) return dept.head.name;
  if (dept.headOfDepartment?.name) return dept.headOfDepartment.name;
  if (dept.headName) return dept.headName;
  if (dept.head) return dept.head;
  return 'Not Assigned';
};

const getCourseCount = (dept: any): number =>
  dept.courses?.length ?? dept.courseCount ?? dept.coursesCount ?? 0;

const getStaffCount = (dept: any): number =>
  dept.staffCount ?? dept.staffs?.length ?? dept.facultyCount ?? 0;

const getStudentCount = (dept: any): number =>
  dept.studentCount ?? dept.students?.length ?? dept.studentsCount ?? 0;

// ─── Department Details Modal ─────────────────────────────────────────────────

const DeptDetailsModal = ({
  dept,
  onClose,
}: {
  dept: any | null;
  onClose: () => void;
}) => {
  if (!dept) return null;

  const head = getDeptHead(dept);
  const courseCount = getCourseCount(dept);
  const staffCount = getStaffCount(dept);
  const studentCount = getStudentCount(dept);
  const courses: any[] = dept.courses || [];
  const staffs: any[] = dept.staffs || [];

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          {/* Handle bar */}
          <View style={modal.handle} />

          {/* Header */}
          <View style={modal.header}>
            <View style={modal.iconBox}>
              <Building2 size={22} color="#0F766E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={modal.deptName} numberOfLines={2}>{dept.name}</Text>
              {dept.code && <Text style={modal.deptCode}>Code: {dept.code}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* Description */}
            {!!dept.description && (
              <View style={modal.section}>
                <Text style={modal.desc}>{dept.description}</Text>
              </View>
            )}

            {/* Head of Dept */}
            <View style={modal.headBar}>
              <ShieldCheck size={14} color="#0F766E" />
              <Text style={modal.headLabel}>Head of Department:</Text>
              <Text style={modal.headValue}>{head}</Text>
            </View>

            {/* Stats row */}
            <View style={modal.statsRow}>
              <View style={modal.statBox}>
                <Text style={modal.statVal}>{staffCount}</Text>
                <Text style={modal.statLabel}>Staff</Text>
              </View>
              <View style={[modal.statBox, modal.statBorderX]}>
                <Text style={modal.statVal}>{courseCount}</Text>
                <Text style={modal.statLabel}>Courses</Text>
              </View>
              <View style={modal.statBox}>
                <Text style={modal.statVal}>{studentCount}</Text>
                <Text style={modal.statLabel}>Students</Text>
              </View>
            </View>

            {/* Courses list */}
            {courses.length > 0 && (
              <View style={modal.section}>
                <Text style={modal.sectionTitle}>Courses</Text>
                {courses.map((c: any, i: number) => (
                  <View key={c.id || c._id || i} style={modal.listItem}>
                    <BookOpen size={13} color="#0F766E" />
                    <Text style={modal.listItemText} numberOfLines={2}>
                      {c.title || c.name || c}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Staff list */}
            {staffs.length > 0 && (
              <View style={modal.section}>
                <Text style={modal.sectionTitle}>Staff Members</Text>
                {staffs.slice(0, 5).map((s: any, i: number) => (
                  <View key={s.id || s._id || i} style={modal.listItem}>
                    <Users size={13} color="#0F766E" />
                    <Text style={modal.listItemText} numberOfLines={1}>
                      {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Staff Member'}
                    </Text>
                    {s.role && <Text style={modal.listItemRole}>{s.role}</Text>}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Department Card ──────────────────────────────────────────────────────────

const DeptCard = ({
  item,
  onViewDetails,
}: {
  item: any;
  onViewDetails: () => void;
}) => {
  const head = getDeptHead(item);
  const courseCount = getCourseCount(item);
  const staffCount = getStaffCount(item);
  const studentCount = getStudentCount(item);

  return (
    <Card style={styles.card}>
      {/* Top row: icon + name/code */}
      <View style={styles.cardTop}>
        <View style={styles.iconBox}>
          <Building2 size={22} color="#0F766E" />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.deptName}>{item.name}</Text>
          {item.code && <Text style={styles.deptCode}>Code: {item.code}</Text>}
        </View>
      </View>

      {/* Description */}
      {!!item.description && (
        <Text style={styles.deptDesc} numberOfLines={2}>{item.description}</Text>
      )}

      {/* Head of Dept bar */}
      <View style={styles.headBox}>
        <ShieldCheck size={14} color="#0F766E" />
        <Text style={styles.headLabel}>Head of Dept: </Text>
        <Text style={styles.headValue} numberOfLines={1}>{head}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>{staffCount}</Text>
          <Text style={styles.metricLabel}>Staff</Text>
        </View>
        <View style={[styles.metricItem, styles.metricBorder]}>
          <Text style={styles.metricVal}>{courseCount}</Text>
          <Text style={styles.metricLabel}>Courses</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>{studentCount}</Text>
          <Text style={styles.metricLabel}>Students</Text>
        </View>
      </View>

      {/* View Details button */}
      <TouchableOpacity style={styles.viewBtn} onPress={onViewDetails} activeOpacity={0.8}>
        <Text style={styles.viewBtnText}>View Details</Text>
        <ChevronRight size={14} color="#FFF" />
      </TouchableOpacity>
    </Card>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const InstituteDepartmentsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { departments, loading } = useAppSelector((state) => state.institute);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchInstituteDepartments());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchInstituteDepartments());
    setRefreshing(false);
  };

  const filtered = departments.filter((d) =>
    !searchQuery.trim() || d.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScreenContainer>
      <Header
        title="Department Management"
        subtitle="Manage academic departments"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Departments..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Loading */}
      {loading && departments.length === 0 && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading departments...</Text>
        </View>
      )}

      {/* Department list */}
      {!loading && !departments.length ? (
        <View style={styles.centerBox}>
          <Building2 size={40} color="#CBD5E1" />
          <Text style={styles.emptyText}>No departments found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id || item._id || item.name}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0F766E']}
              tintColor="#0F766E"
            />
          }
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.centerBox}>
                <Text style={styles.emptyText}>No departments match "{searchQuery}"</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <DeptCard
              item={item}
              onViewDetails={() => setSelectedDept(item)}
            />
          )}
        />
      )}

      {/* Details Modal */}
      <DeptDetailsModal
        dept={selectedDept}
        onClose={() => setSelectedDept(null)}
      />
    </ScreenContainer>
  );
};

// ─── Card Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E293B',
    paddingVertical: 0,
  },
  list: {
    paddingBottom: 32,
    gap: 14,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  card: {
    padding: 16,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#0F766E33',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
  },
  deptName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    lineHeight: 20,
  },
  deptCode: {
    fontSize: 11.5,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  deptDesc: {
    fontSize: 12.5,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  headBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
    marginBottom: 12,
  },
  headLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  headValue: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
    paddingTop: 12,
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F766E',
  },
  metricLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  viewBtn: {
    backgroundColor: '#0F766E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deptName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 21,
    flex: 1,
  },
  deptCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  section: {
    marginBottom: 14,
  },
  desc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  headBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF9',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
    marginBottom: 14,
  },
  headLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  headValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBorderX: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F766E',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  listItemText: {
    fontSize: 13,
    color: '#1E293B',
    flex: 1,
  },
  listItemRole: {
    fontSize: 10.5,
    color: '#0F766E',
    fontWeight: '700',
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
