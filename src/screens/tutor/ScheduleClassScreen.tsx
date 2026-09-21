import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Video, Calendar, Clock, BookOpen, Link2 } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { THEME } from '../../shared/constants/theme';
import { tutorApi } from '../../shared/api/tutorApi';
import { useAppSelector } from '../../store';

export const ScheduleClassScreen = ({ navigation }: any) => {
  const { batches } = useAppSelector((state) => state.tutor);

  const [title, setTitle] = useState('');
  const [batchId, setBatchId] = useState(batches[0]?.id || batches[0]?._id || 'batch_1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:30 AM');
  const [meetingLink, setMeetingLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!title) {
      Alert.alert('Validation Error', 'Please enter a class title');
      return;
    }

    setLoading(true);
    try {
      await tutorApi.scheduleLiveClass({
        title,
        batchId,
        scheduledStartTime: `${date}T${startTime}`,
        scheduledEndTime: `${date}T${endTime}`,
        meetingLink: meetingLink || 'https://meet.edorapad.com/room_auto',
        status: 'scheduled',
      });

      Alert.alert('Class Scheduled', 'The class session has been published to all enrolled students.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to schedule class. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <Header
        title="Schedule Class"
        subtitle="Create a new live lecture session"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.card}>
        <Input
          label="Session Title"
          placeholder="e.g. Advanced Calculus - Chapter 4"
          value={title}
          onChangeText={setTitle}
          leftIcon={<BookOpen size={18} color={THEME.colors.textMuted} />}
        />

        <Input
          label="Date (YYYY-MM-DD)"
          placeholder="2026-09-01"
          value={date}
          onChangeText={setDate}
          leftIcon={<Calendar size={18} color={THEME.colors.textMuted} />}
        />

        <View style={styles.timeRow}>
          <Input
            label="Start Time"
            placeholder="10:00 AM"
            value={startTime}
            onChangeText={setStartTime}
            containerStyle={{ flex: 1 }}
            leftIcon={<Clock size={18} color={THEME.colors.textMuted} />}
          />
          <Input
            label="End Time"
            placeholder="11:30 AM"
            value={endTime}
            onChangeText={setEndTime}
            containerStyle={{ flex: 1 }}
            leftIcon={<Clock size={18} color={THEME.colors.textMuted} />}
          />
        </View>

        <Input
          label="Custom Meeting Link (Optional)"
          placeholder="https://meet.google.com/xyz or Zoom URL"
          value={meetingLink}
          onChangeText={setMeetingLink}
          autoCapitalize="none"
          leftIcon={<Link2 size={18} color={THEME.colors.textMuted} />}
        />

        <Button
          title="Publish Live Session"
          onPress={handleSchedule}
          loading={loading}
          icon={<Video size={18} color="#FFF" />}
          size="lg"
          style={styles.submitBtn}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  submitBtn: {
    marginTop: THEME.spacing.md,
  },
});
