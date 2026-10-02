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
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Send,
  Users,
  MessageSquare,
  Search,
  Paperclip,
  Smile,
  X,
  Plus,
  Settings,
  Image as ImageIcon,
  Check,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import {
  fetchCommunities,
  fetchMessages,
  sendMessage,
  createCommunity,
  deleteCommunity,
  Community,
  CommunityMessage,
} from '../../store/slices/communitySlice';
import { instituteApi } from '../../shared/api/instituteApi';
import { InstituteDrawerMenu } from '../../components/navigation/InstituteDrawerMenu';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDEBAR_W = SCREEN_W * 0.8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const PRESET_LOGOS = ['📚', '💻', '🔬', '📐', '🎨', '🚀', '💡', '🌐', '🎓', '🏆'];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < (name?.length || 0); i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const formatMsgTime = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

const formatDateLabel = (iso?: string) => {
  if (!iso) return '';
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

const groupMessagesByDate = (messages: CommunityMessage[]) => {
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

const getSenderName = (msg: CommunityMessage) => {
  const s = msg.sender || msg.user;
  if (!s) return 'User';
  return s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'User';
};

const getMsgContent = (msg: CommunityMessage) => msg.content || msg.text || '';

// ─── Avatar Component ─────────────────────────────────────────────────────────

const Avatar = ({ name, icon, size = 32 }: { name: string; icon?: string; size?: number }) => (
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
    {icon ? (
      <Text style={{ fontSize: size * 0.45 }}>{icon}</Text>
    ) : (
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>
        {getInitials(name)}
      </Text>
    )}
  </View>
);

// ─── Channel Sidebar ──────────────────────────────────────────────────────────

const ChannelSidebar = ({
  visible,
  communities,
  selectedId,
  loading,
  onSelect,
  onOpenCreate,
  onClose,
}: {
  visible: boolean;
  communities: Community[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (c: Community) => void;
  onOpenCreate: () => void;
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sidebarBackdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Communities</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={20} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* New Group Button inside sidebar */}
        <TouchableOpacity
          style={styles.sidebarNewGroupBtn}
          onPress={() => {
            onClose();
            onOpenCreate();
          }}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFF" />
          <Text style={styles.sidebarNewGroupBtnText}>New Community</Text>
        </TouchableOpacity>

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
          <ActivityIndicator color={THEME.colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {filtered.map((c) => {
              const isSelected = c.id === selectedId;
              const memberCount = c.memberCount || c.members?.length || 0;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.channelRow, isSelected && styles.channelRowActive]}
                  onPress={() => { onSelect(c); onClose(); }}
                  activeOpacity={0.8}
                >
                  <Avatar name={c.name} icon={c.icon} size={38} />
                  <View style={styles.channelInfo}>
                    <Text
                      style={[styles.channelName, isSelected && styles.channelNameActive]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                    <Text style={styles.channelMeta} numberOfLines={1}>
                      {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = React.memo(({ msg, isMine }: { msg: CommunityMessage; isMine: boolean }) => {
  const senderName = getSenderName(msg);
  const timeStr = formatMsgTime(msg.createdAt);
  const content = getMsgContent(msg);
  const displayContent = content || (msg.mediaUrl ? '📎 Attachment' : null);

  if (!displayContent) return null;

  return (
    <View style={[styles.msgRow, isMine && styles.msgRowReverse]}>
      {!isMine && <Avatar name={senderName} size={32} />}
      <View style={[styles.msgBody, isMine && styles.msgBodyReverse]}>
        {!isMine && (
          <View style={styles.senderRow}>
            <Text style={styles.senderName}>{senderName}</Text>
          </View>
        )}
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

// ─── Date Separator ───────────────────────────────────────────────────────────

const DateSeparator = ({ label }: { label: string }) => (
  <View style={styles.dateSepRow}>
    <View style={styles.dateSepLine} />
    <Text style={styles.dateSepText}>{label}</Text>
    <View style={styles.dateSepLine} />
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const InstituteCommunityScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { communities, messages, loading, sending, creating } = useSelector(
    (state: RootState) => state.community
  );
  const currentUser = useSelector((state: RootState) => state.auth?.user);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const flatRef = useRef<FlatList>(null);

  // ─── New Community Modal States ─────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedLogo, setSelectedLogo] = useState(PRESET_LOGOS[0]);
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [batchSearch, setBatchSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [loadingMembersData, setLoadingMembersData] = useState(false);

  const currentCommunity =
    communities.find((c) => c.id === selectedId) || communities[0] || null;

  useEffect(() => {
    dispatch(fetchCommunities());
  }, [dispatch]);

  // Load batches and staff for creation modal
  const loadBatchesAndStaff = async () => {
    setLoadingMembersData(true);
    try {
      const [bRes, sRes] = await Promise.all([
        instituteApi.getAllBatches().catch(() => ({ data: [] })),
        instituteApi.getAllStaff().catch(() => ({ data: [] })),
      ]);
      setBatchesList(bRes?.data || []);
      setStaffList(sRes?.data || []);
    } catch {
      // fallback
    } finally {
      setLoadingMembersData(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    loadBatchesAndStaff();
  };

  // Set first community as selected when loaded
  useEffect(() => {
    if (communities.length > 0 && !selectedId) {
      setSelectedId(communities[0].id);
    }
  }, [communities]);

  // Fetch messages when community changes
  useEffect(() => {
    if (currentCommunity?.id) {
      dispatch(fetchMessages(currentCommunity.id));
    }
  }, [currentCommunity?.id, dispatch]);

  const activeMessages: CommunityMessage[] = currentCommunity
    ? messages[currentCommunity.id] || []
    : [];

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeMessages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [activeMessages.length]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !currentCommunity) return;
    const text = inputText.trim();
    setInputText('');
    try {
      await dispatch(sendMessage({ communityId: currentCommunity.id, content: text })).unwrap();
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to send message');
    }
  }, [inputText, currentCommunity, dispatch]);

  const handleSelectCommunity = useCallback((c: Community) => {
    setSelectedId(c.id);
  }, []);

  const handleCreateNewGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Validation Error', 'Please enter a community name');
      return;
    }

    try {
      const payload: any = {
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        icon: selectedLogo,
        studentIds: selectedBatches,
        staffIds: selectedStaff,
      };

      const result = await dispatch(createCommunity(payload)).unwrap();
      Alert.alert('Success', 'Community group created successfully!');
      setIsCreateModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setSelectedBatches([]);
      setSelectedStaff([]);

      if (result?.id) {
        setSelectedId(result.id);
      }
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to create community');
    }
  };

  const handleDeleteCurrentGroup = () => {
    if (!currentCommunity) return;
    Alert.alert(
      'Delete Community',
      `Are you sure you want to delete "${currentCommunity.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteCommunity(currentCommunity.id)).unwrap();
              setShowSettingsModal(false);
              setSelectedId(null);
              Alert.alert('Deleted', 'Community removed');
            } catch (err: any) {
              Alert.alert('Error', err || 'Failed to delete community');
            }
          },
        },
      ]
    );
  };

  const toggleBatchSelection = (id: string) => {
    setSelectedBatches((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleStaffSelection = (id: string) => {
    setSelectedStaff((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredBatches = batchesList.filter((b) =>
    (b.name || b.batchName || '').toLowerCase().includes(batchSearch.toLowerCase())
  );

  const filteredStaff = staffList.filter((s) => {
    const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
    return sName.toLowerCase().includes(staffSearch.toLowerCase());
  });

  const grouped = groupMessagesByDate(activeMessages);

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'date') return <DateSeparator label={item.label} />;
    const senderId = item.sender?.id || item.user?.id || item.senderId;
    const isMine = !!(currentUser?.id && senderId === currentUser.id);
    return <MessageBubble msg={item} isMine={isMine} />;
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
          rightAction={
            <TouchableOpacity
              style={styles.newGroupHeaderBtn}
              onPress={handleOpenCreateModal}
              activeOpacity={0.85}
            >
              <Plus size={15} color="#FFF" />
              <Text style={styles.newGroupHeaderBtnText}>New Group</Text>
            </TouchableOpacity>
          }
        />
      </View>

      {/* Channel chips row — horizontal scrollable pills with "+ New" button */}
      <View style={styles.chipRow}>
        <TouchableOpacity
          style={styles.addChipBtn}
          onPress={handleOpenCreateModal}
          activeOpacity={0.8}
        >
          <Plus size={14} color="#3E7B74" />
          <Text style={styles.addChipBtnText}>New</Text>
        </TouchableOpacity>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={communities}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.chipList}
          renderItem={({ item }) => {
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
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Info bar */}
      {currentCommunity && (
        <View style={styles.infoBar}>
          <Text style={styles.infoDesc} numberOfLines={1}>
            {currentCommunity.description || `Group for discussing ${currentCommunity.name}`}
          </Text>
          <View style={styles.infoMembersRow}>
            <Users size={11} color={THEME.colors.textMuted} />
            <Text style={styles.infoMembersText}>
              {currentCommunity.memberCount || currentCommunity.members?.length || 0} members
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
            item.id || item._id || `${item.type}-${item.createdAt || ''}-${item.content?.slice(0, 6) || ''}`
          }
          contentContainerStyle={styles.msgList}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MessageSquare size={44} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation! Say hello 👋</Text>
            </View>
          }
        />
      )}

      {/* Floating Settings Button (as seen in mobile UI) */}
      <TouchableOpacity
        style={styles.floatingSettingsBtn}
        onPress={() => setShowSettingsModal(true)}
        activeOpacity={0.85}
      >
        <Settings size={20} color="#64748B" />
      </TouchableOpacity>

      {/* Input bar — paperclip + emoji + pill input + circular send */}
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
          style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Send size={16} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* ─── NEW COMMUNITY MODAL (Matches Web Design) ─── */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Community</Text>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* GROUP LOGO */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>GROUP LOGO</Text>
                <View style={styles.logoPreviewRow}>
                  <View style={styles.logoPreviewBox}>
                    <Text style={{ fontSize: 28 }}>{selectedLogo}</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                    {PRESET_LOGOS.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={[
                          styles.presetLogoBtn,
                          selectedLogo === emoji && styles.presetLogoBtnActive,
                        ]}
                        onPress={() => setSelectedLogo(emoji)}
                      >
                        <Text style={{ fontSize: 18 }}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* COMMUNITY NAME */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  <Text style={{ color: '#EF4444' }}>* </Text>Community Name
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Mathematics Batch A"
                  placeholderTextColor="#94A3B8"
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                />
              </View>

              {/* DESCRIPTION */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  placeholder="Briefly describe this group"
                  placeholderTextColor="#94A3B8"
                  value={newGroupDesc}
                  onChangeText={setNewGroupDesc}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* ADD STUDENTS (BY BATCH) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Add Students (by batch)</Text>
                <TouchableOpacity
                  style={styles.dropdownToggle}
                  onPress={() => setShowBatchDropdown(!showBatchDropdown)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownToggleText}>
                    {selectedBatches.length > 0
                      ? `${selectedBatches.length} batch(es) selected`
                      : 'Search and select batches'}
                  </Text>
                  {showBatchDropdown ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
                </TouchableOpacity>

                {showBatchDropdown && (
                  <View style={styles.dropdownCard}>
                    <View style={styles.dropdownSearchBox}>
                      <Search size={14} color="#94A3B8" />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder="Search batches..."
                        placeholderTextColor="#94A3B8"
                        value={batchSearch}
                        onChangeText={setBatchSearch}
                      />
                    </View>
                    {loadingMembersData ? (
                      <ActivityIndicator size="small" color="#3E7B74" style={{ padding: 12 }} />
                    ) : filteredBatches.length === 0 ? (
                      <Text style={styles.dropdownEmptyText}>No batches found</Text>
                    ) : (
                      <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                        {filteredBatches.map((b) => {
                          const bId = b.id || b._id;
                          const bName = b.name || b.batchName || 'Batch';
                          const isChecked = selectedBatches.includes(bId);
                          return (
                            <TouchableOpacity
                              key={bId}
                              style={styles.dropdownItem}
                              onPress={() => toggleBatchSelection(bId)}
                            >
                              <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                                {isChecked && <Check size={12} color="#FFF" />}
                              </View>
                              <Text style={styles.dropdownItemText}>{bName}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>

              {/* ADD TEACHERS / STAFF */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Add Teachers/Staff</Text>
                <TouchableOpacity
                  style={styles.dropdownToggle}
                  onPress={() => setShowStaffDropdown(!showStaffDropdown)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownToggleText}>
                    {selectedStaff.length > 0
                      ? `${selectedStaff.length} staff selected`
                      : 'Search and select staff'}
                  </Text>
                  {showStaffDropdown ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
                </TouchableOpacity>

                {showStaffDropdown && (
                  <View style={styles.dropdownCard}>
                    <View style={styles.dropdownSearchBox}>
                      <Search size={14} color="#94A3B8" />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder="Search staff members..."
                        placeholderTextColor="#94A3B8"
                        value={staffSearch}
                        onChangeText={setStaffSearch}
                      />
                    </View>
                    {loadingMembersData ? (
                      <ActivityIndicator size="small" color="#3E7B74" style={{ padding: 12 }} />
                    ) : filteredStaff.length === 0 ? (
                      <Text style={styles.dropdownEmptyText}>No staff found</Text>
                    ) : (
                      <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                        {filteredStaff.map((s) => {
                          const sId = s.id || s._id;
                          const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Staff';
                          const isChecked = selectedStaff.includes(sId);
                          return (
                            <TouchableOpacity
                              key={sId}
                              style={styles.dropdownItem}
                              onPress={() => toggleStaffSelection(sId)}
                            >
                              <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                                {isChecked && <Check size={12} color="#FFF" />}
                              </View>
                              <Text style={styles.dropdownItemText}>{sName}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, creating && { opacity: 0.7 }]}
                onPress={handleCreateNewGroup}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.createBtnText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── GROUP SETTINGS / DETAILS MODAL ─── */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <TouchableOpacity
          style={styles.settingsOverlay}
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}
        >
          <View style={styles.settingsCard} onStartShouldSetResponder={() => true}>
            <View style={styles.settingsHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar name={currentCommunity?.name || ''} icon={currentCommunity?.icon} size={36} />
                <View>
                  <Text style={styles.settingsTitle}>{currentCommunity?.name}</Text>
                  <Text style={styles.settingsSub}>
                    {currentCommunity?.memberCount || currentCommunity?.members?.length || 0} members
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsBody}>
              <Text style={styles.settingsDescTitle}>About Group</Text>
              <Text style={styles.settingsDesc}>
                {currentCommunity?.description || 'No description provided.'}
              </Text>

              <TouchableOpacity
                style={styles.deleteGroupBtn}
                onPress={handleDeleteCurrentGroup}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={styles.deleteGroupBtnText}>Delete Community Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Channel sidebar (slide-in from left) */}
      <ChannelSidebar
        visible={sidebarOpen}
        communities={communities}
        selectedId={currentCommunity?.id || null}
        loading={loading}
        onSelect={handleSelectCommunity}
        onOpenCreate={handleOpenCreateModal}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Institute Drawer Menu (hamburger) */}
      {drawerOpen && (
        <InstituteDrawerMenu
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          navigation={navigation}
          activeScreen="Community"
          onLogout={() => dispatch(logoutUser() as any)}
        />
      )}
    </KeyboardAvoidingView>
  </SafeAreaView>
);
};

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  newGroupHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3E7B74',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newGroupHeaderBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Chips ──
  chipRow: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F3F1',
    borderWidth: 1,
    borderColor: '#3E7B74',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
    marginRight: 4,
  },
  addChipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3E7B74',
  },
  chipList: {
    paddingRight: THEME.spacing.md,
    paddingLeft: 4,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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

  // ── Info bar ──
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderLight,
  },
  infoDesc: {
    flex: 1,
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginRight: 8,
  },
  infoMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoMembersText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },

  // ── Messages ──
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  msgList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },

  // ── Floating Settings Button ──
  floatingSettingsBtn: {
    position: 'absolute',
    right: 16,
    top: 140,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },

  // ── Bubble ──
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
    maxWidth: '78%',
    alignItems: 'flex-start',
  },
  msgBodyReverse: {
    alignItems: 'flex-end',
  },
  senderRow: {
    marginBottom: 2,
    marginLeft: 4,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  myBubble: {
    backgroundColor: '#3E7B74',
    borderBottomRightRadius: 3,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myBubbleText: {
    color: '#FFFFFF',
  },
  otherBubbleText: {
    color: '#1E293B',
  },
  msgTime: {
    fontSize: 10,
    marginTop: 3,
  },
  myMsgTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherMsgTime: {
    color: '#94A3B8',
  },

  // ── Date Separator ──
  dateSepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 8,
  },
  dateSepLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dateSepText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
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

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    maxHeight: 100,
    fontSize: 14,
    color: '#1E293B',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3E7B74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },

  // ── Sidebar ──
  sidebarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_W,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sidebarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  sidebarNewGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3E7B74',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sidebarNewGroupBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sidebarSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sidebarSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    paddingVertical: 0,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  channelRowActive: {
    backgroundColor: '#E8F3F1',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  channelNameActive: {
    fontWeight: '800',
    color: '#3E7B74',
  },
  channelMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  formTextarea: {
    height: 70,
    textAlignVertical: 'top',
  },
  logoPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoPreviewBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F3F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3E7B74',
  },
  presetScroll: {
    flex: 1,
  },
  presetLogoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  presetLogoBtnActive: {
    backgroundColor: '#E8F3F1',
    borderWidth: 2,
    borderColor: '#3E7B74',
  },
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownToggleText: {
    fontSize: 13,
    color: '#64748B',
  },
  dropdownCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginTop: 6,
    padding: 8,
  },
  dropdownSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
    gap: 6,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    paddingVertical: 0,
  },
  dropdownEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#1E293B',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#3E7B74',
    borderColor: '#3E7B74',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  createBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Settings Modal ──
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  settingsSub: {
    fontSize: 12,
    color: '#64748B',
  },
  settingsBody: {
    padding: 16,
  },
  settingsDescTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  settingsDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 16,
  },
  deleteGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteGroupBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
