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
  BookOpen,
  Video,
  MessageSquare,
  ClipboardCheck,
  Award,
  CreditCard,
  Gift,
  User,
  Settings,
  X,
  LogOut,
} from 'lucide-react-native';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';

const DRAWER_WIDTH = 280;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DrawerItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  screen: string;
}

interface StudentDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: any;
  activeScreen?: string;
  onLogout?: () => void;
}

export const StudentDrawerMenu: React.FC<StudentDrawerMenuProps> = ({
  isOpen,
  onClose,
  navigation,
  activeScreen = 'StudentDashboard',
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
    { id: 'StudentDashboard', label: 'Dashboard',   icon: <LayoutDashboard   size={20} color={THEME.colors.textPrimary} />, screen: 'StudentDashboard' },
    { id: 'Courses',          label: 'Courses',     icon: <BookOpen          size={20} color={THEME.colors.textPrimary} />, screen: 'Courses' },
    { id: 'Classes',          label: 'Classes',     icon: <Video             size={20} color={THEME.colors.textPrimary} />, screen: 'Classes' },
    { id: 'Community',        label: 'Community',   icon: <MessageSquare     size={20} color={THEME.colors.textPrimary} />, screen: 'Community' },
    { id: 'Assessments',      label: 'Assessments', icon: <ClipboardCheck    size={20} color={THEME.colors.textPrimary} />, screen: 'Assessments' },
    { id: 'Certificates',     label: 'Certificates',icon: <Award             size={20} color={THEME.colors.textPrimary} />, screen: 'Certificates' },
    { id: 'Payments',         label: 'Payments',    icon: <CreditCard        size={20} color={THEME.colors.textPrimary} />, screen: 'Payments' },
    { id: 'Referral',         label: 'Referral',    icon: <Gift              size={20} color={THEME.colors.textPrimary} />, screen: 'Referral' },
    { id: 'Profile',          label: 'Profile',     icon: <User              size={20} color={THEME.colors.textPrimary} />, screen: 'Profile' },
    { id: 'StudentSettings',  label: 'Settings',    icon: <Settings          size={20} color={THEME.colors.textPrimary} />, screen: 'StudentSettings' },
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
    // still need the container rendered for the animation to start correctly
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
          <View style={styles.logoRow}>
            {/* Edorapad branding */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/edorapad-logo.png')}
                style={styles.drawerLogoImage}
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Student Info */}
          <View style={styles.studentInfo}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.studentText}>
              <Text style={styles.studentName} numberOfLines={1}>{user?.name || 'Student'}</Text>
              <Text style={styles.studentId}>{user?.studentCustomId || 'STU-001'}</Text>
            </View>
          </View>
        </View>

        {/* Navigation Items */}
        <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
          {drawerItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => handleNavigate(item.screen)}
                activeOpacity={0.75}
              >
                <View style={[styles.navIcon, isActive && styles.navIconActive]}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, {
                    color: isActive ? '#FFFFFF' : THEME.colors.textPrimary,
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
    backgroundColor: '#DEE6E4',
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
  studentInfo: {
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
  studentText: {
    flex: 1,
  },
  studentName: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  studentId: {
    fontSize: THEME.typography.sizes.xs,
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
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 4,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: '#3D7A73',
  },
  navIcon: {
    width: 22,
    alignItems: 'center',
  },
  navIconActive: {},
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
