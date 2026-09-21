import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Send,
  Users,
  MessageSquare,
  Search,
  Paperclip,
  Smile,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  sendCommunityMessage,
  setSelectedCommunity,
  fetchStudentCommunities,
  fetchCommunityMessages,
} from '../../store/slices/studentSlice';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDEBAR_W = SCREEN_W * 0.78;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?';

const AVATAR_COLORS = [
  '#3E7B74', '#3B82F6', '#8B5CF6', '#EC4899',
  '#F59E0B', '#10B981', '#EF4444', '#06B6D4',
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const formatMsgTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

const formatDateLabel = (iso: string) => {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

const groupMessagesByDate = (messages: any[]) => {
  const result: any[] = [];
  let lastDate = '';
  messages.forEach((msg) => {
    const label = formatDateLabel(msg.createdAt);
    if (label && label !== lastDate) {
      lastDate = label;
      result.push({ type: 'date', label, id: `date-${msg.id}-${msg.createdAt}` });
    }
    result.push({ type: 'message', ...msg });
  });
  return result;
};

// ─── Avatar Component ──────────────────────────────────────────────────────────

const Avatar = ({ name, size = 32 }: { name: string; size?: number }) => (
  <View
    style={[
      styles.avatar,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: getAvatarColor(name),
      },
    ]}
  >
    <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>
      {getInitials(name)}
    </Text>
  </View>
);

// ─── Channel Sidebar ───────────────────────────────────────────────────────────

const ChannelSidebar = ({
  visible,
  communities,
  selectedId,
  loading,
  onSelect,
  onClose,
}: {
  visible: boolean;
  communities: any[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (c: any) => void;
  onClose: () => void;
}) => {
  const [search, setSearch] = useState('');
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_W)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -SIDEBAR_W,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const filtered = communities.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity style={styles.sidebarBackdrop} activeOpacity={1} onPress={onClose} />

      {/* Slide panel */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        {/* Sidebar header */}
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Communities</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={20} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.sidebarSearch}>
          <Search size={14} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.sidebarSearchInput}
            placeholder="Search community..."
            placeholderTextColor={THEME.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            color={THEME.colors.primary}
            style={{ marginTop: 24 }}
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.map((c) => {
              const isSelected = c.id === selectedId;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.channelRow, isSelected && styles.channelRowActive]}
                  onPress={() => {
                    onSelect(c);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Avatar name={c.name} size={38} />
                  <View style={styles.channelInfo}>
                    <Text
                      style={[styles.channelName, isSelected && styles.channelNameActive]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                    <Text style={styles.channelMeta} numberOfLines={1}>
                      {c.membersCount ?? 0} members
                    </Text>
                  </View>
                  {(c.unreadCount > 0) && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{c.unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
};

// ─── Message Bubble ────────────────────────────────────────────────────────────

const MessageBubble = React.memo(({ msg, isMine }: { msg: any; isMine: boolean }) => {
  const senderName = msg.senderName || msg.sender?.name || 'User';
  const role = msg.senderRole || msg.sender?.role;
  const timeStr = formatMsgTime(msg.createdAt);
  // Show file placeholder when there is no text content
  const displayContent = msg.content || (msg.fileUrl ? '📎 Attachment' : null);

  // Skip rendering entirely if nothing to show
  if (!displayContent) return null;

  return (
    <View style={[styles.msgRow, isMine && styles.msgRowReverse]}>
      {/* Avatar — only for others */}
      {!isMine && <Avatar name={senderName} size={32} />}

      <View style={[styles.msgBody, isMine && styles.msgBodyReverse]}>
        {/* Sender name + role — only for others */}
        {!isMine && (
          <View style={styles.senderRow}>
            <Text style={styles.senderName}>{senderName}</Text>
            {role && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{role}</Text>
              </View>
            )}
          </View>
        )}

        {/* Bubble */}
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.bubbleText, isMine ? styles.myBubbleText : styles.otherBubbleText]}>
            {displayContent}
          </Text>
          <Text style={[styles.msgTime, isMine ? styles.myMsgTime : styles.otherMsgTime]}>
            {timeStr}
          </Text>
        </View>
      </View>
    </View>
  );
});

// ─── Date Separator ────────────────────────────────────────────────────────────

const DateSeparator = ({ label }: { label: string }) => (
  <View style={styles.dateSepRow}>
    <View style={styles.dateSepLine} />
    <Text style={styles.dateSepText}>{label}</Text>
    <View style={styles.dateSepLine} />
  </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────

export const StudentCommunityScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { communities, selectedCommunityId, loading } = useAppSelector((s) => s.student);
  const { user } = useAppSelector((s) => s.auth);

  const [inputText, setInputText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const currentCommunity =
    communities.find((c: any) => c.id === selectedCommunityId) || communities[0];

  // Fetch communities on mount
  useEffect(() => {
    dispatch(fetchStudentCommunities() as any);
  }, [dispatch]);

  // Fetch messages when channel changes
  useEffect(() => {
    if (currentCommunity?.id) {
      dispatch(fetchCommunityMessages(currentCommunity.id) as any);
    }
  }, [currentCommunity?.id, dispatch]);

  // Scroll to bottom when messages change
  const messages = currentCommunity?.messages || [];
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !currentCommunity) return;
    dispatch(
      sendCommunityMessage({
        communityId: currentCommunity.id,
        content: inputText.trim(),
      })
    );
    setInputText('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
  }, [inputText, currentCommunity, dispatch]);

  const handleSelectCommunity = useCallback(
    (c: any) => dispatch(setSelectedCommunity(c.id)),
    [dispatch]
  );

  const grouped = groupMessagesByDate(messages);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'date') return <DateSeparator label={item.label} />;
    const isMine = item.isMe || item.senderId === user?.id;
    return <MessageBubble msg={item} isMine={isMine} />;
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      {/* Header */}
      <View style={styles.headerWrap}>
        <Header
          title="Community"
          subtitle={currentCommunity?.name || 'Discussions'}
          showBack
          onBack={() => navigation.goBack()}
          showMenu
          onMenuPress={() => setSidebarOpen(true)}
        />
      </View>

      {/* Channel chips row */}
      <View style={styles.chipRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={communities}
          keyExtractor={(c: any) => c.id}
          contentContainerStyle={styles.chipList}
          renderItem={({ item }: { item: any }) => {
            const isSelected = item.id === currentCommunity?.id;
            return (
              <TouchableOpacity
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => handleSelectCommunity(item)}
                activeOpacity={0.8}
              >
                <Users size={12} color={isSelected ? '#FFF' : THEME.colors.textSecondary} />
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Info bar */}
      {currentCommunity && (
        <View style={styles.infoBar}>
          <Text style={styles.infoDesc} numberOfLines={1}>
            {currentCommunity.description || 'Group discussion'}
          </Text>
          <View style={styles.infoMembersRow}>
            <Users size={11} color={THEME.colors.textMuted} />
            <Text style={styles.infoMembersText}>
              {currentCommunity.membersCount ?? 0}
            </Text>
          </View>
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={grouped}
          keyExtractor={(item: any) =>
            item.id
            || item._id
            || `${item.type || 'msg'}-${item.createdAt || ''}-${item.content?.slice(0, 6) || ''}`
          }
          contentContainerStyle={styles.msgList}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MessageSquare size={38} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation! Say hello 👋</Text>
            </View>
          }
        />
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Paperclip size={18} color={THEME.colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Smile size={18} color={THEME.colors.textSecondary} />
        </TouchableOpacity>
        <TextInput
          style={styles.inputField}
          placeholder={`Message #${currentCommunity?.name || 'community'}...`}
          placeholderTextColor={THEME.colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Send size={16} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Channel sidebar */}
      <ChannelSidebar
        visible={sidebarOpen}
        communities={communities}
        selectedId={currentCommunity?.id}
        loading={loading}
        onSelect={handleSelectCommunity}
        onClose={() => setSidebarOpen(false)}
      />
    </KeyboardAvoidingView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  headerWrap: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },

  // ── Chips ──
  chipRow: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  chipList: {
    paddingHorizontal: THEME.spacing.md,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    maxWidth: 130,
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: THEME.colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },

  // ── Info bar ──
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 7,
    backgroundColor: THEME.colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: '#D1E8E5',
  },
  infoDesc: {
    fontSize: 11,
    color: THEME.colors.primaryDark,
    flex: 1,
    marginRight: 8,
  },
  infoMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  infoMembersText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },

  // ── Messages ──
  msgList: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    paddingBottom: 12,
    flexGrow: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },

  // ── Message row ──
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  msgRowReverse: {
    flexDirection: 'row-reverse',
  },
  msgBody: {
    flex: 1,
    alignItems: 'flex-start',
    maxWidth: '82%',
  },
  msgBodyReverse: {
    alignItems: 'flex-end',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
    marginLeft: 2,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  roleBadge: {
    backgroundColor: THEME.colors.primaryLight,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.primaryDark,
    textTransform: 'uppercase',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 14,
  },
  myBubble: {
    backgroundColor: THEME.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  myBubbleText: {
    color: '#FFF',
  },
  otherBubbleText: {
    color: THEME.colors.textPrimary,
  },
  msgTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMsgTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMsgTime: {
    color: THEME.colors.textMuted,
  },

  // ── Avatar ──
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '800',
  },

  // ── Date separator ──
  dateSepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  dateSepLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.borderLight,
  },
  dateSepText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    paddingHorizontal: 6,
  },

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    gap: 6,
  },
  iconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  inputField: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    maxHeight: 100,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  sendBtnDisabled: {
    backgroundColor: THEME.colors.textMuted,
    opacity: 0.4,
  },

  // ── Sidebar ──
  sidebarBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_W,
    backgroundColor: THEME.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  sidebarSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sidebarSearchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    marginHorizontal: 8,
    marginBottom: 2,
  },
  channelRowActive: {
    backgroundColor: THEME.colors.primaryLight,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  channelNameActive: {
    color: THEME.colors.primaryDark,
    fontWeight: '700',
  },
  channelMeta: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
});
