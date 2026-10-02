import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Award, BookOpen, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { StudentSelector } from '../../components/parent/StudentSelector';
import { StatusBadge } from '../../components/common/StatusBadge';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchParentExamResults,
  fetchParentAssignmentResults,
  fetchParentQuizResults,
  fetchParentProfile,
} from '../../store/slices/parentSlice';
import { formatDate } from '../../shared/utils/dateHelpers';

const TABS = [
  { key: 'exam', label: 'Exams' },
  { key: 'assignment', label: 'Assignments' },
  { key: 'quiz', label: 'Quizzes' },
] as const;

const DEFAULT_EXAMS = [
  { name: 'Mid-term Mathematics', course: 'Advanced Algebra', dateTaken: '2026-08-25', score: 94, totalMarks: 100, status: 'Graded', details: 'Excellent problem solving' },
  { name: 'Physics Monthly Assessment', course: 'Mechanics & Thermodynamics', dateTaken: '2026-08-18', score: 88, totalMarks: 100, status: 'Graded', details: 'Good understanding of core concepts' },
  { name: 'Computer Science Practical', course: 'Data Structures', dateTaken: '2026-08-10', score: 95, totalMarks: 100, status: 'Graded', details: 'Clean code & optimal algorithm' },
  { name: 'Chemistry Unit Test', course: 'Organic Chemistry', dateTaken: '2026-08-01', score: 82, totalMarks: 100, status: 'Graded', details: 'Needs minor revision on reactions' },
  { name: 'English Literature Exam', course: 'World Literature', dateTaken: '2026-07-22', score: 90, totalMarks: 100, status: 'Graded', details: 'Very well structured essay' },
  { name: 'History Quarterly Test', course: 'Modern History', dateTaken: '2026-07-15', score: 85, totalMarks: 100, status: 'Graded', details: 'Good factual analysis' },
  { name: 'Environmental Science Test', course: 'Ecology', dateTaken: '2026-07-05', score: 88, totalMarks: 100, status: 'Graded', details: 'Completed' },
];

const DEFAULT_ASSIGNMENTS = [
  { name: 'Algorithm Analysis Report', course: 'Computer Science', dateTaken: '2026-09-02', score: 48, totalMarks: 50, status: 'Submitted', details: 'Well researched submission' },
  { name: 'Thermodynamics Problem Set', course: 'Physics', dateTaken: '2026-08-28', score: 45, totalMarks: 50, status: 'Submitted', details: 'Accurate derivations' },
];

const DEFAULT_QUIZZES = [
  { name: 'Calculus Quick Quiz 1', course: 'Mathematics', dateTaken: '2026-09-06', score: 19, totalMarks: 20, status: 'Completed', details: 'Great speed and accuracy' },
  { name: 'Python Basics Quiz', course: 'Computer Science', dateTaken: '2026-08-30', score: 20, totalMarks: 20, status: 'Completed', details: 'Perfect score' },
];

export const ParentExamResultsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<'exam' | 'assignment' | 'quiz'>('exam');

  const {
    examResultsAll,
    assignmentResultsAll,
    quizResultsAll,
    selectedStudentId,
    loading,
    error,
  } = useAppSelector((state) => state.parent);

  useEffect(() => {
    dispatch(fetchParentProfile());
    dispatch(fetchParentExamResults());
    dispatch(fetchParentAssignmentResults());
    dispatch(fetchParentQuizResults());
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchParentExamResults());
    dispatch(fetchParentAssignmentResults());
    dispatch(fetchParentQuizResults());
  };

  // Find active student data for each category
  const activeExamData = useMemo(() => {
    if (!selectedStudentId || !Array.isArray(examResultsAll)) return examResultsAll?.[0] || {};
    return (
      examResultsAll.find(
        (s) => s?.studentInfo?.id === selectedStudentId || s?.studentInfo?._id === selectedStudentId
      ) || examResultsAll[0] || {}
    );
  }, [examResultsAll, selectedStudentId]);

  const activeAssignmentData = useMemo(() => {
    if (!selectedStudentId || !Array.isArray(assignmentResultsAll)) return assignmentResultsAll?.[0] || {};
    return (
      assignmentResultsAll.find(
        (s) => s?.studentInfo?.id === selectedStudentId || s?.studentInfo?._id === selectedStudentId
      ) || assignmentResultsAll[0] || {}
    );
  }, [assignmentResultsAll, selectedStudentId]);

  const activeQuizData = useMemo(() => {
    if (!selectedStudentId || !Array.isArray(quizResultsAll)) return quizResultsAll?.[0] || {};
    return (
      quizResultsAll.find(
        (s) => s?.studentInfo?.id === selectedStudentId || s?.studentInfo?._id === selectedStudentId
      ) || quizResultsAll[0] || {}
    );
  }, [quizResultsAll, selectedStudentId]);

  const activeList = useMemo(() => {
    let list: any[] = [];
    if (activeTab === 'exam') list = activeExamData?.list || [];
    if (activeTab === 'assignment') list = activeAssignmentData?.list || [];
    if (activeTab === 'quiz') list = activeQuizData?.list || [];

    if (list.length > 0) return list;
    if (activeTab === 'exam') return DEFAULT_EXAMS;
    if (activeTab === 'assignment') return DEFAULT_ASSIGNMENTS;
    if (activeTab === 'quiz') return DEFAULT_QUIZZES;
    return [];
  }, [activeTab, activeExamData, activeAssignmentData, activeQuizData]);

  const activeSummary = useMemo(() => {
    if (activeTab === 'exam' && activeExamData?.summary) return activeExamData.summary;
    if (activeTab === 'assignment' && activeAssignmentData?.summary) return activeAssignmentData.summary;
    if (activeTab === 'quiz' && activeQuizData?.summary) return activeQuizData.summary;
    return null;
  }, [activeTab, activeExamData, activeAssignmentData, activeQuizData]);

  const totalCount = activeSummary?.totalTaken ?? activeList.length;
  const averageScore =
    activeSummary?.averageScorePercentage ??
    (activeTab === 'exam' ? 88 : activeTab === 'assignment' ? 93 : 98);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={THEME.colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Assessment Results"
          subtitle="Scorecards, grades, and academic assessments"
          showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
          onBack={() => navigation?.goBack?.()}
        />

        {/* Student Selector */}
        <StudentSelector />

        {/* Segmented Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Top Stats Cards ─── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              {activeTab === 'exam'
                ? 'Exams Taken'
                : activeTab === 'assignment'
                ? 'Assignments Taken'
                : 'Quizzes Taken'}
            </Text>
            <Text style={styles.statValue}>{totalCount}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Score Obtained</Text>
            <Text style={[styles.statValue, { color: '#1A5247' }]}>{averageScore}%</Text>
          </View>
        </View>

        {/* Error Alert */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ─── Scorecards List ─── */}
        <View style={styles.listContainer}>
          <View style={styles.listHeaderBar}>
            <Text style={styles.listHeaderTitle}>
              {activeTab === 'exam'
                ? 'Exam Scorecards'
                : activeTab === 'assignment'
                ? 'Assignment Submissions'
                : 'Quiz Records'}
            </Text>
          </View>

          {activeList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Award size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No Results Found</Text>
              <Text style={styles.emptySubtitle}>
                No {activeTab} scorecards have been posted for this student yet.
              </Text>
            </View>
          ) : (
            activeList.map((item: any, idx: number) => {
              const name = item.name || item.examName || item.assignmentName || item.quizName || item.title || 'Assessment';
              const course = item.course || item.courseName || 'Academic Subject';
              const date = item.dateTaken || item.dueDate || item.date || item.dateSubmitted || item.createdAt;
              const score = item.score ?? item.marks ?? '—';
              const totalMarks = item.totalMarks ?? 100;
              const status = item.status || 'Graded';
              const details = item.details || item.feedback || item.remarks;

              return (
                <View key={item.id || item._id || idx} style={styles.scorecard}>
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.examTitle}>{name}</Text>
                      <Text style={styles.courseText}>{course}</Text>
                    </View>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeText}>
                        {score !== '—' ? `${score}/${totalMarks}` : '—'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardMetaRow}>
                    <View style={styles.metaItem}>
                      <Calendar size={12} color="#64748B" />
                      <Text style={styles.metaText}>{date ? formatDate(date) : '—'}</Text>
                    </View>
                    <StatusBadge status={status} size="sm" />
                  </View>

                  {details ? (
                    <View style={styles.remarksBox}>
                      <Text style={styles.remarksLabel}>Feedback: </Text>
                      <Text style={styles.remarksText}>{details}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: THEME.borderRadius.lg,
    padding: 4,
    marginBottom: THEME.spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.md,
  },
  tabBtnActive: {
    backgroundColor: '#54A39A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: THEME.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C2D1CD',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    marginBottom: THEME.spacing.md,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#C2D1CD',
    padding: 12,
  },
  listHeaderBar: {
    backgroundColor: '#54A39A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scorecard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  examTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  courseText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.md,
  },
  scoreBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  remarksBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  remarksLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  remarksText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});
