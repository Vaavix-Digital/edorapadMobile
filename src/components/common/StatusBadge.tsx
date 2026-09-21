import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../../shared/constants/theme';

interface StatusBadgeProps {
  status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'Half Day' | 'Completed' | 'Pending' | 'Partial' | 'Approved' | 'Rejected' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getColors = () => {
    switch (status?.toLowerCase()) {
      case 'present':
      case 'completed':
      case 'approved':
      case 'success':
        return { bg: THEME.colors.successLight, text: THEME.colors.success };
      case 'absent':
      case 'rejected':
      case 'failed':
        return { bg: THEME.colors.errorLight, text: THEME.colors.error };
      case 'late':
      case 'partial':
      case 'pending':
        return { bg: THEME.colors.warningLight, text: THEME.colors.warning };
      case 'leave':
      case 'half day':
        return { bg: '#F3E8FF', text: '#9333EA' };
      default:
        return { bg: THEME.colors.surfaceSubtle, text: THEME.colors.textSecondary };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'sm' ? styles.sm : styles.md]}>
      <Text style={[styles.text, { color: text }, size === 'sm' ? styles.textSm : styles.textMd]}>
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: THEME.borderRadius.full,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sm: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  md: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  text: {
    fontWeight: '700',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 13,
  },
});
