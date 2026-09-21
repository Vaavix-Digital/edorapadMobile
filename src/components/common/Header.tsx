import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, Bell, Menu } from 'lucide-react-native';
import { THEME } from '../../shared/constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenuPress?: () => void;
  rightAction?: React.ReactNode;
  showNotifications?: boolean;
  onNotificationsPress?: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  showMenu = false,
  onMenuPress,
  rightAction,
  showNotifications = false,
  onNotificationsPress,
  unreadNotificationsCount = 0,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
        )}
        {showMenu && !showBack && (
          <TouchableOpacity onPress={onMenuPress} style={styles.menuButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Menu size={24} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.rightRow}>
        {showNotifications && (
          <TouchableOpacity onPress={onNotificationsPress} style={styles.iconButton}>
            <Bell size={22} color={THEME.colors.textPrimary} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {rightAction}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: THEME.spacing.sm,
    padding: 4,
  },
  menuButton: {
    marginRight: THEME.spacing.sm,
    padding: 4,
    borderRadius: THEME.borderRadius.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: THEME.typography.sizes.xl,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: THEME.colors.error,
    borderRadius: 99,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
