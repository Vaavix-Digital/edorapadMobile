// ==========================================
// Edorapad Shared TypeScript Type Definitions
// ==========================================

export const USER_ROLES = {
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  ONLINETUTOR: 'ONLINE_TUTOR',
  OFFLINETUTOR: 'OFFLINE_TUTOR',
  INSTITUTE: 'INSTITUTE',
  ACCOUNTS_MARKETING: 'ACCOUNT_&_MARKETING',
  COURSE_CREATOR: 'COURSE_CREATOR',
  PARENT: 'PARENT'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
} as const;

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS];

export const FEATURES = {
  DOCUMENT_UPLOAD: 'document_upload',
  ADVANCED_SEARCH: 'advanced_search',
  AI_ANALYSIS: 'ai_analysis',
  COLLABORATION: 'collaboration',
  API_ACCESS: 'api_access',
  CUSTOM_BRANDING: 'custom_branding',
  PRIORITY_SUPPORT: 'priority_support',
  UNLIMITED_STORAGE: 'unlimited_storage',
  TEAM_MANAGEMENT: 'team_management',
  ANALYTICS: 'analytics',
  PARENT_DASHBOARD: 'parent_dashboard',
  COURSE_CREATION: 'course_creation'
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

export interface User {
  id: string;
  _id?: string;
  email: string;
  name: string;
  role: UserRole;
  subscription?: SubscriptionPlan;
  avatar?: string;
  phone?: string;
  permissions?: string[];
  createdAt?: string;
  lastLogin?: string | null;
  instituteId?: string;
  studentCustomId?: string;
  staffCustomId?: string;
  batchId?: string;
  departmentId?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  token?: string;
  data?: User;
  user?: User;
}

export interface AttendanceRecord {
  id?: string;
  staffId?: string;
  studentId?: string;
  name: string;
  customId?: string;
  role?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'Half Day' | string;
  inTime?: string | null;
  outTime?: string | null;
  remarks?: string;
  isSaved?: boolean;
}

export interface StaffDailyWorksheetItem {
  id: string;
  name: string;
  staffCustomId?: string;
  role?: string;
  attendance?: {
    status?: string;
    inTime?: string;
    outTime?: string;
    remarks?: string;
  } | null;
  workHours?: string;
  suggestedStatus?: string;
}

export interface StaffMonthlyItem {
  id: string;
  name: string;
  staffCustomId?: string;
  days: Record<number | string, 'P' | 'A' | 'L' | '-' | string>;
  summary: {
    present: number;
    absent: number;
    leave?: number;
    percentage: string | number;
  };
}

export interface StaffMonthlyReportData {
  daysInMonth: number;
  data: StaffMonthlyItem[];
}

export interface StaffAttendanceStats {
  total: number;
  present: number;
  absent: number;
  leave: number;
}

export interface StudentAttendanceDay {
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'Holiday';
  subject?: string;
  batchName?: string;
  remarks?: string;
}

export interface MonthlyAttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  percentage: number;
  records: StudentAttendanceDay[];
}

export interface BatchCourseInfo {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  thumbnailUrl?: string;
}

export interface BatchTutorInfo {
  id?: string;
  _id?: string;
  name?: string;
  staffCustomId?: string;
  role?: string;
  profilePicUrl?: string;
}

export interface Batch {
  id: string;
  _id?: string;
  name: string;
  courseId?: string;
  course?: BatchCourseInfo;
  courseName?: string;
  tutorId?: string;
  tutor?: BatchTutorInfo;
  tutorName?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: string;
  _count?: {
    students?: number;
  };
  totalStudents?: number;
  students?: any[];
  schedule?: string;
  timing?: string;
  status?: 'active' | 'completed' | 'upcoming' | string;
  createdAt?: string;
}

export interface LiveClass {
  id: string;
  _id?: string;
  title: string;
  batchId: string;
  batchName?: string;
  tutorId: string;
  tutorName?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  meetingLink?: string;
  roomUrl?: string;
  description?: string;
}

export interface Exam {
  id: string;
  _id?: string;
  title: string;
  subject?: string;
  category?: 'EXAM' | 'QUIZ' | 'ASSIGNMENT' | string;
  batchId?: string;
  batchName?: string;
  batch?: { id?: string; name?: string; code?: string; courseId?: string } | string;
  date?: string;
  dueDate?: string;
  startDate?: string;
  durationMinutes?: number;
  duration?: number;
  totalMarks?: number;
  passMarks?: number;
  passingMarks?: number;
  status?: string;
  submissions?: {
    id?: string;
    status?: 'SUBMITTED' | 'GRADED' | 'PENDING' | string;
    score?: number;
    grade?: string;
    submittedAt?: string;
  }[];
  score?: number;
  grade?: string;
  remarks?: string;
}

export interface FeeDetail {
  courseId: string;
  courseTitle: string;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate?: string;
  paymentStatus: 'Completed' | 'Partial' | 'Pending';
  installmentPlan?: {
    installmentNo: number;
    amount: number;
    dueDate: string;
    status: 'Paid' | 'Pending' | 'Overdue';
  }[];
}

export interface Invoice {
  id: string;
  _id?: string;
  transactionId?: string;
  studentName?: string;
  studentId?: string;
  courseId?: string;
  courseName?: string;
  courseTitle?: string;
  course?: { id?: string; title?: string };
  amount: number;
  currency?: string;
  paymentMethod?: string;
  createdAt?: string;
  paidAt?: string;
  date?: string;
  dueDate?: string;
  receiptUrl?: string;
  status: 'Completed' | 'Pending' | 'SUCCESS' | 'FAILED' | 'PENDING' | string;
  instituteName?: string;
}

export interface AppNotification {
  id: string;
  _id?: string;
  title?: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface LeaveStaffInfo {
  id?: string;
  name?: string;
  staffCustomId?: string;
  role?: string;
  profilePicUrl?: string;
  email?: string;
}

export interface LeaveRequest {
  id: string;
  _id?: string;
  userId?: string;
  userName?: string;
  role?: string;
  staff?: LeaveStaffInfo;
  type?: 'Paid' | 'Unpaid' | 'Casual' | 'Medical' | string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  appliedAt?: string;
  createdAt?: string;
  approvedBy?: string;
  reviewedBy?: string;
  reviewRemarks?: string;
}

export interface CertificateStats {
  pendingRequests: number;
  approvedRequests: number;
  templatesCount: number;
  generatedCertificates: number;
}

export interface CertificateRequestStudent {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  studentCustomId?: string;
  phone?: string;
}

export interface CertificateRequestCourse {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
}

export interface CertificateRequestBatch {
  id?: string;
  _id?: string;
  name?: string;
}

export interface CertificateRequest {
  id: string;
  _id?: string;
  studentId?: string;
  student?: CertificateRequestStudent;
  courseId?: string;
  course?: CertificateRequestCourse;
  batchId?: string;
  batch?: CertificateRequestBatch;
  tutorRemarks?: string;
  status: 'Pending' | 'approved' | 'rejected' | 'completed' | 'generated' | string;
  statusReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CertificateTemplate {
  id: string;
  _id?: string;
  name: string;
  certificateTitle?: string;
  instituteName?: string;
  footerText?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  isDefault?: boolean;
  status?: string;
  logoUrl?: string;
  signatureUrl?: string;
  sealUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssuedCertificate {
  id: string;
  _id?: string;
  certificateNumber?: string;
  studentId?: string;
  student?: CertificateRequestStudent;
  courseId?: string;
  course?: CertificateRequestCourse;
  batchId?: string;
  batch?: CertificateRequestBatch;
  certificateUrl?: string | null;
  certificateType?: string;
  issuedBy?: string;
  issueDate?: string;
  createdAt?: string;
  generatedAt?: string;
}

