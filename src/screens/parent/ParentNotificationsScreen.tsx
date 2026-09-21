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
} from 'react-native';
import { Bell, Search, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchParentAllNotifications,
  clearParentAllNotifications,
} from '../../store/slices/parentSlice';
import { formatDate } from '../../shared/utils/dateHelpers';

export const ParentNotificationsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { allNotifications, notificationSummary, loading } = useAppSelector(
    (state) => state.parent
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchParentAllNotifications({ page, search: searchTerm }));
  }, [dispatch, page, searchTerm]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchParentAllNotifications({ page, search: searchTerm }));
    setRefreshing(false);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all your notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => dispatch(clearParentAllNotifications()),
        },
      ]
    );
  };

  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return allNotifications || [];
    const lower = searchTerm.toLowerCase();
    return (allNotifications || []).filter(
      (n: any) =>
        (n.matter || '').toLowerCase().includes(lower) ||
        (n.details || '').toLowerCase().includes(lower) ||
        (n.title || '').toLowerCase().includes(lower) ||
        (n.message || '').toLowerCase().includes(lower) ||
        (n.studentName || '').toLowerCase().includes(lower)
    );
  }, [allNotifications, searchTerm]);

  const totalPages = notificationSummary?.pages || 1;

  const renderItem = ({ item }: { item: any }) => {
    const matter = item.matter || item.title || 'Notification';
    const details = item.details || item.message || '';
    const date = item.createdAt || item.date || item.time;
    const studentName = item.studentName || item.studentInfo?.name;

    return (
      <View style={styles.notifCard}>
        <View style={styles.notifHeaderRow}>
          <View style={styles.matterBadge}>
            <Text style={styles.matterText}>{matter}</Text>
          </View>
          <Text style={styles.dateText}>{date ? formatDate(date) : '—'}</Text>
        </View>

        <Text style={styles.detailsText}>{details}</Text>

        {studentName ? (
          <Text style={styles.studentTag}>Student: {studentName}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <Header
        title="Notifications"
        subtitle="School broadcasts, academic alerts & notices"
        showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
        onBack={() => navigation?.goBack?.()}
        rightAction={
          filteredList.length > 0 ? (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn} activeOpacity={0.8}>
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notifications..."
          placeholderTextColor="#94A3B8"
          value={searchTerm}
          onChangeText={(txt) => {
            setSearchTerm(txt);
            setPage(1);
          }}
        />
        {searchTerm.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchTerm('')} style={{ padding: 4 }}>
            <X size={14} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item, idx) => item.id || item._id || String(idx)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Bell size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Notifications Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm
                ? 'No notifications matching your search query.'
                : 'You have no notices or announcements right now.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                disabled={page <= 1}
                onPress={() => setPage((p) => p - 1)}
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
              >
                <ChevronLeft size={16} color={page <= 1 ? '#CBD5E1' : '#1E293B'} />
                <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>
                  Prev
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageInfoText}>
                Page {page} of {totalPages}
              </Text>

              <TouchableOpacity
                disabled={page >= totalPages}
                onPress={() => setPage((p) => p + 1)}
                style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
              >
                <Text
                  style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}
                >
                  Next
                </Text>
                <ChevronRight size={16} color={page >= totalPages ? '#CBD5E1' : '#1E293B'} />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.xs,
  },
  clearBtn: {
    padding: 8,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#FEE2E2',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: THEME.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 40,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  matterBadge: {
    backgroundColor: '#DEE6E4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
  },
  matterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1A5247',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
  },
  detailsText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 2,
  },
  studentTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#54A39A',
    marginTop: 6,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 36,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  pageBtnTextDisabled: {
    color: '#CBD5E1',
  },
  pageInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});
