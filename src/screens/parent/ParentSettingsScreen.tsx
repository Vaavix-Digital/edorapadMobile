import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { User, Mail, Phone, Calendar, Globe, LogOut, Check, Save, ShieldCheck, ExternalLink } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchParentProfile,
  updateParentProfile,
  updateParentPreferences,
} from '../../store/slices/parentSlice';
import { logoutUser } from '../../store/slices/authSlice';

export const ParentSettingsScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { profile, profileSettings, children, loading } = useAppSelector((state) => state.parent);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    gender: '',
    nationality: '',
    dob: '',
  });

  const [alerts, setAlerts] = useState({
    email: true,
    whatsapp: false,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchParentProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile || profileSettings) {
      setForm({
        name: profile?.name || '',
        email: profile?.email || '',
        phoneNumber: profile?.phone || profileSettings?.phoneNumber || '',
        gender: profileSettings?.gender || '',
        nationality: profileSettings?.nationality || '',
        dob: profileSettings?.dob ? profileSettings.dob.split('T')[0] : '',
      });
    }

    if (profileSettings) {
      setAlerts({
        email: profileSettings?.emailAlerts ?? true,
        whatsapp: profileSettings?.whatsappAlerts ?? false,
      });
    }
  }, [profile, profileSettings]);

  const handleTextChange = (key: string, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const toggleAlert = async (key: 'email' | 'whatsapp') => {
    const updated = {
      ...alerts,
      [key]: !alerts[key],
    };
    setAlerts(updated);

    try {
      await dispatch(
        updateParentPreferences({
          emailAlerts: updated.email,
          whatsappAlerts: updated.whatsapp,
        })
      ).unwrap();
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to update alert preferences');
      setAlerts(alerts); // revert
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await dispatch(updateParentProfile(form)).unwrap();
      Alert.alert('Success', 'Profile updated successfully!');
      dispatch(fetchParentProfile());
    } catch (err: any) {
      Alert.alert('Error', err || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout Session', 'Are you sure you want to sign out from your account?', [
      { text: 'Stay Logged In', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser()) },
    ]);
  };

  const childName = children?.[0]?.name || '—';

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Settings"
          subtitle="Manage your profile & notifications"
          showBack={navigation?.canGoBack ? navigation.canGoBack() : false}
          onBack={() => navigation?.goBack?.()}
        />

        {/* ─── Profile Details Card ─── */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeaderTitle}>Basic Details</Text>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(txt) => handleTextChange('name', txt)}
              placeholder="Your full name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Child Relation (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Father / Guardian of</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={childName}
              editable={false}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(txt) => handleTextChange('email', txt)}
              placeholder="Email address"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={form.phoneNumber}
              onChangeText={(txt) => handleTextChange('phoneNumber', txt)}
              placeholder="Phone number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <TextInput
              style={styles.input}
              value={form.gender}
              onChangeText={(txt) => handleTextChange('gender', txt)}
              placeholder="Gender (e.g. Male, Female)"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Nationality */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nationality</Text>
            <TextInput
              style={styles.input}
              value={form.nationality}
              onChangeText={(txt) => handleTextChange('nationality', txt)}
              placeholder="Nationality"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* DOB */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.dob}
              onChangeText={(txt) => handleTextChange('dob', txt)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveProfile}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Save size={16} color="#FFF" />
                <Text style={styles.saveBtnText}>Save Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ─── Alert Channels Card ─── */}
        <View style={styles.formCard}>
          <Text style={styles.cardHeaderTitle}>Alert Channels</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Email Notifications</Text>
              <Text style={styles.switchSub}>Receive attendance and exam reports via email</Text>
            </View>
            <Switch
              value={alerts.email}
              onValueChange={() => toggleAlert('email')}
              trackColor={{ false: '#CBD5E1', true: '#54A39A' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>WhatsApp Alerts</Text>
              <Text style={styles.switchSub}>Receive instant notifications on WhatsApp</Text>
            </View>
            <Switch
              value={alerts.whatsapp}
              onValueChange={() => toggleAlert('whatsapp')}
              trackColor={{ false: '#CBD5E1', true: '#54A39A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ─── Privacy Policy Button ─── */}
        <TouchableOpacity
          style={styles.legalBtn}
          onPress={() => Linking.openURL('https://www.app.edorapad.com/privacy-policy')}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={18} color="#2A5C55" />
            <Text style={styles.legalBtnText}>Privacy Policy &amp; Data Rights</Text>
          </View>
          <ExternalLink size={16} color="#64748B" />
        </TouchableOpacity>

        {/* ─── Logout Session Button ─── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutBtnText}>Logout Session</Text>
          <LogOut size={18} color="#EF4444" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C2D1CD',
    marginBottom: THEME.spacing.md,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#295651',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  saveBtn: {
    backgroundColor: '#54A39A',
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(41, 86, 81, 0.12)',
  },
  switchLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  legalBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  legalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  logoutBtn: {
    backgroundColor: '#DEE6E4',
    borderRadius: THEME.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C2D1CD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B91C1C',
  },
});
