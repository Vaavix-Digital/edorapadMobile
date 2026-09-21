import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Users, BookOpen, Clock, Calendar, ChevronRight } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTutorBatches } from '../../store/slices/tutorSlice';

export const TutorBatchesScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { batches, loading } = useAppSelector((state) => state.tutor);

  useEffect(() => {
    dispatch(fetchTutorBatches());
  }, [dispatch]);

  return (
    <View style={styles.root}>
      <Header
        title="My Batches"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchTutorBatches())}
            tintColor="#3E7B74"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && (!batches || batches.length === 0) ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#3E7B74" />
          </View>
        ) : batches && batches.length > 0 ? (
          batches.map((batch: any, idx: number) => {
            const studentCount =
              batch.studentCount ??
              (Array.isArray(batch.students) ? batch.students.length : 0);

            return (
              <View key={batch.id || batch._id || idx} style={styles.batchCard}>
                <View style={styles.cardTop}>
                  <View style={styles.iconCircle}>
                    <BookOpen size={20} color="#3E7B74" />
                  </View>
                  <View style={styles.titleCol}>
                    <Text style={styles.batchName}>{batch.name}</Text>
                    <Text style={styles.courseName}>
                      {batch.course?.title || batch.courseName || 'General Course'}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {batch.status || 'Active'}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Users size={15} color="#64748B" />
                    <Text style={styles.metaText}>
                      {studentCount} Students
                    </Text>
                  </View>

                  {batch.timing || batch.schedule ? (
                    <View style={styles.metaItem}>
                      <Clock size={15} color="#64748B" />
                      <Text style={styles.metaText}>
                        {batch.timing || batch.schedule}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    navigation.navigate('AttendanceMarking', {
                      batchId: batch.id || batch._id,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>Mark Attendance</Text>
                  <ChevronRight size={16} color="#3E7B74" />
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Users size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Batches Assigned</Text>
            <Text style={styles.emptySub}>
              You currently do not have any teaching batches assigned.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FBFA',
    paddingHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 40,
    gap: 12,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  batchCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  batchName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  courseName: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3E7B74',
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3E7B74',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
