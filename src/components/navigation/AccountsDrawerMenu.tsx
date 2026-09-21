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
  Modal,
  Image,
} from 'react-native';
import {
  LayoutDashboard,
  CreditCard,
  Banknote,
  MessageSquare,
  Users,
  Megaphone,
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

interface AccountsDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: any;
  activeScreen?: string;
  onLogout?: () => void;
}

export const AccountsDrawerMenu: React.FC<AccountsDrawerMenuProps> = ({
  isOpen,
  onClose,
  navigation,
  activeScreen = 'AccountsDashboard',
  onLogout,
}) => {
  const dispatch = useAppDispatch();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isOpen) {
      slideAnim.setValue(-DRAWER_WIDTH);
      overlayAnim.setValue(0);
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
    }
  }, [isOpen]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const drawerItems: DrawerItem[] = [
    { id: 'AccountsDashboard', label: 'Dashboard',     icon: <LayoutDashboard size={20} color={THEME.colors.textPrimary} />, screen: 'AccountsDashboard' },
    { id: 'AccountsFees',      label: 'Fees',          icon: <CreditCard      size={20} color={THEME.colors.textPrimary} />, screen: 'AccountsFees' },
    { id: 'AccountsSalary',    label: 'Salary',        icon: <Banknote        size={20} color={THEME.colors.textPrimary} />, screen: 'AccountsSalary' },
    { id: 'AccountsCommunity', label: 'Community',     icon: <MessageSquare   size={20} color={THEME.colors.textPrimary} />, screen: 'AccountsCommunity' },
    { id: 'AccountsStaff',     label: 'Staff Details', icon: <Users           size={20} color={THEME.colors.textPrimary} />, screen: 'AccountsStaff' },
    { id: 'AccountsMarketing', label: 'Marketing',     icon: <Megaphone       size={20} color={THEME.colors.textPrimary} />, screen: 'AccountsMarketing' },
    { id: 'AccountsProfile',   label: 'Profile',       icon: <User            size={20} color={THEME.colors.textPrimary} />, screen: 'AccountsProfile' },
    { id: 'AccountsSettings',  label: 'Settings',      icon: <Settings        size={20} color={THEME.colors.textPrimary} />, screen: 'AccountsSettings' },
  ];

  const handleNavigate = (screen: string) => {
    if (screen === activeScreen) {
      handleClose();
      return;
    }
    // Instantly close drawer to prevent any lingering shadow on return
    onClose();
    navigation.navigate(screen);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out from Accounts & Marketing portal?',
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
    return null;
  }

  const userName = user?.name || 'Accounts Admin';
  const initial = userName.charAt(0).toUpperCase();
  const userProfilePic = (user as any)?.profilePicUrl || (user as any)?.avatar || (user as any)?.profilePicture;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <TouchableOpacity style={styles.overlayTouch} onPress={handleClose} activeOpacity={1} />
        </Animated.View>

        {/* Drawer */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.drawerHeader}>
            {/* Logo & Close Row */}
            <View style={styles.logoRow}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>ed<Text style={styles.logoAccent}>◎</Text>rapad</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={22} color={THEME.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* User Profile Info Card */}
            <View style={styles.userInfo}>
              <View style={styles.avatarCircle}>
                {userProfilePic ? (
                  <Image source={{ uri: userProfilePic }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitial}>{initial}</Text>
                )}
              </View>
              <View style={styles.userText}>
                <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
                <Text style={styles.userSubtitle}>Accounts &amp; Marketing</Text>
              </View>
            </View>
          </View>

          {/* Navigation Items List */}
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
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
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHeader: {
    backgroundColor: '#DEE6E4',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
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
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: THEME.colors.primary,
  },
  closeBtn: {
    padding: 4,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.06)',
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
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
