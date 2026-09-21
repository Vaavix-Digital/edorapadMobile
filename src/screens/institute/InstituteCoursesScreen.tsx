import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Star,
  Home,
  ChevronRight,
  PlayCircle,
  X,
  BookOpen,
  Users,
  Clock,
  Video,
  Layers,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Header } from '../../components/common/Header';
import { THEME } from '../../shared/constants/theme';
import { RootState, AppDispatch } from '../../store';
import { fetchInstituteCourses } from '../../store/slices/instituteSlice';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

const fallbackImages: Record<string, string> = {
  food: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
  java: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
  marketing: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
  mern: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
};

const getFallbackImage = (title: string = '') => {
  const t = title.toLowerCase();
  if (t.includes('food') || t.includes('beverage')) return fallbackImages.food;
  if (t.includes('java')) return fallbackImages.java;
  if (t.includes('market')) return fallbackImages.marketing;
  if (t.includes('mern') || t.includes('react') || t.includes('web')) return fallbackImages.mern;
  return fallbackImages.default;
};

const defaultCoursesList = [
  {
    id: 'course-1',
    title: 'Food & Beverage Management',
    price: 951,
    description: 'Course Description: This course provides a practical introduction to the food and beverage...',
    thumbnailUrl: fallbackImages.food,
    averageRating: 0.0,
    ratingCount: 0,
    liveClassesCount: 8,
    department: 'Hospitality Management',
    duration: '6 Months',
    enrolledStudents: 8,
  },
  {
    id: 'course-2',
    title: 'Professional Java Development Course',
    price: 76071,
    description: 'Learn Java programming from basics to advanced concepts with structured payments and hands-...',
    thumbnailUrl: fallbackImages.java,
    averageRating: 0.0,
    ratingCount: 0,
    liveClassesCount: 8,
    department: 'Computer Science',
    duration: '6 Months',
    enrolledStudents: 24,
  },
  {
    id: 'course-3',
    title: 'Professional Marketing Course',
    price: 57053,
    description: 'Learn marketing with fixed payment dates.',
    thumbnailUrl: fallbackImages.marketing,
    averageRating: 4.0,
    ratingCount: 1,
    liveClassesCount: 8,
    department: 'Business & Management',
    duration: '3 Months',
    enrolledStudents: 12,
  },
  {
    id: 'course-4',
    title: 'Mern Programming',
    price: 4754,
    description: 'Master Mernfrom scratch — build logic, projects, and real-world applications.',
    thumbnailUrl: fallbackImages.mern,
    averageRating: 5.0,
    ratingCount: 1,
    liveClassesCount: 8,
    department: 'Web Engineering',
    duration: '4 Months',
    enrolledStudents: 18,
  },
];

export const InstituteCoursesScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { courses, loading } = useSelector((state: RootState) => state.institute);

  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchInstituteCourses());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchInstituteCourses());
    setRefreshing(false);
  };

  const rawCourses = courses && courses.length > 0 ? courses : defaultCoursesList;

  const filteredCourses = useMemo(() => {
    if (!rawCourses || !Array.isArray(rawCourses)) return [];
    return rawCourses.filter((c: any) => {
      const title = (c.title || c.name || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const q = searchTerm.toLowerCase().trim();
      return !q || title.includes(q) || desc.includes(q);
    });
  }, [rawCourses, searchTerm]);

  const formatPrice = (price: any) => {
    if (price === undefined || price === null) return '₹0';
    const num = typeof price === 'number' ? price : Number(String(price).replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return String(price);
    return '₹' + num.toLocaleString('en-IN');
  };

  return (
    <ScreenContainer>
      <Header
        title="Courses"
        subtitle="Manage institute curriculum & syllabus"
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Breadcrumb */}
      <View style={styles.breadcrumbRow}>
        <Home size={13} color="#64748B" />
        <ChevronRight size={13} color="#94A3B8" />
        <Text style={styles.breadcrumbText}>Courses</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color="#94A3B8" style={styles.searchLeftIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.85}>
          <Search size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 2-Column Grid List */}
      {loading && !refreshing && courses.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Loading course catalog...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item: any, idx: number) => item.id || item._id || String(idx)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F766E']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No courses found</Text>
              <Text style={styles.emptySubtitle}>Try changing your search term</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            const imageUri = item.thumbnailUrl || item.thumbnail || item.image || getFallbackImage(item.title);
            const rating = Number(item.averageRating || 0).toFixed(1);
            const ratingCount = item.ratingCount || 0;
            const liveClassCount = item.liveClassesCount || '08';

            return (
              <View style={styles.cardContainer}>
                {/* Image Section */}
                <View style={styles.imageBox}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.courseImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imageFallback}>
                      <PlayCircle size={40} color="#CBD5E1" />
                    </View>
                  )}

                  {/* Rating Badge */}
                  <View style={styles.ratingBadge}>
                    <Star size={11} color="#FACC15" fill="#FACC15" />
                    <Text style={styles.ratingText}>
                      {rating} ({ratingCount})
                    </Text>
                  </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoBox}>
                  <View style={styles.titlePriceRow}>
                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {item.title || item.name}
                    </Text>
                    <Text style={styles.coursePrice}>
                      {formatPrice(item.price)}
                    </Text>
                  </View>

                  <Text style={styles.courseDesc} numberOfLines={2}>
                    {item.description || 'Master coding from scratch — build logic, projects, and real-world applications.'}
                  </Text>

                  {/* Live Class Row */}
                  <View style={styles.liveClassRow}>
                    <Text style={styles.liveClassLabel}>Live Class</Text>
                    <Text style={styles.liveClassVal}>{liveClassCount}</Text>
                  </View>

                  {/* View Button */}
                  <TouchableOpacity
                    style={styles.viewBtn}
                    activeOpacity={0.8}
                    onPress={() => setSelectedCourse(item)}
                  >
                    <Text style={styles.viewBtnText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Course Details Modal */}
      <Modal
        visible={!!selectedCourse}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedCourse(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCourse && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle} numberOfLines={2}>
                      {selectedCourse.title}
                    </Text>
                    <Text style={styles.modalPrice}>
                      {formatPrice(selectedCourse.price)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedCourse(null)}
                  >
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                  {/* Modal Banner Image */}
                  <Image
                    source={{
                      uri: selectedCourse.thumbnailUrl || selectedCourse.thumbnail || getFallbackImage(selectedCourse.title),
                    }}
                    style={styles.modalBannerImage}
                    resizeMode="cover"
                  />

                  {/* Description Section */}
                  <View style={styles.modalCard}>
                    <Text style={styles.modalSectionTitle}>Overview</Text>
                    <Text style={styles.modalDescText}>
                      {selectedCourse.description || 'Master the curriculum with hands-on labs, live mentoring, and industry-standard projects.'}
                    </Text>
                  </View>

                  {/* Stats Grid */}
                  <View style={styles.modalGrid}>
                    <View style={styles.modalStatItem}>
                      <Video size={16} color="#0F766E" />
                      <Text style={styles.modalStatLabel}>Live Sessions</Text>
                      <Text style={styles.modalStatValue}>{selectedCourse.liveClassesCount || '08'}</Text>
                    </View>

                    <View style={styles.modalStatItem}>
                      <Clock size={16} color="#0F766E" />
                      <Text style={styles.modalStatLabel}>Duration</Text>
                      <Text style={styles.modalStatValue}>{selectedCourse.duration || '6 Months'}</Text>
                    </View>

                    <View style={styles.modalStatItem}>
                      <Layers size={16} color="#0F766E" />
                      <Text style={styles.modalStatLabel}>Batches</Text>
                      <Text style={styles.modalStatValue}>2 Batches</Text>
                    </View>

                    <View style={styles.modalStatItem}>
                      <Users size={16} color="#0F766E" />
                      <Text style={styles.modalStatLabel}>Students</Text>
                      <Text style={styles.modalStatValue}>{selectedCourse.enrolledStudents || 18}</Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Modal Footer Button */}
                <TouchableOpacity
                  style={styles.modalCloseDoneBtn}
                  activeOpacity={0.85}
                  onPress={() => setSelectedCourse(null)}
                >
                  <Text style={styles.modalCloseDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchLeftIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    paddingVertical: 0,
  },
  searchBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#54A39A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 28,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#DEE6E4',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  imageBox: {
    width: '100%',
    height: 115,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  titlePriceRow: {
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 16,
    marginBottom: 2,
  },
  coursePrice: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 2,
  },
  courseDesc: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
    marginBottom: 8,
  },
  liveClassRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  liveClassLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  liveClassVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewBtn: {
    backgroundColor: '#457E77',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    gap: 12,
    paddingBottom: 20,
  },
  modalBannerImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  modalDescText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalStatItem: {
    width: (SCREEN_WIDTH - 56) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 3,
  },
  modalStatLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  modalStatValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseDoneBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalCloseDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
