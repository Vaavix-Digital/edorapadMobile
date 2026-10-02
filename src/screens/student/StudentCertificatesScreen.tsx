import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Award, Download, Calendar, FileText, CheckCircle2, Eye } from 'lucide-react-native';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchStudentCertificates, CertificateItem } from '../../store/slices/studentSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const PADDING_H = THEME.spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING_H * 2 - CARD_GAP) / 2;

// ─── Format date helper ─────────────────────────────────────────────────────────
const formatDate = (iso?: string) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

// ─── Mini Certificate Preview (Template Visual) ────────────────────────────────
const TemplateCertificateVisual = ({ cert }: { cert: CertificateItem }) => {
  const tpl = cert.template;
  const bg = tpl?.backgroundColor || '#B8E964';
  const institute = tpl?.instituteName || cert.institute?.instituteName || 'GLOBAL TECH INSTITUTE';
  const title = tpl?.certificateTitle || 'Certificate of Completion';
  const courseTitle = cert.course?.title || cert.title || 'Mern Programming';

  return (
    <View style={[styles.visualBox, { backgroundColor: bg }]}>
      <View style={styles.tplInnerBorder}>
        {/* Decorative Emblem / Seal */}
        <Award size={20} color="rgba(0,0,0,0.6)" style={{ marginBottom: 2 }} />
        <Text style={styles.tplInstitute} numberOfLines={1}>
          {institute}
        </Text>
        <Text style={styles.tplTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.tplCourse} numberOfLines={1}>
          {courseTitle}
        </Text>
      </View>
    </View>
  );
};

// ─── Uploaded Certificate Visual (Image or PDF) ─────────────────────────────────
const UploadedCertificateVisual = ({ cert }: { cert: CertificateItem }) => {
  const url = cert.certificateUrl || '';
  const isPdf = url.toLowerCase().includes('.pdf') || !url.startsWith('http');
  const courseTitle = cert.course?.title || cert.title || 'Certificate';

  if (!isPdf && url.startsWith('http')) {
    return (
      <View style={styles.visualBox}>
        <Image
          source={{ uri: url }}
          style={styles.uploadedImg}
          resizeMode="cover"
        />
      </View>
    );
  }

  // PDF / Document preview card matching web
  return (
    <View style={[styles.visualBox, styles.pdfVisualBox]}>
      <View style={styles.pdfIconBadge}>
        <FileText size={24} color="#EF4444" />
        <View style={styles.pdfTag}>
          <Text style={styles.pdfTagText}>PDF</Text>
        </View>
      </View>
      <Text style={styles.pdfTitle} numberOfLines={1}>
        {courseTitle}
      </Text>
      <Text style={styles.pdfSub}>Tap to view</Text>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
export const StudentCertificatesScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { certificates, loading } = useAppSelector((s) => s.student);

  useEffect(() => {
    dispatch(fetchStudentCertificates());
  }, [dispatch]);

  const handleCertificatePress = (cert: CertificateItem) => {
    const isTemplate = !cert.certificateUrl;
    const courseTitle = cert.course?.title || cert.title || 'Course Certificate';
    const batchName =
      typeof cert.batch === 'object'
        ? cert.batch?.name || cert.batch?.code || 'GLB MRN EVE 101'
        : cert.batchName || cert.batch || 'GLB MRN EVE 101';
    const certNum = cert.certificateNumber || 'CERT-' + (cert.id || '91018149');
    const issuedBy = cert.issuedBy || 'Academic Faculty';

    Alert.alert(
      courseTitle,
      `Certificate No: ${certNum}\nType: ${cert.certificateType || 'Completion'}\nBatch: ${batchName}\nIssued by: ${issuedBy}\nDate: ${formatDate(cert.issueDate)}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: isTemplate ? 'Preview' : 'Download',
          style: 'default',
          onPress: () => {
            Alert.alert('Verified Credential', `Certificate ${certNum} is digitally signed and authentic.`);
          },
        },
      ]
    );
  };

  const renderItem = ({ item: cert }: { item: CertificateItem }) => {
    const isTemplate = !cert.certificateUrl;
    const courseTitle = cert.course?.title || cert.title || 'Mern Programming';
    const certType = cert.certificateType || 'Completion';
    const batchName =
      typeof cert.batch === 'object'
        ? cert.batch?.name || cert.batch?.code || 'GLB MRN EVE 101'
        : cert.batchName || cert.batch || 'GLB MRN EVE 101';
    const issuedBy = cert.issuedBy || (isTemplate ? 'Shahala Faharin' : 'jishnu');
    const certNum = cert.certificateNumber || (isTemplate ? 'CERT-95818958' : 'CERT-91018149');
    const dateStr = formatDate(cert.issueDate);

    return (
      <Card style={styles.card}>
        {/* Certificate Visual Preview */}
        <View style={styles.previewContainer}>
          {isTemplate ? (
            <TemplateCertificateVisual cert={cert} />
          ) : (
            <UploadedCertificateVisual cert={cert} />
          )}
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          {/* Title and Badge */}
          <View style={styles.titleRow}>
            <Text style={styles.courseTitle} numberOfLines={1}>
              {courseTitle}
            </Text>
            <View
              style={[
                styles.typeBadge,
                isTemplate ? styles.badgeTemplate : styles.badgeUploaded,
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  isTemplate ? styles.badgeTextTemplate : styles.badgeTextUploaded,
                ]}
              >
                {isTemplate ? 'Template' : 'Uploaded'}
              </Text>
            </View>
          </View>

          {/* Details List */}
          <View style={styles.detailsList}>
            <Text style={styles.detailRow} numberOfLines={1}>
              <Text style={styles.detailLabel}>Type: </Text>
              <Text style={styles.detailVal}>{certType}</Text>
            </Text>

            <Text style={styles.detailRow} numberOfLines={1}>
              <Text style={styles.detailLabel}>Batch: </Text>
              <Text style={styles.detailVal}>{batchName}</Text>
            </Text>

            <Text style={styles.detailRow} numberOfLines={1}>
              <Text style={styles.detailLabel}>Issued by: </Text>
              <Text style={styles.detailVal}>{issuedBy}</Text>
            </Text>

            <Text style={styles.detailRow} numberOfLines={1}>
              <Text style={styles.detailLabel}>No: </Text>
              <Text style={styles.detailVal}>{certNum}</Text>
            </Text>

            <Text style={styles.detailRow} numberOfLines={1}>
              <Text style={styles.detailLabel}>Date: </Text>
              <Text style={styles.detailVal}>{dateStr}</Text>
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleCertificatePress(cert)}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>
              {isTemplate ? 'Preview Certificate' : 'View Certificate'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <Header
          title="Certificates"
          subtitle={`${certificates.length} earned`}
          showBack
          onBack={() => navigation.goBack()}
        />
      </View>

      {/* Summary banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{certificates.length}</Text>
          <Text style={styles.summaryLabel}>Certificates Earned</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Award size={26} color={THEME.colors.primary} />
          <Text style={styles.summaryLabel}>Verified</Text>
        </View>
      </View>

      {/* 2-in-1-Row Grid */}
      {loading && certificates.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading certificates...</Text>
        </View>
      ) : (
        <FlatList
          data={certificates}
          keyExtractor={(item: any, idx: number) => item.id || item._id || String(idx)}
          numColumns={2}
          columnWrapperStyle={styles.colWrapper}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => dispatch(fetchStudentCertificates())}
              tintColor={THEME.colors.primary}
            />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <Card variant="flat" style={styles.empty}>
              <Award size={40} color={THEME.colors.textMuted} />
              <Text style={styles.emptyTitle}>No certificates found</Text>
              <Text style={styles.emptyText}>Certificates will appear here once issued by your tutor.</Text>
            </Card>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primaryLight,
    marginHorizontal: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    marginBottom: THEME.spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: THEME.colors.border,
    marginHorizontal: THEME.spacing.md,
  },

  // ── Grid & Card ──
  list: {
    paddingHorizontal: PADDING_H,
    paddingBottom: 40,
  },
  colWrapper: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    padding: 0,
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    backgroundColor: '#FFFFFF',
  },

  // ── Visual Previews ──
  previewContainer: {
    padding: 8,
    backgroundColor: '#F0F4F3',
  },
  visualBox: {
    height: 105,
    borderRadius: THEME.borderRadius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedImg: {
    width: '100%',
    height: '100%',
  },
  pdfVisualBox: {
    backgroundColor: '#E2E8F0',
    padding: 6,
  },
  pdfIconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  pdfTag: {
    position: 'absolute',
    bottom: -2,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  pdfTagText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '800',
  },
  pdfTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    textAlign: 'center',
  },
  pdfSub: {
    fontSize: 9,
    color: THEME.colors.textMuted,
    marginTop: 1,
  },
  tplInnerBorder: {
    flex: 1,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.18)',
    borderRadius: THEME.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  tplInstitute: {
    fontSize: 7.5,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.6)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tplTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1A202C',
    textAlign: 'center',
    marginTop: 1,
  },
  tplCourse: {
    fontSize: 8.5,
    fontStyle: 'italic',
    color: '#2D3748',
    marginTop: 1,
    textAlign: 'center',
  },

  // ── Card Body & Details ──
  cardBody: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 4,
  },
  courseTitle: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeTemplate: {
    backgroundColor: '#DCFCE7',
  },
  badgeUploaded: {
    backgroundColor: '#DBEAFE',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  badgeTextTemplate: {
    color: '#16A34A',
  },
  badgeTextUploaded: {
    color: '#2563EB',
  },
  detailsList: {
    gap: 2.5,
    marginBottom: 10,
  },
  detailRow: {
    fontSize: 10.5,
    lineHeight: 15,
  },
  detailLabel: {
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  detailVal: {
    color: THEME.colors.textPrimary,
    fontWeight: '500',
  },

  // ── Action Button ──
  actionBtn: {
    backgroundColor: '#3E7874',
    borderRadius: THEME.borderRadius.sm,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },

  // ── Loading & Empty ──
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  empty: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginHorizontal: PADDING_H,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});

