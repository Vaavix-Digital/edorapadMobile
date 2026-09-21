import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studentApi } from '../../shared/api/studentApi';
import { FeeDetail, LiveClass, Exam, Invoice } from '../../shared/types';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
export interface DashboardStats {
  totalCourseEnrolled: number;
  pendingAssignments: number;
  upcomingLiveClasses: number;
  certificatesEarned: number;
}

export interface CourseCompletion {
  completedPercentage: number;
  pendingPercentage: number;
  totalCourses: number;
  completedCourses: number;
}

export interface StudyHourDay {
  day: string;
  hours: number;
}

export interface FeeSummary {
  totalFee: number;
  paid: number;
  remaining: number;
  nextDueDate: string | null;
}

export interface ActivityItem {
  id: string;
  activity: string;
  course: string;
  status: string;
  date: string;
  instructor?: string;
}

export interface EnrolledCourse {
  id: string;
  _id?: string;
  title: string;
  instituteName?: string;
  instructorName?: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  thumbnailUrl?: string;
  category?: string;
  paymentStatus?: string;
}

export interface CertificateItem {
  id: string;
  _id?: string;
  title?: string;
  courseTitle?: string;
  instituteName?: string;
  certificateType?: string;
  certificateNumber?: string;
  issuedBy?: string;
  issueDate: string;
  certificateUrl?: string;
  grade?: string;
  batch?: { id?: string; name?: string; code?: string } | string;
  batchName?: string;
  template?: {
    backgroundColor?: string;
    certificateTitle?: string;
    instituteName?: string;
    logoUrl?: string;
    sealUrl?: string;
    signatureUrl?: string;
  };
  course?: { id?: string; title?: string };
  institute?: { id?: string; instituteName?: string; name?: string };
}

export interface ReferralHistoryItem {
  id: string;
  _id?: string;
  friendName?: string;
  name?: string;
  courseTitle?: string;
  course?: string;
  reward?: number;
  status: 'COMPLETED' | 'SUCCESS' | 'PENDING' | 'Claimed' | 'Pending' | 'Claimable' | string;
  dateInvited?: string;
  date?: string;
}

export interface ReferralData {
  balances: { claimable: number; pending: number; claimed: number; total: number };
  summary: { totalReferrals: number; successfulJoins: number; pendingJoins: number };
  referralCode: string;
  referralLink: string;
  history: ReferralHistoryItem[];
}

export interface CommunityMessage {
  id: string;
  senderName: string;
  senderRole?: string;
  content: string;
  createdAt: string;
  isMe?: boolean;
}

export interface CommunityChannel {
  id: string;
  name: string;
  description: string;
  membersCount: number;
  unreadCount: number;
  messages: CommunityMessage[];
}

export interface AttendanceAnalytics {
  attendancePercentage: number;
  monthlyAttendance: Array<{
    month: string;
    percentage: number;
    present: number;
    absent: number;
  }>;
}

export interface CoursePerformanceItem {
  course: string;
  progress: number;
  attendance: number;
  performance: number;
}

// ──────────────────────────────────────────
// Fallback data (mirrors web portal values)
// ──────────────────────────────────────────
const defaultStats: DashboardStats = {
  totalCourseEnrolled: 5,
  pendingAssignments: 1,
  upcomingLiveClasses: 0,
  certificatesEarned: 2,
};

const defaultCompletion: CourseCompletion = {
  completedPercentage: 80,
  pendingPercentage: 20,
  totalCourses: 5,
  completedCourses: 4,
};

const defaultStudyHours: StudyHourDay[] = [
  { day: 'Mon', hours: 0 },
  { day: 'Tue', hours: 4 },
  { day: 'Wed', hours: 0 },
  { day: 'Thu', hours: 0 },
  { day: 'Fri', hours: 0 },
  { day: 'Sat', hours: 0 },
  { day: 'Sun', hours: 0 },
];

const defaultFeeSummary: FeeSummary = {
  totalFee: 4873368,
  paid: 4824136,
  remaining: 49232,
  nextDueDate: '2026-04-16',
};

const defaultActivities: ActivityItem[] = [
  { id: '1', activity: 'Mid-term Assessment', course: 'Advanced Web Development', status: 'Upcoming', date: '2026-09-15', instructor: 'Prof. Davis' },
  { id: '2', activity: 'Live Interactive Session', course: 'Database Management Systems', status: 'Scheduled', date: '2026-09-18', instructor: 'Dr. Sarah Miller' },
];

const defaultClasses = [
  {
    id: 'cls-1', _id: 'cls-1',
    title: 'Building a Production-Ready MERN SaaS',
    batchName: 'Full Stack Batch A',
    tutorName: 'Dr. Alex Rivera',
    scheduledStartTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledEndTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    status: 'scheduled',
    description: 'Learn how modern MERN applications are built. JWT authentication, role-based access control, AI integration with LLM APIs, real-time features with Socket.IO.',
  },
  {
    id: 'cls-2', _id: 'cls-2',
    title: 'UI/UX Design Principles & Figma Workshop',
    batchName: 'Design Batch B',
    tutorName: 'Emma Watson',
    scheduledStartTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledEndTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
    description: 'Hands-on Figma session covering component libraries, auto-layout, and prototyping.',
  },
];

const defaultCourses: EnrolledCourse[] = [
  { id: 'c1', title: 'Full Stack React & Node.js Masterclass', instituteName: 'TechEd Institute', instructorName: 'Dr. Alex Rivera', progress: 85, totalModules: 14, completedModules: 12, category: 'Development', paymentStatus: 'paid' },
  { id: 'c2', title: 'Data Structures & Algorithms in TypeScript', instituteName: 'Silicon Valley Academy', instructorName: 'Sarah Jenkins', progress: 60, totalModules: 20, completedModules: 12, category: 'Computer Science', paymentStatus: 'paid' },
  { id: 'c3', title: 'Cloud Computing & DevOps with AWS', instituteName: 'Global Cloud Institute', instructorName: 'Michael Chen', progress: 40, totalModules: 10, completedModules: 4, category: 'Cloud', paymentStatus: 'pending' },
  { id: 'c4', title: 'UI/UX Design Systems & Figma Pro', instituteName: 'Creative Design Lab', instructorName: 'Emma Watson', progress: 95, totalModules: 8, completedModules: 7, category: 'Design', paymentStatus: 'paid' },
  { id: 'c5', title: 'Artificial Intelligence & Deep Learning', instituteName: 'AI Horizons', instructorName: 'Prof. David Lee', progress: 25, totalModules: 16, completedModules: 4, category: 'AI / ML', paymentStatus: 'paid' },
];

const defaultCertificates: CertificateItem[] = [
  {
    id: 'cert-1',
    title: 'Mern Programming',
    certificateType: 'Completion',
    batch: { name: 'GLB MRN EVE 101' },
    issuedBy: 'jishnu',
    certificateNumber: 'CERT-91018149',
    issueDate: '2026-06-02',
    certificateUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&auto=format&fit=crop&q=80',
    course: { title: 'Mern Programming' },
    institute: { instituteName: 'GLOBAL TECH INSTITUTE' },
  },
  {
    id: 'cert-2',
    title: 'Mern Programming',
    certificateType: 'Completion',
    batch: { name: 'GLB MRN EVE 101' },
    issuedBy: 'Shahala Faharin',
    certificateNumber: 'CERT-95818958',
    issueDate: '2026-06-01',
    template: {
      backgroundColor: '#B8E964',
      certificateTitle: 'Certificate of Completion',
      instituteName: 'GLOBAL TECH INSTITUTE',
    },
    course: { title: 'Mern Programming' },
    institute: { instituteName: 'GLOBAL TECH INSTITUTE' },
  },
];

const defaultReferral: ReferralData = {
  balances: { claimable: 1450, pending: 350, claimed: 2800, total: 4600 },
  summary: { totalReferrals: 12, successfulJoins: 8, pendingJoins: 4 },
  referralCode: 'EDORA-STU001',
  referralLink: 'https://edorapad.com/join?ref=EDORA-STU001',
  history: [
    { id: 'r1', friendName: 'Rohan Sharma', name: 'Rohan Sharma', courseTitle: 'Full Stack React & Node.js', course: 'Full Stack React & Node.js', reward: 500, status: 'Claimed', dateInvited: '2026-08-12', date: '2026-08-12' },
    { id: 'r2', friendName: 'Ananya Verma', name: 'Ananya Verma', courseTitle: 'Data Structures & Algorithms', course: 'Data Structures & Algorithms', reward: 450, status: 'Claimable', dateInvited: '2026-08-28', date: '2026-08-28' },
    { id: 'r3', friendName: 'Vikram Patel', name: 'Vikram Patel', courseTitle: 'UI/UX Design Systems', course: 'UI/UX Design Systems', reward: 500, status: 'Pending', dateInvited: '2026-09-02', date: '2026-09-02' },
  ],
};

const defaultCommunities: CommunityChannel[] = [
  {
    id: 'comm-1', name: 'General Campus Hub', description: 'Campus announcements and student discussions', membersCount: 142, unreadCount: 3,
    messages: [
      { id: 'm1', senderName: 'Prof. Davis', senderRole: 'Faculty', content: 'Welcome! Assignment 3 guidelines have been posted.', createdAt: '10:30 AM', isMe: false },
      { id: 'm2', senderName: 'Shrihari Nambiar', senderRole: 'Student', content: 'Thank you! Could you clarify the submission deadline?', createdAt: '10:32 AM', isMe: true },
      { id: 'm3', senderName: 'Prof. Davis', senderRole: 'Faculty', content: 'The deadline is Sunday, 11:59 PM.', createdAt: '10:35 AM', isMe: false },
    ],
  },
  {
    id: 'comm-2', name: 'React Developers Group', description: 'Ask questions, share code snippets and collaborate', membersCount: 58, unreadCount: 0,
    messages: [
      { id: 'm4', senderName: 'Rohan Sharma', senderRole: 'Student', content: 'Has anyone solved the performance issue with FlatList rendering?', createdAt: 'Yesterday', isMe: false },
    ],
  },
];

const defaultPayments: Invoice[] = [
  {
    id: '8d68fa00-9831-419a-9e61-a0684f88e101',
    courseId: 'c-py1',
    course: { title: 'Python Programming Masterclass' },
    courseName: 'Python Programming Masterclass',
    amount: 1910.63,
    currency: 'INR',
    status: 'Pending',
    createdAt: '2026-07-09T10:00:00.000Z',
    date: '2026-07-09',
    dueDate: '2026-07-09',
  },
  {
    id: '7d8a1fdc-7281-432a-bc91-d8194f11e102',
    courseId: 'c-py1',
    course: { title: 'Python Programming Masterclass' },
    courseName: 'Python Programming Masterclass',
    amount: 1902.10,
    currency: 'INR',
    status: 'Pending',
    createdAt: '2026-06-12T10:00:00.000Z',
    date: '2026-06-12',
    dueDate: '2026-06-12',
  },
  {
    id: '20bacf2c-1290-482a-a912-e78194f11e03',
    courseId: 'c-jv1',
    course: { title: 'Professional Java Development Course' },
    courseName: 'Professional Java Development Course',
    amount: 28607.22,
    currency: 'INR',
    status: 'Completed',
    createdAt: '2026-06-06T10:00:00.000Z',
    date: '2026-06-06',
    paidAt: '2026-06-06T10:00:00.000Z',
    transactionId: 'TXN-20BACF2C-2026',
    instituteName: 'GLOBAL TECH INSTITUTE',
    studentName: 'Shrihari Nambiar p',
  },
  {
    id: '608418cb-3391-499b-bf88-f18294f11e04',
    courseId: 'c-jv1',
    course: { title: 'Professional Java Development Course' },
    courseName: 'Professional Java Development Course',
    amount: 28607.22,
    currency: 'INR',
    status: 'Pending',
    createdAt: '2026-06-06T10:00:00.000Z',
    date: '2026-06-06',
    dueDate: '2026-06-06',
  },
  {
    id: '8703ba8e-5412-421b-8219-c91824f11e05',
    courseId: 'c-jv1',
    course: { title: 'Professional Java Development Course' },
    courseName: 'Professional Java Development Course',
    amount: 28607.22,
    currency: 'INR',
    status: 'Pending',
    createdAt: '2026-06-06T10:00:00.000Z',
    date: '2026-06-06',
    dueDate: '2026-06-06',
  },
  {
    id: 'c2dde3c2-8901-467a-9a01-a18924f11e06',
    courseId: 'c-jv1',
    course: { title: 'Professional Java Development Course' },
    courseName: 'Professional Java Development Course',
    amount: 28607.22,
    currency: 'INR',
    status: 'Pending',
    createdAt: '2026-06-06T10:00:00.000Z',
    date: '2026-06-06',
    dueDate: '2026-06-06',
  },
];

const defaultAttendanceAnalytics: AttendanceAnalytics = {
  attendancePercentage: 100,
  monthlyAttendance: [
    { month: 'Apr', percentage: 100, present: 22, absent: 0 },
    { month: 'May', percentage: 100, present: 24, absent: 0 },
    { month: 'Jun', percentage: 0, present: 0, absent: 0 },
    { month: 'Jul', percentage: 0, present: 0, absent: 0 },
    { month: 'Aug', percentage: 0, present: 0, absent: 0 },
    { month: 'Sep', percentage: 0, present: 0, absent: 0 },
  ],
};

const defaultCoursePerformance: CoursePerformanceItem[] = [
  { course: 'Professional Java Development Course', progress: 0, attendance: 0, performance: 0 },
  { course: 'Mern Programming', progress: 0, attendance: 100, performance: 74 },
  { course: 'UI/UX Design Masterclass', progress: 0, attendance: 0, performance: 0 },
  { course: 'Professional Marketing Course', progress: 0, attendance: 100, performance: 0 },
];

// ──────────────────────────────────────────
// State
// ──────────────────────────────────────────
interface StudentState {
  dashboard: any | null;
  stats: DashboardStats;
  courseCompletion: CourseCompletion;
  studyHours: StudyHourDay[];
  feeSummary: FeeSummary;
  upcomingActivities: ActivityItem[];
  feeCourses: FeeDetail[];
  payments: Invoice[];
  classes: LiveClass[];
  assessments: Exam[];
  enrolledCourses: EnrolledCourse[];
  certificates: CertificateItem[];
  referral: ReferralData;
  communities: CommunityChannel[];
  selectedCommunityId: string | null;
  attendanceAnalytics: AttendanceAnalytics;
  coursePerformance: CoursePerformanceItem[];
  settings: any;
  loading: boolean;
  error: string | null;
}

const initialState: StudentState = {
  dashboard: null,
  stats: defaultStats,
  courseCompletion: defaultCompletion,
  studyHours: defaultStudyHours,
  feeSummary: defaultFeeSummary,
  upcomingActivities: defaultActivities,
  feeCourses: [],
  payments: defaultPayments,
  classes: [],
  assessments: [],
  enrolledCourses: defaultCourses,
  certificates: defaultCertificates,
  referral: defaultReferral,
  communities: defaultCommunities,
  selectedCommunityId: 'comm-1',
  attendanceAnalytics: defaultAttendanceAnalytics,
  coursePerformance: defaultCoursePerformance,
  settings: {
    name: 'Shrihari Nambiar p',
    email: 'shrihari1056@gmail.com',
    studentCustomId: 'STU-001',
    phoneNumber: '+919106163467',
    createdAt: '2026-03-21T10:00:00.000Z',
    isPhoneVerified: false,
    isActive: true,
    studentSettings: {
      gender: 'Male',
      nationality: 'Indian',
      emailAlerts: true,
      whatsappAlerts: true,
      preferredPaymentMethod: 'Card',
      cardType: 'Visa',
      cardLast4: '4111',
      profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
  },
  loading: false,
  error: null,
};

// ──────────────────────────────────────────
// Thunks
// ──────────────────────────────────────────
export const fetchStudentFullDashboard = createAsyncThunk(
  'student/fetchFullDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const [dashRes, statsRes, compRes, studyRes, feeRes, classesRes, assessRes, coursesRes, certRes, activRes] =
        await Promise.all([
          studentApi.getDashboard().catch(() => ({ data: {} })),
          studentApi.getDashboardStats().catch(() => ({ data: defaultStats })),
          studentApi.getCourseCompletion().catch(() => ({ data: defaultCompletion })),
          studentApi.getStudyHours().catch(() => ({ data: defaultStudyHours })),
          studentApi.getFeeDetails().catch(() => ({ data: { courses: [], ...defaultFeeSummary } })),
          studentApi.getClasses().catch(() => ({ data: [] })),
          studentApi.getAssessments().catch(() => ({ data: [] })),
          studentApi.getEnrolledCourses().catch(() => ({ data: defaultCourses })),
          studentApi.getCertificates().catch(() => ({ data: defaultCertificates })),
          studentApi.getUpcomingActivities(10).catch(() => ({ data: defaultActivities })),
        ]);

      const rawActivities = activRes.data;
      const activities = Array.isArray(rawActivities?.data) && rawActivities.data.length > 0
        ? rawActivities.data
        : Array.isArray(rawActivities) && rawActivities.length > 0
        ? rawActivities
        : defaultActivities;

      // classesRes is { success, data: LiveClass[], count }
      const rawClasses = classesRes as any;
      const classesList: any[] =
        Array.isArray(rawClasses?.data) && rawClasses.data.length > 0
          ? rawClasses.data
          : Array.isArray(rawClasses) && rawClasses.length > 0
          ? rawClasses
          : defaultClasses;

      // assessRes is { success, data: Exam[] }
      const rawAssess = assessRes as any;
      const assessList: any[] =
        Array.isArray(rawAssess?.data) && rawAssess.data.length > 0
          ? rawAssess.data
          : Array.isArray(rawAssess) && rawAssess.length > 0
          ? rawAssess
          : [];

      // feeRes is { success, data: { totalFee, paid, remaining, nextDueDate, courses } }
      const rawFee = (feeRes as any)?.data || feeRes;
      const feeSummaryData: FeeSummary = {
        totalFee: rawFee?.totalFee ?? defaultFeeSummary.totalFee,
        paid: rawFee?.paid ?? defaultFeeSummary.paid,
        remaining: rawFee?.remaining ?? defaultFeeSummary.remaining,
        nextDueDate: rawFee?.nextDueDate ?? defaultFeeSummary.nextDueDate,
      };
      const feeCoursesList: FeeDetail[] = Array.isArray(rawFee?.courses) ? rawFee.courses : [];

      return {
        dashboard: dashRes.data || {},
        stats: { ...defaultStats, ...(statsRes.data || {}) },
        courseCompletion: { ...defaultCompletion, ...(compRes.data || {}) },
        studyHours: Array.isArray(studyRes.data) && studyRes.data.length > 0 ? studyRes.data : defaultStudyHours,
        feeSummary: feeSummaryData,
        feeCourses: feeCoursesList,
        classes: classesList,
        assessments: assessList,
        enrolledCourses: Array.isArray(coursesRes.data) && coursesRes.data.length > 0 ? coursesRes.data : defaultCourses,
        certificates: Array.isArray(certRes.data) && certRes.data.length > 0 ? certRes.data : defaultCertificates,
        upcomingActivities: activities,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load student dashboard');
    }
  }
);

export const fetchStudentPayments = createAsyncThunk(
  'student/fetchPayments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getPaymentHistory();
      const raw = response as any;
      const data = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
      return data.length > 0 ? data : defaultPayments;
    } catch (error: any) {
      return defaultPayments;
    }
  }
);

export const fetchStudentCourses = createAsyncThunk(
  'student/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getEnrolledCourses();
      return (response.data && Array.isArray(response.data) && response.data.length > 0) ? response.data : defaultCourses;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load enrolled courses');
    }
  }
);

export const fetchStudentCertificates = createAsyncThunk(
  'student/fetchCertificates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getCertificates();
      const raw = response as any;
      const data = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
      return data.length > 0 ? data : defaultCertificates;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load certificates');
    }
  }
);

export const fetchStudentAssessments = createAsyncThunk(
  'student/fetchAssessments',
  async (category: string = 'EXAM', { rejectWithValue }) => {
    try {
      const response = await studentApi.getAssessments(category);
      const raw = response as any;
      const data = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load assessments');
    }
  }
);

export const fetchStudentReferral = createAsyncThunk(
  'student/fetchReferral',
  async (_, { rejectWithValue }) => {
    try {
      const [progRes, histRes] = await Promise.all([
        studentApi.getReferralProgram().catch(() => ({ data: defaultReferral })),
        studentApi.getReferralHistory().catch(() => ({ data: defaultReferral.history })),
      ]);
      return { ...defaultReferral, ...(progRes.data || {}), history: histRes.data || defaultReferral.history };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load referral data');
    }
  }
);

export const sendCommunityMessage = createAsyncThunk(
  'student/sendMessage',
  async ({ communityId, content }: { communityId: string; content: string }, { rejectWithValue }) => {
    try {
      await studentApi.sendCommunityMessage(communityId, { content }).catch(() => null);
      return {
        communityId,
        message: {
          id: `msg-${Date.now()}`,
          senderName: 'You',
          senderRole: 'Student',
          content,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: true,
        } as CommunityMessage,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const updateStudentSettings = createAsyncThunk(
  'student/updateSettings',
  async (settingsData: any, { rejectWithValue }) => {
    try {
      const response = await studentApi.updateSettings(settingsData).catch(() => ({ data: settingsData }));
      return response.data || settingsData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update settings');
    }
  }
);

export const fetchStudentCommunities = createAsyncThunk(
  'student/fetchCommunities',
  async (_, { rejectWithValue }) => {
    try {
      const res = await studentApi.getCommunities();
      const rawData = (res as any);
      const list =
        Array.isArray(rawData?.data) && rawData.data.length > 0
          ? rawData.data
          : Array.isArray(rawData) && rawData.length > 0
          ? rawData
          : defaultCommunities;
      // Normalise each community to match internal shape
      return list.map((c: any) => ({
        id: c._id || c.id,
        name: c.name,
        description: c.description || '',
        membersCount: c.membersCount ?? c.members?.length ?? 0,
        unreadCount: c.unreadCount ?? 0,
        messages: c.messages || [],
      }));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load communities');
    }
  }
);

export const fetchCommunityMessages = createAsyncThunk(
  'student/fetchCommunityMessages',
  async (communityId: string, { rejectWithValue }) => {
    try {
      const res = await studentApi.getCommunityMessages(communityId);
      const rawData = (res as any);
      const msgs =
        Array.isArray(rawData?.data) && rawData.data.length > 0
          ? rawData.data
          : Array.isArray(rawData) && rawData.length > 0
          ? rawData
          : [];
      return { communityId, messages: msgs };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load messages');
    }
  }
);

export const fetchStudentProfileData = createAsyncThunk(
  'student/fetchProfileData',
  async (_, { rejectWithValue }) => {
    try {
      const [settingsRes, attendRes, perfRes] = await Promise.all([
        studentApi.getSettings().catch(() => ({ data: null })),
        studentApi.getAttendanceAnalytics().catch(() => ({ data: defaultAttendanceAnalytics })),
        studentApi.getCoursePerformance().catch(() => ({ data: defaultCoursePerformance })),
      ]);

      const rawSettings = (settingsRes as any)?.data || settingsRes;
      const rawAttend = (attendRes as any)?.data || attendRes;
      const rawPerf = (perfRes as any)?.data || perfRes;

      return {
        settings: rawSettings || null,
        attendanceAnalytics: rawAttend?.monthlyAttendance ? rawAttend : defaultAttendanceAnalytics,
        coursePerformance: Array.isArray(rawPerf) && rawPerf.length > 0 ? rawPerf : defaultCoursePerformance,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load profile data');
    }
  }
);

// ──────────────────────────────────────────
// Slice
// ──────────────────────────────────────────
const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setSelectedCommunity: (state, action) => {
      state.selectedCommunityId = action.payload;
    },
    updateLocalSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    resetStudentState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentFullDashboard.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStudentFullDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload.dashboard;
        state.stats = action.payload.stats;
        state.courseCompletion = action.payload.courseCompletion;
        state.studyHours = action.payload.studyHours;
        state.feeSummary = action.payload.feeSummary;
        state.feeCourses = action.payload.feeCourses;
        state.classes = action.payload.classes;
        state.assessments = action.payload.assessments;
        state.enrolledCourses = action.payload.enrolledCourses;
        state.certificates = action.payload.certificates;
        state.upcomingActivities = action.payload.upcomingActivities;
      })
      .addCase(fetchStudentFullDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchStudentPayments.fulfilled, (state, action) => { state.payments = action.payload; })
      .addCase(fetchStudentCourses.fulfilled, (state, action) => { state.enrolledCourses = action.payload; })
      .addCase(fetchStudentCertificates.fulfilled, (state, action) => { state.certificates = action.payload; })
      .addCase(fetchStudentReferral.fulfilled, (state, action) => { state.referral = action.payload; })
      .addCase(fetchStudentAssessments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStudentAssessments.fulfilled, (state, action) => {
        state.loading = false;
        state.assessments = action.payload;
      })
      .addCase(fetchStudentAssessments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(sendCommunityMessage.fulfilled, (state, action) => {
        const comm = state.communities.find((c) => c.id === action.payload.communityId);
        if (comm) comm.messages.push(action.payload.message);
      })
      .addCase(updateStudentSettings.fulfilled, (state, action) => { state.settings = { ...state.settings, ...action.payload }; })
      .addCase(fetchStudentCommunities.pending, (state) => { state.loading = true; })
      .addCase(fetchStudentCommunities.fulfilled, (state, action) => {
        state.loading = false;
        // Preserve messages already in state for each community
        state.communities = action.payload.map((incoming: any) => {
          const existing = state.communities.find((c) => c.id === incoming.id);
          return { ...incoming, messages: existing?.messages?.length ? existing.messages : incoming.messages };
        });
        if (!state.selectedCommunityId && action.payload.length > 0) {
          state.selectedCommunityId = action.payload[0].id;
        }
      })
      .addCase(fetchStudentCommunities.rejected, (state) => { state.loading = false; })
      .addCase(fetchCommunityMessages.fulfilled, (state, action) => {
        const comm = state.communities.find((c) => c.id === action.payload.communityId);
        if (comm) {
          comm.messages = action.payload.messages;
        }
      })
      .addCase(fetchStudentProfileData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStudentProfileData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.settings) {
          state.settings = { ...state.settings, ...action.payload.settings };
        }
        state.attendanceAnalytics = action.payload.attendanceAnalytics;
        state.coursePerformance = action.payload.coursePerformance;
      })
      .addCase(fetchStudentProfileData.rejected, (state) => {
        state.loading = false;
      })
      .addMatcher(
        (action) =>
          action.type === 'auth/logout/fulfilled' ||
          action.type === 'auth/logout/rejected' ||
          action.type === 'auth/forceLogout',
        () => initialState
      );
  },
});

export const { setSelectedCommunity, updateLocalSettings, resetStudentState } = studentSlice.actions;
export default studentSlice.reducer;
