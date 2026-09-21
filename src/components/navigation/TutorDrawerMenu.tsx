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
} from 'react-native';
import {
  LayoutDashboard,
  Video,
  Users,
  ClipboardCheck,
  CalendarPlus,
  MessageSquare,
  ClipboardList,
  FileText,
  User,
  Settings,
  X,
  LogOut,
} from 'lucide-react-native';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser, normalizeUserRole } from '../../store/slices/authSlice';
import { USER_ROLES } from '../../shared/types';

const DRAWER_WIDTH = 280;

interface DrawerItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  screen: string;
}

interface TutorDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: any;
  activeScreen?: string;
  onLogout?: () => void;
}

export const TutorDrawerMenu: React.FC<TutorDrawerMenuProps> = ({
  isOpen,
  onClose,
  navigation,
  activeScreen = 'TutorDashboard',
  onLogout,
}) => {
  const dispatch = useAppDispatch();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const { user, role } = useAppSelector((state) => state.auth);

  const normalizedRole = normalizeUserRole(role || user?.role || '');
  const isOnlineTutor = normalizedRole === USER_ROLES.ONLINETUTOR;

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

  const onlineTutorItems: DrawerItem[] = [
    { id: 'TutorDashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} color={THEME.colors.textPrimary} />, screen: 'TutorDashboard' },
    { id: 'LiveClasses', label: 'Live Classes', icon: <Video size={20} color={THEME.colors.textPrimary} />, screen: 'LiveClasses' },
    { id: 'TutorBatches', label: 'Batches', icon: <Users size={20} color={THEME.colors.textPrimary} />, screen: 'TutorBatches' },
    { id: 'AttendanceMarking', label: 'Attendance', icon: <ClipboardCheck size={20} color={THEME.colors.textPrimary} />, screen: 'AttendanceMarking' },
    { id: 'ScheduleClass', label: 'Schedule Class', icon: <CalendarPlus size={20} color={THEME.colors.textPrimary} />, screen: 'ScheduleClass' },
    { id: 'Community', label: 'Community', icon: <MessageSquare size={20} color={THEME.colors.textPrimary} />, screen: 'Community' },
    { id: 'TutorTasks', label: 'Task Manager', icon: <ClipboardList size={20} color={THEME.colors.textPrimary} />, screen: 'TutorTasks' },
    { id: 'LeaveRequest', label: 'Leave Request', icon: <FileText size={20} color={THEME.colors.textPrimary} />, screen: 'LeaveRequest' },
    { id: 'Profile', label: 'Profile', icon: <User size={20} color={THEME.colors.textPrimary} />, screen: 'Profile' },
    { id: 'Settings', label: 'Settings', icon: <Settings size={20} color={THEME.colors.textPrimary} />, screen: 'Settings' },
  ];

  const offlineTutorItems: DrawerItem[] = [
    { id: 'TutorDashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} color={THEME.colors.textPrimary} />, screen: 'TutorDashboard' },
    { id: 'TutorBatches', label: 'Batches', icon: <Users size={20} color={THEME.colors.textPrimary} />, screen: 'TutorBatches' },
    { id: 'AttendanceMarking', label: 'Attendance', icon: <ClipboardCheck size={20} color={THEME.colors.textPrimary} />, screen: 'AttendanceMarking' },
    { id: 'Community', label: 'Community', icon: <MessageSquare size={20} color={THEME.colors.textPrimary} />, screen: 'Community' },
    { id: 'TutorTasks', label: 'Task Manager', icon: <ClipboardList size={20} color={THEME.colors.textPrimary} />, screen: 'TutorTasks' },
    { id: 'LeaveRequest', label: 'Leave Request', icon: <FileText size={20} color={THEME.colors.textPrimary} />, screen: 'LeaveRequest' },
    { id: 'Profile', label: 'Profile', icon: <User size={20} color={THEME.colors.textPrimary} />, screen: 'Profile' },
    { id: 'Settings', label: 'Settings', icon: <Settings size={20} color={THEME.colors.textPrimary} />, screen: 'Settings' },
  ];

  const drawerItems = isOnlineTutor ? onlineTutorItems : offlineTutorItems;

  const handleNavigate = (screenName: string) => {
    onClose();
    setTimeout(() => {
      navigation.navigate(screenName);
    }, 150);
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

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.drawerHeader}>
          {/* Logo + Close row */}
          <View style={styles.logoRow}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>ed<Text style={styles.logoAccent}>◎</Text>rapad</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={22} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {(user?.name || 'T').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userText}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Tutor Member'}
              </Text>
              <Text style={styles.userSubtitle}>
                {isOnlineTutor ? 'Online Educator' : 'Faculty Member'}
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
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 9998,
  },
  overlayTouch: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#DEE6E4',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(62, 120, 116, 0.15)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3E7874',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#2A5551',
  },
  closeBtn: {
    padding: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3E7874',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  userSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  navList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
    gap: 14,
  },
  navItemActive: {
    backgroundColor: '#3D7A73',
  },
  navIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(62, 120, 116, 0.15)',
    marginVertical: 12,
    marginHorizontal: 4,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 32,
    gap: 14,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.error,
  },
});
