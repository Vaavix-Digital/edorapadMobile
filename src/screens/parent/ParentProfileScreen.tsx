import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  Settings,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchParentProfile } from '../../store/slices/parentSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { formatDate } from '../../shared/utils/dateHelpers';

export const ParentProfileScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { profile, profileSettings, children, parentName, loading } = useAppSelector(
    (state) => state.parent
  );

  useEffect(() => {
    dispatch(fetchParentProfile());
  }, [dispatch]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => dispatch(logoutUser()) },
    ]);
  };

  const displayName = profile?.name || parentName || user?.name || 'Parent';
  const displayEmail = profile?.email || user?.email || '—';
  const displayPhone = profile?.phone || user?.phone || '—';
  const profilePic = profileSettings?.profilePicUrl;

  const basicInfo = [
    { label: 'Full Name', value: displayName },
    {
      label: 'Date of Birth',
      value: profileSettings?.dob ? formatDate(profileSettings.dob) : '—',
    },
    { label: 'Phone Number', value: displayPhone },
    { label: 'Email', value: displayEmail },
    { label: 'Unique Identity', value: profile?.uniqueIdentity || '—' },
    { label: 'Gender', value: profileSettings?.gender || '—' },
    { label: 'Nationality', value: profileSettings?.nationality || '—' },
  ];

  const emailAlerts = profileSettings?.emailAlerts ?? true;
  const whatsappAlerts = profileSettings?.whatsappAlerts ?? false;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => dispatch(fetchParentProfile())}
            tintColor={THEME.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Profile"
          subtitle="Personal details & alert preferences"
          showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
          onBack={() => navigation?.goBack?.()}
          rightAction={
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.settingsBtn}
              activeOpacity={0.8}
            >
              <Settings size={18} color="#1E293B" />
            </TouchableOpacity>
          }
        />

        {/* ─── Profile Avatar Card ─── */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarWrapper}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>
        </View>

        {/* ─── Basic Information Card ─── */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          {basicInfo.map((item, idx) => (
            <View
              key={item.label}
              style={[
                styles.infoRow,
                idx === basicInfo.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* ─── Preferences Card ─── */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Preferences</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Notifications</Text>
            <View
              style={[
                styles.badge,
                emailAlerts ? styles.badgeEnabled : styles.badgeDisabled,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  emailAlerts ? styles.textEnabled : styles.textDisabled,
                ]}
              >
                {emailAlerts ? '• Enabled' : '• Disabled'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>WhatsApp Alerts</Text>
            <View
              style={[
                styles.badge,
                whatsappAlerts ? styles.badgeEnabled : styles.badgeDisabled,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  whatsappAlerts ? styles.textEnabled : styles.textDisabled,
                ]}
              >
                {whatsappAlerts ? '• Enabled' : '• Disabled'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Linked Children Card ─── */}
        {children && children.length > 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Linked Students ({children.length})</Text>
            {children.map((child: any, idx: number) => (
              <View
                key={child.id || child._id || idx}
                style={[
                  styles.childRow,
                  idx === children.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.childAvatar}>
                  <Text style={styles.childAvatarText}>
                    {(child.name || 'S').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childClass}>
                    {child.class || child.className || 'Enrolled Student'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* ─── Action Buttons ─── */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.85}
        >
          <Settings size={18} color="#FFF" />
          <Text style={styles.editBtnText}>Edit Profile & Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  settingsBtn: {
    padding: 8,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xl,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#54A39A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#DEE6E4',
    marginBottom: 10,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C2D1CD',
    marginBottom: THEME.spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(41, 86, 81, 0.12)',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#295651',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: '55%',
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeEnabled: {
    backgroundColor: '#DCFCE7',
  },
  badgeDisabled: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textEnabled: {
    color: '#166534',
  },
  textDisabled: {
    color: '#991B1B',
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(41, 86, 81, 0.12)',
    gap: 10,
  },
  childAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#54A39A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  childName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  childClass: {
    fontSize: 11,
    color: '#64748B',
  },
  editBtn: {
    backgroundColor: '#54A39A',
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  signOutBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
