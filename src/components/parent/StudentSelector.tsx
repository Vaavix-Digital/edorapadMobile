import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSelectedStudent, DEFAULT_PARENT_STUDENTS } from '../../store/slices/parentSlice';
import { THEME } from '../../shared/constants/theme';

interface StudentSelectorProps {
  students?: any[];
  hideIfSingle?: boolean;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students: studentsProp,
  hideIfSingle = false,
}) => {
  const dispatch = useAppDispatch();
  const { dashboard, children, selectedStudentId } = useAppSelector((state) => state.parent);

  // Extract from dashboard
  const dashboardStudents =
    Array.isArray(dashboard) && dashboard.length > 0
      ? dashboard
          .map((s) => {
            const info = s?.studentInfo || s;
            return {
              id: info?.id || info?._id || s?.id || s?._id,
              _id: info?._id || info?.id || s?._id || s?.id,
              name: info?.name || s?.name || 'Student',
              email: info?.email || s?.email || '',
              profilePic: info?.profilePic || info?.profilePicUrl || s?.profilePic,
              class: info?.class || info?.className || s?.class || '',
            };
          })
          .filter((s) => s.id || s.name)
      : [];

  const childrenStudents =
    Array.isArray(children) && children.length > 0
      ? children.map((c) => ({
          id: c?.id || c?._id,
          _id: c?._id || c?.id,
          name: c?.name || 'Student',
          email: c?.email || '',
          profilePic: c?.profilePic || c?.profilePicUrl,
          class: c?.class || c?.className || '',
        }))
      : [];

  const fallbackStudents = DEFAULT_PARENT_STUDENTS.map((s) => ({
    id: s.studentInfo.id,
    _id: s.studentInfo._id,
    name: s.studentInfo.name,
    email: s.studentInfo.email,
    profilePic: s.studentInfo.profilePic,
    class: s.studentInfo.class,
  }));

  const students =
    studentsProp && studentsProp.length > 0
      ? studentsProp
      : dashboardStudents.length > 0
      ? dashboardStudents
      : childrenStudents.length > 0
      ? childrenStudents
      : fallbackStudents;

  if (!students || students.length === 0) return null;
  if (hideIfSingle && students.length <= 1) return null;

  const handleSelect = (id: string) => {
    dispatch(setSelectedStudent(id));
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>SELECT STUDENT</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {students.map((child: any) => {
          const id = child.id || child._id;
          const isActive =
            id === selectedStudentId ||
            (child.name &&
              dashboard.find((d: any) => (d.studentInfo?.name || d.name) === child.name)?.studentInfo?.id ===
                selectedStudentId);
          const name = child.name || 'Student';
          const profilePic = child.profilePic || child.profilePicUrl;

          return (
            <TouchableOpacity
              key={id || name}
              style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
              onPress={() => handleSelect(id)}
              activeOpacity={0.8}
            >
              {/* Avatar circle */}
              <View
                style={[
                  styles.avatarWrap,
                  isActive ? styles.avatarWrapActive : styles.avatarWrapInactive,
                ]}
              >
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.avatarImg} />
                ) : (
                  <Text
                    style={[
                      styles.avatarInitials,
                      isActive ? styles.avatarInitialsActive : styles.avatarInitialsInactive,
                    ]}
                  >
                    {getInitials(name)}
                  </Text>
                )}
              </View>

              {/* Name & Class */}
              <View style={styles.textWrap}>
                <Text
                  style={[styles.nameText, isActive ? styles.nameTextActive : styles.nameTextInactive]}
                  numberOfLines={1}
                >
                  {name}
                </Text>
                {child.class || child.className ? (
                  <Text
                    style={[styles.subText, isActive ? styles.subTextActive : styles.subTextInactive]}
                    numberOfLines={1}
                  >
                    {child.class || child.className}
                  </Text>
                ) : null}
              </View>

              {/* Active Indicator Dot */}
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 8,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1.5,
    minWidth: 145,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillActive: {
    backgroundColor: '#3E7874',
    borderColor: '#295651',
    shadowColor: '#3E7874',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  pillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  avatarWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  avatarWrapInactive: {
    backgroundColor: '#DEE6E4',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '800',
  },
  avatarInitialsActive: {
    color: '#FFFFFF',
  },
  avatarInitialsInactive: {
    color: '#1A5247',
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nameTextActive: {
    color: '#FFFFFF',
  },
  nameTextInactive: {
    color: '#1F2937',
  },
  subText: {
    fontSize: 10.5,
    marginTop: 1,
  },
  subTextActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  subTextInactive: {
    color: '#9CA3AF',
  },
  activeDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34D399',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
