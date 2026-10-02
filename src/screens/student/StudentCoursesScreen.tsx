import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BookOpen, Search, Star, Clock } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchStudentCourses } from '../../store/slices/studentSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - THEME.spacing.md * 2 - 10) / 2;

// ─── Category helpers ───────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Development:       { bg: '#3B82F6', text: '#1D4ED8' },
  'Computer Science':{ bg: '#8B5CF6', text: '#6D28D9' },
  Cloud:             { bg: '#06B6D4', text: '#0E7490' },
  Design:            { bg: '#EC4899', text: '#BE185D' },
  'AI / ML':         { bg: '#F59E0B', text: '#B45309' },
  Marketing:         { bg: '#EF4444', text: '#B91C1C' },
  Finance:           { bg: '#10B981', text: '#065F46' },
  Management:        { bg: '#6366F1', text: '#4338CA' },
};

const getCatColor = (cat?: string) =>
  CATEGORY_COLORS[cat || ''] || { bg: THEME.colors.primary, text: THEME.colors.primaryDark };

// ─── Gradient thumbnail placeholder ─────────────────────────────────────
const CourseThumbnail = ({
  uri,
  category,
  title,
}: {
  uri?: string;
  category?: string;
  title: string;
}) => {
  const { bg } = getCatColor(category);
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
    );
  }

  // Colorful fallback block with initials
  return (
    <View style={[styles.thumbnail, styles.thumbnailFallback, { backgroundColor: bg }]}>
      <Text style={styles.thumbnailInitials}>{initials}</Text>
      <BookOpen size={22} color="rgba(255,255,255,0.6)" style={{ marginTop: 4 }} />
    </View>
  );
};

// ─── Filter chips ────────────────────────────────────────────────────────
const FILTERS = ['All', 'Ongoing', 'Completed', 'Pending'];

// ─── Course Card ─────────────────────────────────────────────────────────
const CourseCard = ({ item }: { item: any }) => {
  const progress = item.progress ?? 0;
  const completedModules = item.completedModules ?? 0;
  const totalModules = item.totalModules ?? 0;
  const { bg, text } = getCatColor(item.category);

  return (
    <View style={styles.card}>
      {/* Thumbnail */}
      <CourseThumbnail
        uri={item.thumbnailUrl}
        category={item.category}
        title={item.title}
      />

      {/* Category badge */}
      <View style={[styles.catBadge, { backgroundColor: bg + '22' }]}>
        <View style={[styles.catDot, { backgroundColor: bg }]} />
        <Text style={[styles.catText, { color: text }]} numberOfLines={1}>
          {item.category || 'General'}
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.courseTitle} numberOfLines={2}>
        {item.title}
      </Text>

      {/* Institute */}
      {item.instituteName ? (
        <Text style={styles.instituteName} numberOfLines={1}>
          🏫 {item.instituteName}
        </Text>
      ) : null}

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(Math.max(progress, 0), 100)}%` as any,
              backgroundColor: bg,
            },
          ]}
        />
      </View>

      {/* Progress row */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {totalModules > 0
            ? `${completedModules}/${totalModules} modules`
            : 'In Progress'}
        </Text>
        <Text style={[styles.progressPct, { color: text }]}>
          {progress > 0 ? `${progress}%` : '—'}
        </Text>
      </View>

      {/* Payment pending banner */}
      {item.paymentStatus === 'pending' && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>⚠ Payment Pending</Text>
        </View>
      )}

      {/* Continue button */}
      <TouchableOpacity
        style={[styles.continueBtn, { backgroundColor: bg }]}
        activeOpacity={0.85}
      >
        <Text style={styles.continueBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────
export const StudentCoursesScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { enrolledCourses, loading } = useAppSelector((s) => s.student);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    dispatch(fetchStudentCourses());
  }, [dispatch]);

  const filtered = enrolledCourses.filter((c: any) => {
    const matchSearch =
      !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.instructorName?.toLowerCase().includes(search.toLowerCase()) ||
      c.instituteName?.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;

    if (activeFilter === 'All') return true;
    if (activeFilter === 'Completed') return (c.progress ?? 0) >= 100;
    if (activeFilter === 'Ongoing')
      return (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100;
    if (activeFilter === 'Pending')
      return c.paymentStatus === 'pending' || (c.progress ?? 0) === 0;
    return true;
  });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.headerWrap}>
        <Header
          title="My Courses"
          subtitle={`${enrolledCourses.length} enrolled`}
          showBack
          onBack={() => navigation.goBack()}
        />

        {/* Search */}
        <View style={styles.searchRow}>
          <Search size={16} color={THEME.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses, instructors..."
            placeholderTextColor={THEME.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === f && styles.filterChipTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 2-Column Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => item.id || String(idx)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchStudentCourses())}
            tintColor={THEME.colors.primary}
          />
        }
        renderItem={({ item }) => <CourseCard item={item} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <BookOpen size={40} color={THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No courses found</Text>
            <Text style={styles.emptySubtext}>
              {search ? 'Try a different search term' : 'You have no enrolled courses yet'}
            </Text>
          </View>
        }
      />
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
    backgroundColor: THEME.colors.background,
  },

  // ── Search ──
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    marginBottom: THEME.spacing.sm,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },

  // ── Filter chips ──
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: THEME.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },

  // ── Grid ──
  listContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: 40,
    paddingTop: THEME.spacing.sm,
  },
  columnWrapper: {
    gap: 10,
    marginBottom: 10,
  },

  // ── Card ──
  card: {
    width: CARD_WIDTH,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },

  // ── Thumbnail ──
  thumbnail: {
    width: '100%',
    height: 100,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailInitials: {
    fontSize: 28,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
  },

  // ── Card body ──
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 5,
    alignSelf: 'flex-start',
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 18,
    marginHorizontal: 10,
    marginBottom: 4,
  },
  instituteName: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    marginHorizontal: 10,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
    borderRadius: 2,
    marginBottom: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    flex: 1,
  },
  progressPct: {
    fontSize: 11,
    fontWeight: '800',
  },
  pendingBadge: {
    marginHorizontal: 10,
    marginBottom: 6,
    backgroundColor: THEME.colors.warningLight,
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  pendingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  continueBtn: {
    margin: 10,
    marginTop: 2,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Empty ──
  emptyWrap: {
    alignItems: 'center',
    marginTop: 60,
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
});
