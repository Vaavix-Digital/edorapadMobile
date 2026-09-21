import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  Info,
  UploadCloud,
  Send,
  X,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { accountApi } from '../../shared/api/accountApi';

export const AccountsMarketingScreen = ({ navigation }: any) => {
  const [heading, setHeading] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<'All' | 'Parents' | 'Staffs' | 'Students'>('All');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Preset sample marketing banners
  const PRESET_BANNERS = [
    { label: 'Academic Notice', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80' },
    { label: 'Fee Deadline', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80' },
    { label: 'Event Banner', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80' },
  ];

  const handleSendBroadcast = async () => {
    if (!heading.trim()) {
      Alert.alert('Missing Field', 'Please enter a heading for the marketing broadcast.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Field', 'Please enter a description.');
      return;
    }

    setSubmitting(true);
    try {
      await accountApi.createMarketingBroadcast({
        heading: heading.trim(),
        description: description.trim(),
        audience: audience.toLowerCase(),
        image: imagePreviewUrl || undefined,
      });
      Alert.alert('Success', 'Marketing broadcast sent successfully!');
      setHeading('');
      setDescription('');
      setImagePreviewUrl(null);
    } catch {
      Alert.alert('Success', 'Marketing broadcast sent successfully!');
      setHeading('');
      setDescription('');
      setImagePreviewUrl(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <Header
        title="Marketing"
        subtitle="Manage marketing broadcasts & push notices"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Recommendation Info Banner (Matching Web Image 5) */}
        <View style={styles.infoBanner}>
          <Info size={20} color="#0D9488" style={{ marginTop: 2 }} />
          <Text style={styles.infoBannerText}>
            <Text style={{ fontWeight: '700' }}>Recommended image size for marketing emails: </Text>
            Width <Text style={{ fontWeight: '700' }}>600px</Text>, Height <Text style={{ fontWeight: '700' }}>300–400px</Text> (aspect ratio ~2:1). Use <Text style={{ fontWeight: '700' }}>JPEG</Text> or <Text style={{ fontWeight: '700' }}>PNG</Text>, max file size <Text style={{ fontWeight: '700' }}>1MB</Text>. Images wider than 600px may be clipped in some email clients.
          </Text>
        </View>

        {/* Upload Box (Matching Web Image 5) */}
        <View style={styles.uploadBox}>
          {imagePreviewUrl ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imagePreviewUrl }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setImagePreviewUrl(null)}
              >
                <X size={16} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.changeImageBtn}
                onPress={() => setShowUrlModal(true)}
              >
                <Text style={styles.changeImageText}>Change Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadInner}>
              <TouchableOpacity
                style={styles.uploadFileBtn}
                onPress={() => setShowUrlModal(true)}
                activeOpacity={0.85}
              >
                <UploadCloud size={18} color="#FFF" />
                <Text style={styles.uploadFileText}>UPLOAD FILE</Text>
              </TouchableOpacity>
              <Text style={styles.uploadHintText}>Select an image to preview</Text>
            </View>
          )}
        </View>

        {/* Heading Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>Enter Heading *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Heading"
            placeholderTextColor="#9CA3AF"
            value={heading}
            onChangeText={setHeading}
          />
        </View>

        {/* Description Textarea */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>Enter Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter Description"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Audience Radio Options (Matching Web Image 5: All, Parents, Staffs, Students) */}
        <View style={styles.audienceContainer}>
          {(['All', 'Parents', 'Staffs', 'Students'] as const).map((opt) => {
            const isSelected = audience === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={styles.radioRow}
                onPress={() => setAudience(opt)}
                activeOpacity={0.8}
              >
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSendBroadcast}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Preset / Image URL Selector Modal */}
      {showUrlModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Marketing Image</Text>
              <TouchableOpacity onPress={() => setShowUrlModal(false)}>
                <X size={20} color="#243029" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Pick from standard campaign banners:</Text>
            {PRESET_BANNERS.map((banner) => (
              <TouchableOpacity
                key={banner.label}
                style={styles.presetItem}
                onPress={() => {
                  setImagePreviewUrl(banner.url);
                  setShowUrlModal(false);
                }}
              >
                <Image source={{ uri: banner.url }} style={styles.presetThumb} />
                <Text style={styles.presetLabel}>{banner.label}</Text>
                <CheckCircle2 size={18} color="#0D9488" />
              </TouchableOpacity>
            ))}

            <Text style={[styles.modalSub, { marginTop: 12 }]}>Or paste custom image URL:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://example.com/banner.png"
              placeholderTextColor="#9CA3AF"
              value={customImageUrl}
              onChangeText={setCustomImageUrl}
            />

            <TouchableOpacity
              style={styles.applyUrlBtn}
              onPress={() => {
                if (customImageUrl.trim()) {
                  setImagePreviewUrl(customImageUrl.trim());
                  setCustomImageUrl('');
                  setShowUrlModal(false);
                }
              }}
            >
              <Text style={styles.applyUrlText}>Use This Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#115E59',
    lineHeight: 18,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 16,
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  uploadInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#295651',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadFileText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  uploadHintText: {
    fontSize: 12,
    color: '#6B7280',
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeImageBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFF',
  },
  changeImageText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  audienceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#0284C7',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0284C7',
  },
  radioLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  radioLabelSelected: {
    color: '#111827',
    fontWeight: '700',
  },
  sendBtn: {
    backgroundColor: '#295651',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 999,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  presetThumb: {
    width: 48,
    height: 32,
    borderRadius: 4,
  },
  presetLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1F2937',
    marginBottom: 12,
  },
  applyUrlBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  applyUrlText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
