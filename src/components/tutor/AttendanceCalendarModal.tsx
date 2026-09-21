import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchMonthlyAttendance } from '../../store/slices/tutorSlice';

interface AttendanceCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId?: string;
}

export const AttendanceCalendarModal: React.FC<AttendanceCalendarModalProps> = ({
  isOpen,
  onClose,
  staffId,
}) => {
  const dispatch = useAppDispatch();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { monthlyAttendance, monthlyLoading, attendance } = useAppSelector(
    (state) => state.tutor
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const currentMonth = currentDate.getMonth(); // 0-indexed
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    if (isOpen) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const yearStr = String(currentYear);
      dispatch(fetchMonthlyAttendance({ month: monthStr, year: yearStr }));
    }
  }, [isOpen, currentMonth, currentYear, dispatch]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Generate calendar days
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const days: { day: number | null; dateStr: string | null }[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push({ day: null, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, dateStr: dStr });
  }

  const getDayStatus = (dateStr: string | null) => {
    if (!dateStr) return null;
    const attList = monthlyAttendance?.attendance || [];
    const leavesList = monthlyAttendance?.leaves || [];

    const att = attList.find((item: any) => {
      const iDate = typeof item.date === 'string' ? item.date.substring(0, 10) : '';
      return iDate === dateStr;
    });
    if (att) {
      return { status: att.status || 'Present', inTime: att.inTime };
    }

    const leave = leavesList.find((item: any) => {
      const lDate = typeof item.date === 'string' ? item.date.substring(0, 10) : '';
      return lDate === dateStr;
    });
    if (leave) {
      return { status: 'Leave', inTime: null };
    }

    return null;
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <CalendarIcon size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.headerTitle}>Attendance Details</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Summary KPI Bar */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Attended</Text>
                <Text style={styles.kpiValue}>{attendance.attendedDays || 0}</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Leave Taken</Text>
                <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>
                  {attendance.leaveTaken || 0}
                </Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Remaining</Text>
                <Text style={[styles.kpiValue, { color: '#10B981' }]}>
                  {attendance.remaining || 0}
                </Text>
              </View>
            </View>

            {/* Month Selector */}
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn}>
                <ChevronLeft size={20} color={THEME.colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn}>
                <ChevronRight size={20} color={THEME.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            {monthlyLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3E7B74" />
                <Text style={styles.loaderText}>Loading report...</Text>
              </View>
            ) : (
              <View style={styles.calendarCard}>
                {/* Weekday headers */}
                <View style={styles.weekHeader}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w, idx) => (
                    <Text key={idx} style={styles.weekdayLabel}>
                      {w}
                    </Text>
                  ))}
                </View>

                {/* Day cells */}
                <View style={styles.daysGrid}>
                  {days.map((d, index) => {
                    if (!d.day) {
                      return <View key={index} style={styles.emptyDayCell} />;
                    }
                    const info = getDayStatus(d.dateStr);
                    const isPresent = info?.status === 'Present';
                    const isAbsent = info?.status === 'Absent';
                    const isLeave = info?.status === 'Leave';

                    return (
                      <View key={index} style={styles.dayCell}>
                        <Text style={styles.dayNumber}>{d.day}</Text>
                        <View style={styles.dotRow}>
                          {isPresent && <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />}
                          {isAbsent && <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />}
                          {isLeave && <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Legend */}
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.legendText}>Present</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.legendText}>Absent</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.legendText}>Leave</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Close button at bottom */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#3E7B74',
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 18,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#DEE6E4',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#243029',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3E7B74',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FBFA',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  arrowBtn: {
    padding: 4,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 6,
  },
  weekdayLabel: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    height: 42,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    height: 6,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  doneBtn: {
    backgroundColor: '#3E7B74',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
