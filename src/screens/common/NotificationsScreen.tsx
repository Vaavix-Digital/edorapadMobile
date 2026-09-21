import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Bell,
  CheckCircle,
  RefreshCw,
  Search,
  X,
  Clock,
  CheckCheck,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchNotifications,
  readNotification,
  markAllNotificationsAsRead,
} from '../../store/slices/instituteSlice';
import { AppNotification } from '../../shared/types';

const formatNotificationDate = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(date);
  } catch {
    return dateString;
  }
};

export const NotificationsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, loading } = useAppSelector(
    (state) => state.institute
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    await dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMarkRead = async (id: string) => {
    if (!id) return;
    await dispatch(readNotification(id));
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    await dispatch(markAllNotificationsAsRead());
  };

  // Filtered notifications by search and read/unread status
  const filteredNotifications = useMemo(() => {
    let result = notifications || [];

    if (filter === 'read') {
      result = result.filter((n) => n.isRead);
    } else if (filter === 'unread') {
      result = result.filter((n) => !n.isRead);
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((n) => {
        const msg = (n.message || '').toLowerCase();
        const type = (n.type || '').toLowerCase();
        const title = (n.title || '').toLowerCase();
        return msg.includes(lower) || type.includes(lower) || title.includes(lower);
      });
    }

    return result;
  }, [notifications, filter, searchTerm]);

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const notifId = item.id || item._id || '';
    const isUnread = !item.isRead;
    const typeLabel = (item.type || 'NOTICE').toUpperCase();

    return (
      <View style={[styles.notifCard, isUnread ? styles.notifCardUnread : styles.notifCardRead]}>
        {/* Top Meta: Status Dot & Timestamp */}
        <View style={styles.notifTopMeta}>
          <View style={styles.timestampWrap}>
            <View
              style={[
                styles.statusDot,
                isUnread ? styles.statusDotUnread : styles.statusDotRead,
              ]}
            />
            <Text style={styles.timestampText}>
              {formatNotificationDate(item.createdAt)}
            </Text>
          </View>

          {/* Action Button (Top Right / Compact) */}
          {isUnread ? (
            <TouchableOpacity
              style={styles.markReadBtn}
              onPress={() => handleMarkRead(notifId)}
              activeOpacity={0.8}
            >
              <Text style={styles.markReadBtnText}>Mark as Read</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.readBadge}>
              <CheckCircle size={12} color="#94A3B8" style={{ marginRight: 3 }} />
              <Text style={styles.readBadgeText}>Read</Text>
            </View>
          )}
        </View>

        {/* Category & Message */}
        <View style={styles.messageBlock}>
          <Text style={[styles.categoryText, !isUnread && { color: '#94A3B8' }]}>
            {typeLabel}
          </Text>
          <Text
            style={[
              styles.messageText,
              isUnread ? styles.messageTextUnread : styles.messageTextRead,
            ]}
          >
            {item.message}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <Header
        title="Notifications"
        subtitle={`You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
        showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
        onBack={() => navigation?.goBack?.()}
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {unreadCount > 0 ? (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                style={styles.markAllHeaderBtn}
                activeOpacity={0.8}
              >
                <CheckCheck size={14} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.markAllHeaderText}>Mark all read</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={loadData} style={styles.refreshHeaderBtn}>
              <RefreshCw size={16} color="#1E293B" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* ─── Search & Filter Controls ─── */}
      <View style={styles.controlsBar}>
        {/* Search Bar */}
        <View style={styles.searchInputWrap}>
          <Search size={15} color="#94A3B8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by keyword..."
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={{ padding: 4 }}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Segmented Buttons */}
        <View style={styles.filterTabsWrap}>
          {(['all', 'unread', 'read'] as const).map((opt) => {
            const isActive = filter === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setFilter(opt)}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isActive && styles.filterTabTextActive,
                  ]}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  {opt === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── Notifications List ─── */}
      {loading && !refreshing && (!notifications || notifications.length === 0) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Synchronizing notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item, idx) => item.id || item._id || String(idx)}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Bell size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Notifications to Display</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm
                  ? 'No notifications match your search query.'
                  : 'You are all caught up! Check back later for updates.'}
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  refreshHeaderBtn: {
    padding: 8,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  markAllHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: THEME.borderRadius.md,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  markAllHeaderText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  controlsBar: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    paddingVertical: 0,
  },
  filterTabsWrap: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: THEME.borderRadius.md,
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 40,
  },
  notifCard: {
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  notifCardUnread: {
    borderLeftWidth: 3.5,
    borderLeftColor: '#0F766E',
  },
  notifCardRead: {
    opacity: 0.85,
    backgroundColor: '#FAFAFA',
  },
  notifTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timestampWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusDotUnread: {
    backgroundColor: '#0F766E',
  },
  statusDotRead: {
    backgroundColor: '#CBD5E1',
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  markReadBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  markReadBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  readBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  messageBlock: {
    marginTop: 2,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextUnread: {
    fontWeight: '800',
    color: '#0F172A',
  },
  messageTextRead: {
    fontWeight: '500',
    color: '#64748B',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: THEME.borderRadius.xl,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 18,
  },
});
