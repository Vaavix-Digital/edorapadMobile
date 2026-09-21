import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { THEME } from '../../shared/constants/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = THEME.colors.primary,
  trend,
}) => {
  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {icon && (
          <View style={[styles.iconBox, { backgroundColor: `${accentColor}15` }]}>
            {icon}
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {(subtitle || trend) && (
        <View style={styles.bottomRow}>
          {trend ? <Text style={styles.trend}>{trend}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: THEME.spacing.md,
    marginBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: THEME.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  value: {
    fontSize: THEME.typography.sizes.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trend: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '600',
    color: THEME.colors.success,
  },
  subtitle: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textMuted,
  },
});
