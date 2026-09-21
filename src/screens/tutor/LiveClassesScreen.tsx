import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Video, Clock, Users, Play, Plus } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTutorDashboardData } from '../../store/slices/tutorSlice';
import { formatTime, formatDate } from '../../shared/utils/dateHelpers';
import { LiveClass } from '../../shared/types';

export const LiveClassesScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { liveClasses, loading } = useAppSelector((state) => state.tutor);

  useEffect(() => {
    dispatch(fetchTutorDashboardData());
  }, [dispatch]);

  const handleJoinClass = (item: LiveClass) => {
    Alert.alert(
      'Live Classroom',
      `Launching session: ${item.title}\nRoom link will open in native meeting room.`,
      [{ text: 'Join Now', style: 'default' }, { text: 'Cancel', style: 'cancel' }]
    );
  };

  const renderItem = ({ item }: { item: LiveClass }) => {
    const isLive = item.status === 'live';

    return (
      <Card style={[styles.classCard, isLive && styles.liveClassCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.batchTag}>
            <Text style={styles.batchTagText}>{item.batchName || 'General Batch'}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <Text style={styles.classTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={14} color={THEME.colors.textSecondary} />
            <Text style={styles.metaText}>
              {formatDate(item.scheduledStartTime)} • {formatTime(item.scheduledStartTime)}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Button
            title={isLive ? 'Join Live Room' : 'Start Scheduled Class'}
            onPress={() => handleJoinClass(item)}
            variant={isLive ? 'danger' : 'primary'}
            size="sm"
            icon={<Play size={14} color="#FFF" />}
          />
        </View>
      </Card>
    );
  };

  return (
    <ScreenContainer>
      <Header
        title="Live Classes"
        subtitle="Manage live sessions and online classrooms"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('ScheduleClass')}
            style={styles.addBtn}
          >
            <Plus size={18} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={liveClasses}
        keyExtractor={(item, index) => item.id || item._id || String(index)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={() => dispatch(fetchTutorDashboardData())}
        ListEmptyComponent={
          <EmptyState
            title="No Classes Scheduled"
            description="You don't have any scheduled or live class sessions right now."
            actionTitle="Schedule New Class"
            onAction={() => navigation.navigate('ScheduleClass')}
          />
        }
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: THEME.spacing.xl,
  },
  classCard: {
    padding: 14,
    marginBottom: 10,
  },
  liveClassCard: {
    borderColor: THEME.colors.error,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchTag: {
    backgroundColor: THEME.colors.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.sm,
  },
  batchTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  classTitle: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderLight,
    paddingTop: 10,
  },
});
