import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
  Image,
} from 'react-native';
import {
  LayoutDashboard,
  UserPlus,
  BookOpen,
  MessageSquare,
  Building2,
  Users,
  ClipboardCheck,
  CheckSquare,
  Layers,
  Award,
  Bell,
  User,
  Settings,
  X,
  LogOut,
} from 'lucide-react-native';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';

const DRAWER_WIDTH = 280;

interface DrawerItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  screen: string;
}

interface InstituteDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: any;
  activeScreen?: string;
  onLogout?: () => void;
}

export const InstituteDrawerMenu: React.FC<InstituteDrawerMenuProps> = ({
  isOpen,
  onClose,
  navigation,
  activeScreen = 'InstituteDashboard',
  onLogout,
}) => {
  const dispatch = useAppDispatch();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 18,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const drawerItems: DrawerItem[] = [
    { id: 'InstituteDashboard', label: 'Dashboard',        icon: <LayoutDashboard size={20} color={THEME.colors.textPrimary} />, screen: 'InstituteDashboard' },
    { id: 'Admissions',         label: 'Admissions',       icon: <UserPlus        size={20} color={THEME.colors.textPrimary} />, screen: 'Admissions' },
    { id: 'Courses',            label: 'Courses',          icon: <BookOpen        size={20} color={THEME.colors.textPrimary} />, screen: 'Courses' },
    { id: 'Community',          label: 'Community',        icon: <MessageSquare   size={20} color={THEME.colors.textPrimary} />, screen: 'Community' },
    { id: 'Departments',        label: 'Department',       icon: <Building2       size={20} color={THEME.colors.textPrimary} />, screen: 'Departments' },
    { id: 'StaffManagement',    label: 'Staff Management', icon: <Users           size={20} color={THEME.colors.textPrimary} />, screen: 'StaffManagement' },
    { id: 'AttendanceMarking',  label: 'Attendance',       icon: <ClipboardCheck  size={20} color={THEME.colors.textPrimary} />, screen: 'AttendanceMarking' },
    { id: 'LeaveApprovals',     label: 'Leaves',           icon: <CheckSquare     size={20} color={THEME.colors.textPrimary} />, screen: 'LeaveApprovals' },
    { id: 'Batches',            label: 'Batch',            icon: <Layers          size={20} color={THEME.colors.textPrimary} />, screen: 'Batches' },
    { id: 'Certificates',       label: 'Certificates',     icon: <Award           size={20} color={THEME.colors.textPrimary} />, screen: 'Certificates' },
    { id: 'Notifications',      label: 'Notifications',    icon: <Bell            size={20} color={THEME.colors.textPrimary} />, screen: 'Notifications' },
    { id: 'Profile',            label: 'Profile',          icon: <User            size={20} color={THEME.colors.textPrimary} />, screen: 'Profile' },
    { id: 'Settings',           label: 'Settings',         icon: <Settings        size={20} color={THEME.colors.textPrimary} />, screen: 'Settings' },
  ];

  const handleNavigate = (screen: string) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(screen);
    }, 250);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            onClose();
            if (onLogout) {
              onLogout();
            } else {
              dispatch(logoutUser());
            }
          },
        },
      ]
    );
  };

  if (!isOpen) {
    return (
      <Animated.View style={[styles.overlay, { opacity: overlayAnim, pointerEvents: 'none' }]} />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <TouchableOpacity style={styles.overlayTouch} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Drawer — same #DEE6E4 as StudentDrawerMenu */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.drawerHeader}>
          {/* Logo + Close row */}
          <View style={styles.logoRow}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/edorapad-logo.png')}
                style={styles.drawerLogoImage}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={22} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Institute/User Info — same layout as student (avatar circle + name + role) */}
          <View style={styles.userInfo}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {(user?.name || 'IN').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userText}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Institute Admin'}
              </Text>
              <Text style={styles.userSubtitle}>
                {user?.staffCustomId || 'INST-001'}
              </Text>
            </View>
          </View>
        </View>

        {/* Navigation Items */}
        <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
          {drawerItems.map((item) => {
            const isActive = activeScreen === item.id || activeScreen === item.screen;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => handleNavigate(item.screen)}
                activeOpacity={0.75}
              >
                <View style={styles.navIcon}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, {
                    color: isActive ? '#FFFFFF' : THEME.colors.textPrimary,
                    size: 20,
                  })}
                </View>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Logout */}
          <TouchableOpacity style={styles.logoutItem} onPress={handleLogout} activeOpacity={0.75}>
            <View style={styles.navIcon}>
              <LogOut size={20} color={THEME.colors.error} />
            </View>
            <Text style={styles.logoutLabel}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 100,
  },
  overlayTouch: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#DEE6E4',   // ← exact same as StudentDrawerMenu
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHeader: {
    backgroundColor: '#DEE6E4',
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  logoContainer: {},
  drawerLogoImage: {
    width: 140,
    height: 30,
  },
  closeBtn: {
    padding: 4,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  // User info — identical layout to StudentDrawerMenu
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  userSubtitle: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  // Navigation list — identical to StudentDrawerMenu
  navList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 4,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: '#3D7A73',   // ← exact same teal as StudentDrawerMenu active
  },
  navIcon: {
    width: 22,
    alignItems: 'center',
  },
  navLabel: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '600',
    color: '#1A202C',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 10,
    marginHorizontal: 4,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 24,
    gap: 12,
  },
  logoutLabel: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '600',
    color: THEME.colors.error,
  },
});
