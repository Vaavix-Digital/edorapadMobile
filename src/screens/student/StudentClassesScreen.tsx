import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Video, Play, Clock, BookOpen, Layers } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchStudentFullDashboard } from '../../store/slices/studentSlice';
import { formatTime, formatDate } from '../../shared/utils/dateHelpers';
import { LiveClass } from '../../shared/types';

export const StudentClassesScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { classes, loading } = useAppSelector((state) => state.student);
  const [tab, setTab] = useState<'live' | 'recorded'>('live');

  useEffect(() => {
    dispatch(fetchStudentFullDashboard());
  }, [dispatch]);

  const handleJoinLive = (item: LiveClass) => {
    Alert.alert(
      'Join Classroom',
      `Connecting to live classroom for: ${item.title}\nInstructor: ${item.tutorName || 'Faculty'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join Meeting', style: 'default' },
      ]
    );
  };

  const renderItem = ({ item }: { item: LiveClass }) => {
    const isLive = item.status === 'live';

    return (
      <Card style={[styles.classCard, isLive && styles.liveClassBorder]}>
        <View style={styles.cardHeader}>
          <Text style={styles.batchTag}>{item.batchName || 'Core Batch'}</Text>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <Text style={styles.classTitle}>{item.title}</Text>
        <Text style={styles.tutorName}>Taught by: {item.tutorName || 'Faculty Tutor'}</Text>

        <View style={styles.metaRow}>
          <Clock size={14} color={THEME.colors.textSecondary} />
          <Text style={styles.metaText}>
            {formatDate(item.scheduledStartTime)} • {formatTime(item.scheduledStartTime)} - {formatTime(item.scheduledEndTime)}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Button
            title={isLive ? 'Join Live Now' : 'Class Details'}
            onPress={() => handleJoinLive(item)}
            variant={isLive ? 'danger' : 'primary'}
            size="sm"
            icon={isLive ? <Play size={14} color="#FFF" /> : <Video size={14} color="#FFF" />}
          />
        </View>
      </Card>
    );
  };

  return (
    <ScreenContainer>
      <Header
        title="My Classes"
        subtitle="Live lectures and interactive learning"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setTab('live')}
          style={[styles.tabItem, tab === 'live' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, tab === 'live' && styles.tabTextActive]}>
            Live & Scheduled ({classes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('recorded')}
          style={[styles.tabItem, tab === 'recorded' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, tab === 'recorded' && styles.tabTextActive]}>
            Recorded Lectures
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item, index) => item.id || item._id || String(index)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={() => dispatch(fetchStudentFullDashboard())}
        ListEmptyComponent={
          <EmptyState
            title="No Classes Available"
            description="You do not have any scheduled live classes at this time."
          />
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.borderRadius.md,
    padding: 4,
    marginBottom: THEME.spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.sm,
  },
  tabItemActive: {
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  tabTextActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: THEME.spacing.xl,
  },
  classCard: {
    padding: 14,
    marginBottom: 10,
  },
  liveClassBorder: {
    borderColor: THEME.colors.error,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  batchTag: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.sm,
  },
  classTitle: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 2,
  },
  tutorName: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
    paddingTop: 10,
  },
});
