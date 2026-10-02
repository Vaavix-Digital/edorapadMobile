import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ClipboardCheck,
  Search,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchStudentAssessments } from '../../store/slices/studentSlice';
import { Exam } from '../../shared/types';

// ─── Constants & Helpers ────────────────────────────────────────────────────────

const TAB_CATEGORY: Record<string, string> = {
  Exams: 'EXAM',
  Quizzes: 'QUIZ',
  Assignments: 'ASSIGNMENT',
};

const TABS = ['Exams', 'Quizzes', 'Assignments'];
const STATUS_FILTERS = ['All', 'Pending', 'Submitted', 'Completed'];

/**
 * Derive exam status matching web:
 * - No submission → 'Pending'
 * - submission.status === 'GRADED' → 'Completed'
 * - Otherwise → 'Submitted'
 */
export const deriveExamStatus = (exam: any): 'Pending' | 'Submitted' | 'Completed' => {
  const sub = exam?.submissions?.[0];
  if (!sub) return 'Pending';
  if (sub.status === 'GRADED') return 'Completed';
  return 'Submitted';
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return iso;
  }
};

export const StudentAssessmentsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { assessments, loading } = useAppSelector((state) => state.student);

  const [activeTab, setActiveTab] = useState<string>('Exams');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Fetch assessments when activeTab changes
  useEffect(() => {
    const category = TAB_CATEGORY[activeTab] || 'EXAM';
    dispatch(fetchStudentAssessments(category));
  }, [activeTab, dispatch]);

  const handleRefresh = () => {
    const category = TAB_CATEGORY[activeTab] || 'EXAM';
    dispatch(fetchStudentAssessments(category));
  };

  // ── Filter list by search query and status ──
  const filteredList = useMemo(() => {
    if (!Array.isArray(assessments)) return [];
    return assessments.filter((exam: any) => {
      const status = deriveExamStatus(exam);

      // Search filter
      const q = searchQuery.trim().toLowerCase();
      const title = (exam.title || '').toLowerCase();
      const id = (exam.id || exam._id || '').toLowerCase();
      const batchName = (
        typeof exam.batch === 'object'
          ? exam.batch?.name || exam.batch?.code || ''
          : exam.batchName || exam.batch || ''
      ).toLowerCase();

      const matchesSearch = !q || title.includes(q) || id.includes(q) || batchName.includes(q);

      // Status filter
      const matchesStatus =
        selectedStatus === 'All' || status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [assessments, searchQuery, selectedStatus]);

  const handleAction = (exam: any, status: string) => {
    if (status === 'Completed') {
      const score = exam.submissions?.[0]?.score ?? exam.score ?? 'N/A';
      Alert.alert(
        'Assessment Result',
        `Assessment: ${exam.title}\nScore: ${score} / ${exam.totalMarks || 100}\nStatus: Graded & Completed`,
        [{ text: 'Close', style: 'default' }]
      );
    } else if (status === 'Submitted') {
      Alert.alert(
        'Review Submission',
        `Assessment: ${exam.title}\nYour submission is under review by the faculty tutor.`,
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      Alert.alert(
        'Start Assessment',
        `Assessment: ${exam.title}\nTotal Marks: ${exam.totalMarks || 100}\nPass Marks: ${
          exam.passMarks ?? exam.passingMarks ?? 40
        }\nDue Date: ${formatDate(exam.dueDate || exam.date)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Begin Now', style: 'default' },
        ]
      );
    }
  };

  const renderAssessmentItem = ({ item }: { item: any }) => {
    const status = deriveExamStatus(item);
    const batchDisplay =
      typeof item.batch === 'object'
        ? item.batch?.name || item.batch?.code || 'GLB MRN EVE 101'
        : item.batchName || item.batch || 'GLB MRN EVE 101';

    const actionText = status === 'Completed' ? 'View' : status === 'Submitted' ? 'Review' : 'Start';

    // Status badge style
    const isCompleted = status === 'Completed';
    const isSubmitted = status === 'Submitted';
    const isPending = status === 'Pending';

    const statusBadgeStyle = isCompleted
      ? styles.statusCompleted
      : isSubmitted
      ? styles.statusSubmitted
      : styles.statusPending;

    const statusTextStyle = isCompleted
      ? styles.statusCompletedText
      : isSubmitted
      ? styles.statusSubmittedText
      : styles.statusPendingText;

    return (
      <Card style={styles.examCard}>
        {/* Card Header: Title & Status */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.examTitle} numberOfLines={2}>
              {item.title || 'Assessment'}
            </Text>
            <View style={styles.batchRow}>
              <Text style={styles.batchText}>{batchDisplay}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, statusBadgeStyle]}>
            <Text style={[styles.statusText, statusTextStyle]}>{status}</Text>
          </View>
        </View>

        {/* 3-Column Info Metrics */}
        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Total Marks</Text>
            <Text style={styles.metaVal}>{item.totalMarks ?? '—'}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Pass Marks</Text>
            <Text style={styles.metaVal}>
              {item.passMarks ?? item.passingMarks ?? '—'}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaVal}>
              {formatDate(item.dueDate || item.date)}
            </Text>
          </View>
        </View>

        {/* Card Footer with Web Parity Action Button */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[styles.actionBtn, isCompleted && styles.actionBtnSecondary]}
            onPress={() => handleAction(item, status)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.actionBtnText,
                isCompleted && styles.actionBtnTextSecondary,
              ]}
            >
              {actionText}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      {/* Top Header */}
      <View style={styles.headerWrap}>
        <Header
          title="Assessments"
          subtitle="Quizzes, tests and performance results"
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      {/* Category Tabs: Exams | Quizzes | Assignments */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab(tab);
                setSearchQuery('');
                setSelectedStatus('All');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Search size={16} color={THEME.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab.toLowerCase()} by name or ID`}
            placeholderTextColor={THEME.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Filter Chips */}
      <View style={styles.filterChipRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(s) => s}
          contentContainerStyle={styles.filterChipList}
          renderItem={({ item: status }) => {
            const isSelected = selectedStatus === status;
            return (
              <TouchableOpacity
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSelectedStatus(status)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Assessment List */}
      {loading && assessments.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading {activeTab.toLowerCase()}...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item: any, idx: number) =>
            item.id || item._id || `${item.title}-${idx}`
          }
          renderItem={renderAssessmentItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor={THEME.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <ClipboardCheck size={44} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedStatus !== 'All'
                  ? 'No matching assessments'
                  : `No ${activeTab} Available`}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery || selectedStatus !== 'All'
                  ? 'Try adjusting your search query or status filter.'
                  : `There are currently no active ${activeTab.toLowerCase()} scheduled for your enrolled batches.`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  headerWrap: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
  },

  // ── Tabs ──
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.md,
    padding: 3,
    gap: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.sm,
  },
  tabBtnActive: {
    backgroundColor: THEME.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Search ──
  searchRow: {
    paddingHorizontal: THEME.spacing.md,
    marginTop: 10,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textPrimary,
    paddingVertical: 0,
  },

  // ── Filter Chips ──
  filterChipRow: {
    marginVertical: 10,
  },
  filterChipList: {
    paddingHorizontal: THEME.spacing.md,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipActive: {
    backgroundColor: THEME.colors.primaryLight,
    borderColor: THEME.colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  chipTextActive: {
    color: THEME.colors.primaryDark,
    fontWeight: '700',
  },

  // ── List & Cards ──
  listContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: 40,
    gap: 12,
  },
  examCard: {
    padding: 16,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  examTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 20,
  },
  batchRow: {
    marginTop: 4,
  },
  batchText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },

  // ── Status Badges ──
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusCompletedText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  statusSubmitted: {
    backgroundColor: '#DBEAFE',
  },
  statusSubmittedText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Meta Metrics ──
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  metaCol: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },

  // ── Card Footer Action ──
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
    paddingTop: 10,
  },
  actionBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 22,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: '#3D7A73',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnTextSecondary: {
    color: '#FFFFFF',
  },

  // ── Loading & Empty States ──
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: THEME.colors.textMuted,
    fontWeight: '500',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
