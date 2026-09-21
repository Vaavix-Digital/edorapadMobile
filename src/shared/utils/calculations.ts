// ==========================================
// Academic & Finance Calculations
// ==========================================

export const calculateAttendancePercentage = (
  presentDays: number,
  totalDays: number
): number => {
  if (!totalDays || totalDays <= 0) return 0;
  const percentage = (presentDays / totalDays) * 100;
  return Math.round(percentage * 10) / 10;
};

export const calculateFeeSummary = (courses: Array<{ totalFee?: number; paidAmount?: number; pendingAmount?: number }>) => {
  return courses.reduce(
    (acc, curr) => {
      const total = Number(curr.totalFee) || 0;
      const paid = Number(curr.paidAmount) || 0;
      const pending = Number(curr.pendingAmount) || (total - paid);

      acc.totalFees += total;
      acc.totalPaid += paid;
      acc.totalPending += pending;
      return acc;
    },
    { totalFees: 0, totalPaid: 0, totalPending: 0 }
  );
};

export const calculateExamGrade = (score: number, totalMarks: number): { grade: string; passed: boolean } => {
  if (!totalMarks || totalMarks <= 0) return { grade: 'N/A', passed: false };
  const percentage = (score / totalMarks) * 100;

  if (percentage >= 90) return { grade: 'A+', passed: true };
  if (percentage >= 80) return { grade: 'A', passed: true };
  if (percentage >= 70) return { grade: 'B', passed: true };
  if (percentage >= 60) return { grade: 'C', passed: true };
  if (percentage >= 50) return { grade: 'D', passed: true };
  return { grade: 'F', passed: false };
};

export const formatCurrency = (amount: number | string = 0, currencyCode: string = 'INR'): string => {
  const num = Number(amount) || 0;
  const code = (currencyCode || 'INR').toUpperCase();
  try {
    return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'INR' ? 0 : 2,
      maximumFractionDigits: 2
    }).format(num);
  } catch (e) {
    return `${code} ${num.toLocaleString()}`;
  }
};
